/*this is a cool function, I'll keep it here for posterity in case I need it.. at least for this commit.
function autogenObj(mapping){
    if(IsPrimitive(mapping))   return undefined;    //could return [] here for 1 to 1 mapping, idk.
    var object = {};
    for(var key in mapping){
        var obj = object;
        var karr = key.split(/[\.\[\]\'\"]/).filter(p => p);
        var keyLast = karr.pop();
        obj = karr.reduce((o, p) => obj = o[p] = {}, obj);
        obj[keyLast] = autogenObj(mapping[key]);
    }
    return object;
} */

function unbind(obj, key, els){
    var val = obj[key];
    delete obj[key];
    obj[key] = val;
    for(var i = els.length-1; i >= 0; --i){
        els[i].e.removeEventListener(els[i].l, els[i].s, true);
        delete els[i].s;
    }
}

export var OPS = function(op){ this.c = op; }//operation selector class

export function UnBind(){ return new OPS(unbind); }

export function ReBind(element, type, callback){
    return new OPS((obj, key, els)=>{  
        unbind(obj, key, els);
        var mapping = {};
        mapping[key] = Spindle.Link(element, type, callback);
        Spindle.Bind(obj, mapping);
    });
}

//AddBind
//RemoveBind
//ChangeBind
//GetBound