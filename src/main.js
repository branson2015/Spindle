import * as Att from './attributes.js'
import * as Aux from './Auxillary.js'
export {UnBind, ReBind} from './Auxillary.js';

//experiment with putting getters/setters on EVERY object for more complex assignment options? - trickle-down assign in setter?

export function LINK(element, type, callback){ this.e = element,   this.t = type, this.c = callback; }
export function Link(e, t, c){ return new LINK(e['elements'] || e, e['type'] || t, e['callback'] || c); }//TODO: do type checking here?

export function Bind(options){    
    var object = options['object'];
    if(object === undefined)    object = {}, options['modifiable'] = true;
    reduce(object, options['mapping'], toElements(options['scopes'] || document), options['modifiable'] || true);
    return object;
 }

function reduce(object, mapping, scopes, modifiable){
    for(var key in mapping){
        var obj = object, id = mapping[key];

        var karr = key.split(/[\.\[\]\'\"]/).filter(p => p);
        key = karr.pop();
        karr.reduce((o, p) => obj = (o[p] === undefined && modifiable) ? {} : o[p], obj);
        
        if(IsPrimitive(id)) 
            bindobj(obj, key, bundle(obj, key, scopes, id));
        else{
            if(obj[key] === undefined && modifiable)  obj[key] = {};
            reduce(obj[key], id, scopes, modifiable);   
        }
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

    Object.defineProperty(obj, key, {
        get: ()=>{ return value; },
        set: (v)=>{ if(v instanceof Aux.OPS) return v.c(obj, key, els); value = v; for(var i = els.length-1; i >= 0; --i){els[i].e[els[i].t] = v; if(els[i].c) els[i].c(v, els[i].e, els[i].t, i)} },
    });
}

function bundle(obj, key, scopes, ids){
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
    for(var i = 0, ilen = elements.length; i < ilen; ++i){
        function set(event){obj[key] = els[i].e[els[i].t];}
        var listenType = Att.getDefaultInteract(elements[i].tagName);
        var L, S;
        if(listenType === 'input')  S = set, L = listenType, elements[i].addEventListener(listenType, S, true);
        els.push({
            e: elements[i],
            t: Array.isArray(types) ? types[i] : types || Att.getDefaultAttribute(elements[i].tagName), 
            c: Array.isArray(callbacks) ? callbacks[i] : callbacks,
            l: L,
            s: S
        });
    }
    return els;
}

function toElements(object, scope = document){    
    if(object === 'scope')                      return [scope];
    else if(typeof object === 'string')         return Array.from(scope.querySelectorAll(object));
    else if(object instanceof HTMLCollection)   return Array.from(object);
    else if(object instanceof HTMLElement || object instanceof HTMLDocument)      return [object];
}

function IsPrimitive(id){ return typeof id === 'string' || id instanceof LINK || id instanceof HTMLElement || id instanceof HTMLCollection; }