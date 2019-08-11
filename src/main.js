import * as Att from './attributes.js'
import * as Aux from './Auxillary.js'
export {UnBind, ReBind, Link} from './Auxillary.js'
export {getDefaultAttribute} from './attributes.js'

export function Bind(options){    
    var object = options['object'] || {};
    reduce(object, options['mapping'], Aux.toElements(options['scopes'] || document), function(o,k,i,s){ bindobj(o, k, bundle(o, k, s, i)); });
    return object;
 }

function addSetter(karr, obj, key, scopes){
    if(obj[key] === undefined){
        Number.isInteger(+karr[0]) ? obj[key] = [] : obj[key] = {}
        var value = obj[key];
        Object.defineProperty(obj, key, {
            get: function(){return value},
            set: function(v){ reduce(obj[key], v, scopes, function(o,k, i){ o[k]=i; }); value = obj[key]; },
            configurable: true
        });
    }
    return obj[key];
}

 function reduce(object, mapping, scopes, primitivecb){
    for(var key in mapping){
        var obj = object, id = mapping[key];

        var karr = key.split(/[\.\[\]\'\"]/).filter(function(p){ return p; });
        var key = karr.shift();
        for(; karr.length; key = karr.shift())
            obj = addSetter(karr, obj, key, scopes);
        
        if(Aux.IsPrimitive(id))
            primitivecb(obj, key, id, scopes);
        else{
            addSetter(karr, obj, key, scopes);  
            reduce(obj[key], id, scopes, primitivecb);
        }
    }
}

function bindobj(obj, key, els){
    var value = obj[key];

    if(value !== undefined && Array.isArray(value)){  //establish 1 to 1 binding (recurse)
        for(var i = 0; i < els.length; ++i){ bindobj(value, i, [els[i]]); }  return;
    }else if(value !== undefined)//establish 1 to all binding (all may be just 1 element)
        for(var i = 0; i < els.length; ++i)  els[i].e[els[i].t] = value;
    else if(els.length == 1) value = els[0].e[els[0].t]; //if only 1 element total is present and value is undefined, assign value to element
    else value = null;   //if only 1 value and many elements with potentially different values, initialize value to be null

    Object.defineProperty(obj, key, {
        get: function(){ return els[0].rc ? els[0].rc(value) : value; },
        set: function(v){ 
            if(v instanceof Aux.OPS) return v.c(obj, key, els); 
            value = v; 
            for(var i = 0; i < els.length; ++i){
                els[i].e[els[i].t] = els[i].tc ? els[i].tc(v) : v; 
                if(els[i].c) els[i].c(v, els[i].e, els[i].t, i)
            } 
        },
        configurable: true
    });
}

function bundle(obj, key, scopes, elements){
    var types, callbacks, retrieve, transforms;

    if(elements instanceof Aux.LINK) types = elements.t, callbacks = elements.c, retrieve = elements.rc, transforms = elements.tc, elements = elements.e;
    elements = Aux.toElements(elements, scopes);
    
    var S;
    var els = [];
    for(var i = 0; i < elements.length; ++i){
        if(elements[i].tagName === 'INPUT'){      //maybe get rid of this if statement?
            (function(i){S = function(event){obj[key] = els[i].e[els[i].t];}})(i)
            elements[i].addEventListener('input', S, true);
        }
        els.push({
            e: elements[i],
            t: Array.isArray(types) ? types[i] : types || Att.getDefaultAttribute(elements[i].tagName), 
            c: Array.isArray(callbacks) ? callbacks[i] : callbacks,
            tc: Array.isArray(transforms) ? transforms[i] : transforms,
        });
        elements[i].Spindle = {'obj': obj, 'key': key, 's': S};
    }
    els[0].rc = retrieve;
    return els;
}