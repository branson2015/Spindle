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
        Spindle.Bind({'object': obj, 'mapping': mapping});
    });
}

//AddBind
//RemoveBind
//ChangeBind
//GetBound