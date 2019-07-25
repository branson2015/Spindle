import * as Att from './attributes.js'
import * as Aux from './Auxillary.js'

//TODO: make get function that returns which element(s) the object is bound to
//make different ways of binding function (auto create object, make window the htmlScope, etc)
//make unbind/rebind >>functions<<
//consider using link object for everything, as it provides type safety

function LINK(element, type, callback){ this.e = element,   this.t = type, this.c = callback; }
export function link(e, t, c){  //TODO: do type checking here
    return new LINK(e['elements'] || e, e['type'] || t, e['callback'] || c);
}

export function Bind(object, htmlScope, mapping){
    reduce(object, toElements(htmlScope), mapping);
}

export function reduce(object, scopes, mapping){
    for(var key in mapping){
        var obj = object, id = mapping[key];

        var karr = key.split(/[\.\[\]\'\"]/).filter(p => p);
        key = karr.pop();
        obj = karr.reduce((o, p) => o[p] , obj);
        
        if(typeof id === 'string' || id instanceof LINK || id instanceof HTMLElement || id instanceof HTMLCollection)    //"primitive types" that should not be further recursed
            bindobj(obj, key, bundle(scopes, id));
        else
            reduce(obj[key], scopes, id);   
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
        var listenType = Att.getDefaultInteract(els[i].e.tagName);
        if(listenType === 'input')   //TODO: make this more encompassing of input types
            ((i)=>{els[i].e.addEventListener(listenType, (event)=>{obj[key] = els[i].e[els[i].t];});})(i);
    }

    (()=>{
        var val = value;
        Object.defineProperty(obj, key, {
            get: ()=>{return val;  },
            set: (v)=>{val = v; for(var i = els.length-1; i >= 0; --i){els[i].e[els[i].t] = v; if(els[i].c) els[i].c(v)} },
    });})();
}

//TODO: maybe make scope element queriable as well?
function bundle(scopes, identifiers){
    var arr = [];

    identifiers = identifiers instanceof LINK ? [identifiers]: toElements(identifiers);
    for(var i = identifiers.length-1; i >= 0; --i){
        var id = identifiers[i];
        if(id instanceof LINK)
            arr = arr.concat(toEls(toElements(id.e), id.t, id.c));
        else
            arr = arr.concat(toEls(toElements(id)));
    }
    return arr;
}

function toElements(object){    
    if(typeof object === 'string')              return Array.from(document.querySelectorAll(object));
    else if(object instanceof HTMLCollection)   return Array.from(object);
    else if(object instanceof HTMLElement)      return [object];
    else if(object[0] instanceof HTMLElement)   return object;
}

function toEls(elements, types, callbacks = []){
    var els = [];
    for(var i = elements.length-1; i >= 0; --i)
        els.push({
            e: elements[i],
            t: Array.isArray(types) ? types[i] : types || Att.getDefaultAttribute(elements[i].tagName), 
            c: Array.isArray(callbacks) ? callbacks[i] : callbacks
        });
    return els;
}