import * as Att from './attributes.js'
import * as Aux from './Auxillary.js'
export {UnBind, ReBind} from './Auxillary.js';

//TODO: make get function that returns which element(s) the object is bound to
//make different ways of binding function (auto create object, make window the htmlScope, etc)

/****/ function LINK(element, type, callback){ this.e = element,   this.t = type, this.c = callback; }
export function Link(e, t, c){ return new LINK(e['elements'] || e, e['type'] || t, e['callback'] || c); }//TODO: do type checking here?
export function Bind(object, mapping, htmlScope = document){ reduce(object, mapping, toElements(htmlScope)); }

function reduce(object, mapping, scopes){
    for(var key in mapping){
        var obj = object, id = mapping[key];

        var karr = key.split(/[\.\[\]\'\"]/).filter(p => p);
        key = karr.pop();
        obj = karr.reduce((o, p) => o[p] , obj);
        
        if(typeof id === 'string' || id instanceof LINK || id instanceof HTMLElement || id instanceof HTMLCollection)    //"primitive types" that should not be further recursed
            bindobj(obj, key, bundle(scopes, id));
        else
            reduce(obj[key], id, scopes);   
    }
}

function bindobj(obj, key, els){
    var value = obj[key];

    //this code decides on what the value for the elements should be
    if(value !== undefined && Array.isArray(value)){  //establish 1 to 1 binding (recurse)
        for(var i = els.length-1; i >= 0; --i){ bindobj(value, i, [els[i]]); }  return;
    }else if(value !== undefined)//establish 1 to all binding (all may be just 1 element)
        for(var i = els.length-1; i >= 0; --i)
            els[i].e[els[i].t] = value;
    else if(els.length == 1)  //if only 1 element total is present and value is undefined, assign value to element
        value = els[0].e[els[0].t];
    
    //set the eventListeners on the correct type (if applies)TODO: make only ONE object have a callback function, otherwise it will fire for every other attached object
    for(var i = els.length-1; i >= 0; --i){
        ((i)=>{
            function set(event){obj[key] = els[i].e[els[i].t];}
            var listenType = Att.getDefaultInteract(els[i].e.tagName);
            if(listenType === 'input'){//TODO: make this more encompassing of input types
                els[i].l = listenType, els[i].s = set, els[i].e.addEventListener(listenType, els[i].s, true);}
        })(i);
    }

    Object.defineProperty(obj, key, {
        get: ()=>{ return value; },
        set: (v)=>{ if(v instanceof Aux.OPS) return v.c(obj, key, els); value = v; for(var i = els.length-1; i >= 0; --i){els[i].e[els[i].t] = v; if(els[i].c) els[i].c(v, els[i].e, els[i].t, i)} },
    });
}

function bundle(scopes, ids){
    var elements = [], types, callbacks;

    //TODO: this is kinda ugly, might wanna refactor a lil.. dunno how..
    if(ids instanceof LINK) types = ids.t, callbacks = ids.c, ids = [ids.e];    
    else if(typeof ids === 'string') ids = [ids]; 
    if(Array.isArray(ids))
        for(var j = 0, jlen = scopes.length; j < jlen; ++j)
            for(var i = 0, ilen = ids.length; i < ilen; ++i)
                elements = elements.concat(toElements(ids[i], scopes[j]));
    else   //only fallbacks for HTMLCollection and HTMLElement here
        elements = toElements(ids);//this is kind of a waste of the function
            
    var els = [];
    for(var i = elements.length-1; i >= 0; --i)
        els.push({
            e: elements[i],
            t: Array.isArray(types) ? types[i] : types || Att.getDefaultAttribute(elements[i].tagName), 
            c: Array.isArray(callbacks) ? callbacks[i] : callbacks
        });
    return els;
}

function toElements(object, scope = document){    
    if(object === 'scope')                      return [scope];
    else if(typeof object === 'string')         return Array.from(scope.querySelectorAll(object));
    else if(object instanceof HTMLCollection)   return Array.from(object);
    else if(object instanceof HTMLElement || object instanceof HTMLDocument)      return [object];
}