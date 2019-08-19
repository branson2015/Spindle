import * as Att from './attributes.js'
import * as Aux from './Auxillary.js'
export {UnBind, ReBind, Link} from './Auxillary.js'
export {getDefaultAttribute} from './attributes.js'

//TODO: put obj, key, and S into els
//Spindle.Link share
//addbind/changebind

export function Bind(options){    
    var object = options['object'] || {};
    var scopes = options['scopes'] ? Aux.toElements(options['scopes']) : [document];
    if(scopes.length === 1) reduce(object, options['mapping'], scopes[0], makeEls );
    else if(Array.isArray(object)) for(var i = 0; i < scopes.length; ++i)  reduce(object[i] || (object[i] = {}), options['mapping'], scopes[i], makeEls );
    else throw 'Given multiple scopes, but object is not of Array type, instead got ' + object;
    return object;
 }

function addSetter(obj, key, scope){
    if(Object.getOwnPropertyDescriptor(obj, key).set === undefined){
        var value = obj[key];
        Object.defineProperty(obj, key, {
            get: function(){return value},
            set: function(v){ reduce(obj[key], v, scope, function(o,k,i){ o[k]=i; }); value = obj[key]; },
            configurable: true
        });
    }
}

 function reduce(object, mapping, scope, primitivecb){
    for(var key in mapping){
        var obj = object, id = mapping[key];

        var karr = key.split(/[\.\[\]\'\"]/).filter(function(p){ return p; });
        var key = karr.shift();
        for(; karr.length; key = karr.shift()){
            obj[key] ||  (obj[key] = Number.isInteger(+karr[0]) ? [] : {});
            addSetter(obj, key, scope);
            obj = obj[key];
        }
        
        if(Aux.IsPrimitive(id))
            primitivecb(obj, key, id, scope);
        else{
            obj[key] || (obj[key] = {});    //could this ever be array?
            addSetter(obj, key, scope);  
            reduce(obj[key], id, scope, primitivecb);
        }
    }
}

function bindobj(obj, key, els, scope){

    if(Array.isArray(els.v)){  //establish 1 to 1 binding (recurse)
        obj[key] = []; 
        addSetter(obj, key, scope)
        for(var i = 0; i < els.length; ++i){
            var val = [els[i]]; 
            val.v = els.v[i]; 
            bindobj(obj[key], i, val, scope); 
        }  
        return;
    }else if(els.v !== undefined)//establish 1 to all binding (all may be just 1 element)
        for(var i = 0; i < els.length; ++i)  els[i].e[els[i].t] = els.v;
    else if(els.length == 1) els.v = els[0].e[els[0].t]; //if only 1 element total is present and value is undefined, assign value to element
    else els.v = null;   //if only 1 value and many elements with potentially different values, initialize value to be null
    
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
        get: function(){ return els.v; },
        set: function(v){ 
            if(v instanceof Aux.OPS) return v.c(obj, key, els); 
            els.v = v; 
            for(var i = 0; i < els.length; ++i){
                if(!els.dirty) els[i].e[els[i].t] = els[i].tc ? els[i].tc(v) : v; 
                if(els[i].c) els[i].c(v, els[i].e, els[i].t, i)
            } 
            delete els.dirty;
        },
        configurable: true
    });
}

function makeEls(obj, key, primitive, scope){
    if(Array.isArray(obj[key])) addSetter(obj,key,scope);
    var types, values, callbacks, retrieves, transforms;

    if(primitive instanceof Aux.LINK) types = primitive.t, values = primitive.v, callbacks = primitive.c, retrieves = primitive.rc, transforms = primitive.tc, primitive = primitive.e;
    primitive = Aux.toElements(primitive, scope);
    if(primitive.length === 0)  return;
    
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
    els.v = values || obj[key];
    bindobj(obj, key, els, scope);
}