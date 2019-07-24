import * as Att from './attributes.js'
import * as Aux from './Auxillary.js'

//TODO: make get function that returns which element(s) the object is bound to
//make different ways of binding function (auto create object, make window the htmlScope, etc)
//make unbind/rebind >>functions<<

function LINK(element, type, callback){
    this['e'] = element;
    this['t'] = type;
    this['c'] = callback;
}

//TODO: try to make this be the link object instead of having hte seperate LINK function somehow
export function link(element, type, callback){
    if(typeof element === 'object') return new LINK(element['elements'], element['type'], element['callback']);
    return new LINK(element, type, callback)
}

export function Bind(object, htmlScope, mapping){
    if(typeof htmlScope === 'string')                   htmlScope = Array.from(document.querySelectorAll(htmlScope));
    else if(htmlScope.constructor === HTMLCollection)   htmlScope = Array.from(htmlScope);
    else if(isElement(htmlScope))                       htmlScope = [htmlScope];
    else if(!isElement(htmlScope[0]))   throw 'bad element identifier';
    reduce(object, htmlScope, mapping);
}

export function reduce(object, scopes, mapping){
    for(var key in mapping){
        var obj = object;
        
        var id = mapping[key];
        var lowest = false;
        if(typeof id === 'string' || id.constructor === LINK || isElement(id) || id.constructor === HTMLCollection)   //keep objects in object form, put into recursion (also includes arrays)
            id = bundle(scopes, id), lowest = true;

        //shortcut - still redo this.
        key = key.split('.');
        var curr = [key.shift()];
        for(; key.length > 0; curr = [key.shift()])
            var index = getIndex(curr), obj = (index !== -1) ? obj[curr[0]][index] : obj[curr[0]];
        var index = getIndex(curr);
        if(index !== -1)
            obj = obj[curr[0]], curr[0] = index;
        key = curr[0];

        if(typeof obj[key] === 'object' && !lowest){
            reduce(obj[key], scopes, id); continue;
        }

        bindobj(obj, key, id);
    }
}

function bindobj(obj, key, els){
    var value = obj[key];

    //this code decides on what the value for the elements should be
    if(value !== undefined && value.constructor === Array){  //establish 1 to 1 binding (recurse)
        for(var i = els.length-1; i >= 0; --i){ bindobj(value, i, [els[i]]); }  return;
    }else if(value !== undefined)//establish 1 to all binding (all may be just 1 element)
        for(var i = els.length-1; i >= 0; --i)
            els[i]['e'][els[i]['t']] = value;
    else if(els.length == 1)  //if only 1 element total is present and value is undefined, assign value to element
        value = els[0]['e'][els[0]['t']];
    
    //set the eventListeners on the correct type (if applies)
    for(var i = els.length-1; i >= 0; --i){
        var listenType = Att.getDefaultInteract(els[i]['e'].tagName)
        if(listenType == 'input')   //TODO: make this more encompassing of input types
            ((i)=>{els[i]['e'].addEventListener(listenType, (event)=>{obj[key] = els[i]['e'][els[i]['t']];});})(i);
    }

    //set events to fire here onchange (need closure for getter/setter)
    (()=>{
        var val = value;
        Object.defineProperty(obj, key, {
            get: ()=>{return val;  },
            set: (v)=>{val = v; for(var i = els.length-1; i >= 0; --i){els[i]['e'][els[i]['t']] = v; if(els[i]['c']) els[i]['c'](v)} },
    });})();
}

//TODO: maybe make scope element queriable as well?
function bundle(scopes, identifiers){
    var elements, type, callback;
    
    var arr = [];
    if(identifiers.constructor !== Array && identifiers.constructor !== HTMLCollection)   identifiers = [identifiers];
    for(var i = identifiers.length-1; i >= 0; --i){
        var id = identifiers[i];
        
        //if array?
        
        if(isElement(id)){
            arr.push({'e' : id, 't' : type || Att.getDefaultAttribute(id.tagName), 'c': undefined}); continue;
        }
        if(id.constructor === LINK){
            type = id['t'];
            callback = id['c'];
            id = id['e'];
        }
        
        if(typeof id === 'string'){
            var scopelen = scopes.length;   //caching the length so it doesn't have to recompute every time - just as fast as reverse for loop
            for(var j = 0; j < scopelen; ++j){
                elements = id
                if(typeof elements === 'string')
                    elements = scopes[j].querySelectorAll(elements);
                else if(elements.constructor !== Array)
                    throw elements
                
                var elementlen = elements.length;
                for(var k = 0; k < elementlen; ++k)
                    arr.push({'e' : elements[k], 't' : type || Att.getDefaultAttribute(elements[k].tagName), 'c': callback});
            }
            continue;
        }
    }
    return arr;
}

function getIndex(str, i = 0){
    var start = str[i].indexOf('[') + 1;
    var dist = str[i].indexOf(']') - start;
    var idx = parseInt(str[i].substr(start, dist), 10);
    if(start !== 0)   str[i] = str[i].substr(0, start-1);
    return isNaN(idx) ? -1 : idx;
}

function isElement(o){
    return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
    o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string");
}