function unbind(obj, key, els){
    var val = obj[key];
    delete obj[key];
    obj[key] = val;
    for(var i = els.length-1; i >= 0; --i){
        els[i].e.removeEventListener(els[i].l, els[i].s, true);
        delete els[i].s;
    }
}

function getOKE(obj, key, els){ return {o: obj, k: key, e: els}}

export var OPS = function(op){ this.c = op; }//operation selector class


//TODO: finish this crap
export function UnBind(elements){ return new OPS((obj, key, els)=>{
    if(elements === undefined)
        for(var i = els.length-1; i >= 0; --i)
            elements.push(els[i].e);
    for(var i = elements.length-1; i >= 0; --i)
        if(elements[i].SpindleBindObj){
            unbind(elements[i].SpindleBindObj, elements[i].SpindleBindKey, )
        }
            
});}

export function ReBind(element, type, callback){
    return new OPS((obj, key, els)=>{  
        unbind(obj, key, els);
        var mapping = {};
        mapping[key] = Spindle.Link(element, type, callback);
        Spindle.Bind({'object': obj, 'mapping': mapping});
    });
}

//AddBind
//ChangeBind