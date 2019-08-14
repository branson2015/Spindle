import * as Att from './attributes.js'
import * as Aux from './Auxillary.js'
export {UnBind, ReBind, Link} from './Auxillary.js'
export {getDefaultAttribute} from './attributes.js'

//TODO: impliment functions as primary type?
//put more info into els object?

export function Bind(options){    
    var object = options['object'] || {};
    reduce(object, options['mapping'], Aux.toElements(options['scopes'] || document), function(o,k,i,s){
        if(Array.isArray(o[k])) addSetter(o,k,s);
        bindobj(o,k,makeEls(i,s))
    });
    return object;
 }

function addSetter(obj, key, scopes){
    if(Object.getOwnPropertyDescriptor(obj, key).set === undefined){
        var value = obj[key];
        Object.defineProperty(obj, key, {
            get: function(){return value},
            set: function(v){ reduce(obj[key], v, scopes, function(o,k,i){ o[k]=i; }); value = obj[key]; },
            configurable: true
        });
    }
}

 function reduce(object, mapping, scopes, primitivecb){
    for(var key in mapping){
        var obj = object, id = mapping[key];

        var karr = key.split(/[\.\[\]\'\"]/).filter(function(p){ return p; });
        var key = karr.shift();
        for(; karr.length; key = karr.shift()){
            obj[key] ||  (obj[key] = Number.isInteger(+karr[0]) ? [] : {});
            addSetter(obj, key, scopes);
            obj = obj[key];
        }
        
        if(Aux.IsPrimitive(id)){
            primitivecb(obj, key, id, scopes);
        }else{
            obj[key] || (obj[key] = {});    //could this ever be array?
            addSetter(obj, key, scopes);  
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
    
    for(var i = 0; i < els.length; ++i){
        if(els[i].e.tagName === 'INPUT'){
            (function(i){
                var S = function(event){
                    els.dirty = true;
                    var val = els[i].e[els[i].t]; 
                    obj[key] = els[i].rc ? els[i].rc(val) : val; 
                    for(var j = 0; j < els.length; ++j) els[j].e[els[j].t] = val; 
                }
                els[i].e.addEventListener('input', S, true);
                els[i].e.Spindle = {'obj': obj, 'key': key, 's': S};
            })(i);
        }
    }

    Object.defineProperty(obj, key, {
        get: function(){ return value; },
        set: function(v){ 
            if(v instanceof Aux.OPS) return v.c(obj, key, els); 
            value = v; 
            for(var i = 0; i < els.length; ++i){
                if(!els.dirty) els[i].e[els[i].t] = els[i].tc ? els[i].tc(v) : v; 
                if(els[i].c) els[i].c(v, els[i].e, els[i].t, i)
            } 
            delete els.dirty;
        },
        configurable: true
    });
}

function makeEls(primitive, scopes){
    var types, callbacks, retrieves, transforms;

    if(primitive instanceof Aux.LINK) types = primitive.t, callbacks = primitive.c, retrieves = primitive.rc, transforms = primitive.tc, primitive = primitive.e;
    primitive = Aux.toElements(primitive, scopes);
    
    var els = [];
    for(var i = 0; i < primitive.length; ++i){
        els.push({
            e: primitive[i],
            t: Array.isArray(types) ? types[i] : types || Att.getDefaultAttribute(primitive[i].tagName), 
            c: Array.isArray(callbacks) ? callbacks[i] : callbacks,
            tc: Array.isArray(transforms) ? transforms[i] : transforms,
            rc: Array.isArray(retrieves) ? retrieves[i] : retrieves,
        });
    }
    return els;
}