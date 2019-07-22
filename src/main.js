import * as Att from './attributes.js'
import * as Aux from './Auxillary.js'

//TODO: make get function that returns which element(s) the object is bound to
//make different ways of binding function (auto create object, make window the htmlScope, etc)

function LINK(element, type, callback){
    this['element'] = element;
    this['type'] = type;
    this['callback'] = callback;
}

export function link(element, type, callback){
    if(typeof element === 'object') return new LINK(element['element'], element['type'], element['callback']);
    return new LINK(element, type, callback)
}

export function Bind(object, htmlScope, mapping){
    if(typeof htmlScope === 'string')                   htmlScope = Array.from(document.querySelectorAll(htmlScope));
    else if(htmlScope.constructor === HTMLCollection)   htmlScope = Array.from(htmlScope);
    else if(isElement(htmlScope))                       htmlScope = [htmlScope];
    else if(!isElement(htmlScope[0]))   throw 'bad element identifier';
    
    for(var key in mapping){
        var obj = object;
        
        var identifiers = mapping[key];
        if(typeof identifiers !== 'object' || identifiers.constructor === LINK || isElement(identifiers))   //keep objects in object form, put into recursion (also includes arrays)
            identifiers = [identifiers];

        if(typeof obj[key] === 'object'){
            Bind(obj[key], htmlScope, identifiers); continue;
        }
        
        //shortcuts (using weird arrays to hack in references)
        //todo: might want to find a more efficient way to redo this.
        key = key.split('.');
        var curr = [key.shift()];
        for(; key.length > 0; curr = [key.shift()])//length - 1 because if we go to length then obj[i] will be primitive and will not change obj[i], not a reference
            var index = getIndex(curr), obj = (index !== -1) ? obj[curr[0]][index] : obj[curr[0]];
        var index = getIndex(curr);
        if(index !== -1)
            obj = obj[curr[0]], curr[0] = index;

        bindobj(obj, curr[0], elementTypeBundle(htmlScope, identifiers));
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

function elementTypeBundle(htmlScope, identifiers){
    var els = [];
    for(var i = htmlScope.length-1; i >= 0; --i){
        var scope = htmlScope[i];
        for(var j = identifiers.length-1; j >= 0; --j){
            var id = identifiers[j];
            var el, type, callback;
            
            if(id.constructor === LINK)
                el = bundle(scope, id['element'], type = id['type'], callback = id['callback']);
            else if(typeof id === 'string' || isElement(id))
                el = bundle(scope, id, type);
            else
                throw 'error, object not in right form'
            els = els.concat(el);
        }
    }
    return els;
}

//TODO: maybe make scope element queriable as well?
function bundle(scope, query, type, callback){
    var group;
    if(typeof query === 'string')
        group = scope.querySelectorAll(query);
    else if(isElement(query))
        group = [query];
    else
        throw 'error'

    var b = [];
    for(var i = group.length-1; i >= 0; --i)
        b.push({'e' : group[i], 't' : type || Att.getDefaultAttribute(group[i].tagName), 'c': callback});
    return b;
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