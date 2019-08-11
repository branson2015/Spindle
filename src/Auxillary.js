export function LINK(elements, types, callbacks, retrieves, transforms){ this.e = elements, this.t = types, this.c = callbacks; this.rc = retrieves; this.tc = transforms; }
export function Link(obj){ return new LINK(obj['elements'], obj['types'], obj['callbacks'], obj['retrieves'], obj['transforms']); }

export var OPS = function(op){ this.c = op; }//operation selector class

export function toElements(object, scopes = [document]){    
    if(typeof object === 'string'){
        if(object === 'scopes')                                                         return scopes;
        var elements = [];
        for(var i = 0; i < scopes.length; ++i)
            elements = elements.concat(Array.from(scopes[i].querySelectorAll(object))); return elements;                                                             
    }else if(object instanceof LINK)                                                    return toElements(object.e, scopes);
    else if(object instanceof HTMLElement || object instanceof HTMLDocument)            return [object];
    else if(object instanceof HTMLCollection)                                           return Array.from(object);
    else throw 'Error: Expected Primary Type, instead got ' + object;
}

export function IsPrimitive(id){ return typeof id === 'string' || id instanceof LINK || id instanceof HTMLElement || id instanceof HTMLCollection; }

function unbind(element){
    var val = element.Spindle.obj[element.Spindle.key];
    delete element.Spindle.obj[element.Spindle.key];
    element.Spindle.obj[element.Spindle.key] = val;
    element.removeEventListener('input', element.Spindle.s, true);
    delete element.Spindle;
}

export function UnBind(elements){ return new OPS(function(obj, key, els){
    if(elements === undefined){
        elements = [];
        for(var i = 0; i < els.length; ++i)
            elements.push(els[i].e);
    }else elements = toElements(elements);
    for(var i = 0; i < elements.length; ++i)
        unbind(elements[i]);
});}

export function ReBind(elements){
    if(!(elements instanceof LINK)) elements = new LINK(elements);
    return new OPS(function(obj, key, els){  
        for(var i = 0; i < els.length; ++i)
            unbind(els[i].e);
        Spindle.Bind({'object': obj, 'mapping': {[key]: elements}});
    });
}

//AddBind
//ChangeBind