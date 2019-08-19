export function LINK(elements, types, values, callbacks, retrieves, transforms){ this.e = elements, this.t = types, this.v = values, this.c = callbacks; this.rc = retrieves; this.tc = transforms; }
export function Link(obj){ return new LINK(obj['elements'], obj['types'], obj['values'], obj['callbacks'], obj['retrieves'], obj['transforms']); }

export var OPS = function(op){ this.c = op; }//operation selector class

export function toElements(object, scope = document){    
    if(typeof object === 'string'){
        if(object === 'scope')                                              return scope;
        else                                                                return Array.from(scope.querySelectorAll(object));                                                              
    }else if(object instanceof LINK)                                        return toElements(object.e, scope);
    else if(object instanceof HTMLElement || object instanceof HTMLDocument)return [object];
    else if(object instanceof HTMLCollection)                               return Array.from(object);
    else throw 'Error: Expected Primary Type, instead got ' + object;
}

export function IsPrimitive(id){ return typeof id !== 'object' || id instanceof LINK || id instanceof HTMLElement || id instanceof HTMLCollection; }

export function unbind(element){
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
        window.Spindle.Bind({'object': obj, 'mapping': {[key]: elements}});
    });
}

//AddBind
//ChangeBind