import * as Att from './attributes.js'
import * as Aux from './Auxillary.js'
export {UnBind, ReBind} from './Auxillary.js'
export {getDefaultAttribute} from './attributes.js'

//TODO: experiment with putting getters/setters on EVERY object for more complex assignment options? - trickle-down assign in setter?
//fix setting objects with arrays vs setting them with primitives that will turn into arrays - above will handle this

export function LINK(elements, types, callbacks){ this.e = elements,   this.t = types, this.c = callbacks; }
export function Link(e, t, c){ return new LINK(e['elements'] || e, e['types'] || t, e['callbacks'] || c); }

export function Bind(options){    
    var object = options['object'] || {};
    reduce(object, options['mapping'], toElements(options['scopes'] || [document]));
    return object;
 }

function addSetter(karr, obj, key){
    if(obj[key] === undefined){
        Number.isInteger(+karr[0]) ? obj[key] = [] : obj[key] = {}
        //TODO
        Object.defineProperty(obj, key, {
            get: ()=>{},
            set: ()=>{}
        });
    }
    return obj[key];
}

 function reduce(object, mapping, scopes){
    for(var key in mapping){
        var obj = object, id = mapping[key];

        var karr = key.split(/[\.\[\]\'\"]/).filter(p => p);
        var key = karr.shift();
        for(; karr.length; key = karr.shift())  //create objects/properties to depth if they don't already exist
            obj = addSetter(karr, obj, key);
        addSetter(karr, obj, key);
        
        if(IsPrimitive(id)) 
            bindobj(obj, key, bundle(obj, key, scopes, id));
        else
            reduce(obj[key], id, scopes);   
    }
}

function bindobj(obj, key, els){
    var value = obj[key];

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
        configurable: true
    });
}

function bundle(obj, key, scopes, elements){
    var types, callbacks;

    if(elements instanceof LINK) types = elements.t, callbacks = elements.c, elements = elements.e;
    elements = toElements(elements, scopes);

    var els = [];
    for(var i = 0, S, L, ilen = elements.length; i < ilen; ++i){
        elements[i].SpindleBindObj = obj, elements[i].SpindleBindKey = key;
        if(elements[i].tagName === 'INPUT'){
            ((i)=>{S = function(event){obj[key] = els[i].e[els[i].t];}})(i)
            L = 'input'; elements[i].addEventListener('input', S, true);
        }
        els.push({
            t: Array.isArray(types) ? types[i] : types || Att.getDefaultAttribute(elements[i].tagName), 
            c: Array.isArray(callbacks) ? callbacks[i] : callbacks,
            e: elements[i], l: L, s: S
        });
    }
    return els;
}

function toElements(object, scopes = [document]){    
    if(object === 'scopes')                                                             return scopes;
    else if(typeof object === 'string'){
        var elements = [];
        for(var i = 0, ilen = scopes.length; i < ilen; ++i)
            elements = elements.concat(Array.from(scopes[i].querySelectorAll(object))); return elements;                                                             
    }else if(object instanceof LINK)                                                    return toElements(object.e, scopes);
    else if(object instanceof HTMLElement || object instanceof HTMLDocument)            return [object];
    else if(object instanceof HTMLCollection)                                           return Array.from(object);
}

function IsPrimitive(id){ return typeof id === 'string' || id instanceof LINK || id instanceof HTMLElement || id instanceof HTMLCollection; }