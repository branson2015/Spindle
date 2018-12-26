//TODO: make get function that returns which element(s) the object is bound to
//make different ways of binding function (auto create object, make window the htmlScope, etc)

/*
example usage:

var obj = {p1: 'val1', p2: 'val2', p3: ['val3.1', 'val3.2], p4: 'val4', p5: {p5-1: 'test', p5-2: 'test2'}};
var element = document.getElementById("test");
bind(obj, element, {
    //THESE ARE MAPPING OBJECT EXAMPLES
    p1: 'div.div.ul.li[0].a',
    p2: '.classname[0]',
    p3: '.classname',           -p3 will be an array
    p4: '#id'
    p5: {
       p5-1: document.getElementsByTagName("body")[0] 
    }

    'p6': 'whatever:type' - :type signifies class, innerHTML, innerText, etc (what value to bind to, innerHTML by default)    
    'p7': function(){...} - will return string in form of previous versions

    'p8': ['#id1', '#id2'] ---equivalent to below
    'p9': '#id1 #id2'      ---equivalent to above
    'p10[n]': '#id'
    p10: [
        p10_1: '#id' --- same as 'p10[0].p10_1': '#id'
    ]
    p11: {type: 'className', fn: function}
});
*/

export function UnBind(object){
    if(object === undefined)
        return;

    for(var property in object){
        if(typeof object[property] === 'object'){
            UnBind(object[property]);
            continue;
        }else{
            object[property] = UnBind(undefined);
        }
    }
}

export function ReBind(identifiers){
    if(!(this instanceof ReBind))
        return new ReBind(identifiers);
    this.identifiers = identifiers;
}

export function Bind(object, htmlScope, mapping){
    //for every mapping
    for(var key in mapping){    //key will always be string (maybe put in test/error out if not string)
        //reset obj to original object on each loop
        var obj = object;
        
        var identifiers = mapping[key];
        if(typeof identifiers === 'string')
            identifiers = identifiers.split(' ');
        else if(typeof identifiers !== 'object')   //keep objects in object form, put into recursion (also includes arrays)
            identifiers = [identifiers];

        //if the key is an object
        if(typeof obj[key] === 'object'){//identifier is always an object now
            //obj[key]['parent'] = obj;
            Bind(obj[key], htmlScope, identifiers);
            continue;
        }
        
        var nestedKey = key.split('.');
        for(var i = 0; i < nestedKey.length-1; i++){//length - 1 because if we go to length then obj[i] will be primitive and will not change obj[i], not a reference
            var index = getIndex(nestedKey[i]);
            if(index == -1)
                obj = obj[nestedKey[i]];    //change obj to be one up from lowest lying element specified in map
            else{
                nestedKey[i] = nestedKey[i].substr(0, nestedKey[i].indexOf('['));
                obj = obj[nestedKey[i]][index];
            }
        }
        
        //reset key to refer to last nested object (obj will refer to it as well at this point)
        key = nestedKey[nestedKey.length-1];

        var index = getIndex(key);
        if(index != -1)
            key = key.substr(0, key.indexOf('['));

        bindobj(obj, key, makeElementsBundle(identifiers, htmlScope), index, htmlScope);
    }
}

//index is literally used only once on the first iteration. consider refactor.
function bindobj(obj, key, els, index, htmlScope){//has to be done inside it's own function so value is unique
    var value = obj[key];
   
    if(value !== undefined && value.constructor === Array){    //establish 1 to 1 binding
        
        if(index != undefined && index != -1){//if index specified, treat as single value
            bindobj(value, index, els, undefined, htmlScope);
        }else{ //could implement some sort of better checking/dynamic setting here maybe
            for(var i = 0; i < els.length; i++){
                for(var j = 0; j < els[i].elements.length; j++){
                    var el = els[i].elements[j];
                    if(!value[i*els.length+j])
                        value.push(el[els[i].type]);//give default value
                    bindobj(value, i, [{'elements': [el], 'type': els[i].type}], undefined, htmlScope);
        }}}
    }else{
        //establish 1 to all binding
        if(value !== undefined){
            for(var i = 0; i < els.length; i++)
                for(var j = 0; j < els[i].elements.length; j++)
                    els[i].elements[j][els[i].type] = value;

        }else{ 
            if(els.length == 1 && els[0].elements.length == 1){  //only one element total
                value = els[0].elements[0][els[0].type];
            }else
                value = undefined;
        }



        //set events to fire here onchange

        Object.defineProperty(obj, key, {
            get: function(){
                var rval = els[0].elements[0][els[0].type];
                obj[key] = rval; //calls set function to update all other wrap-bound objects
                return rval; //can't return obj[key] here or else recursion
                
            },
            set: function(v){
                if(v === UnBind){
                    delete obj[key];
                    obj[key] = value;
                    return;
                }else if(v instanceof ReBind){
                    delete obj[key];
                    obj[key] = value;
                    v = makeElementsBundle(v.identifiers, htmlScope);
                    bindobj(obj, key, v, undefined, htmlScope);
                    return;
                }
                //default assignment behavior:
                value = v;
                for(var i = 0; i < els.length; i++)
                    for(var j = 0; j < els[i].elements.length; j++)
                        els[i].elements[j][els[i].type] = v;
            },
        });
    }
}

function parseIdentifiers(identifiers){
    var newids = [];
    for(var i = 0; i < identifiers.length; i++){
        if(typeof identifiers[i] === 'string')
            newids = newids.concat(identifiers[i].split(' '));
        else
            newids.push(identifiers[i]);
    }
    return newids
}

function makeElementsBundle(identifiers, htmlScope){
    if(identifiers.constructor !== Array)   //now change object to make sure it is an array
        identifiers = [identifiers];

    identifiers = parseIdentifiers(identifiers);

    var els = [];
    for(var i = 0; i < identifiers.length; i++){
        var id = identifiers[i];
        var type = undefined;
        if(typeof id === 'string'){
            var colonloc = id.indexOf(':')
            if(colonloc != -1){
                type = id.substr(colonloc+1);
                id = id.substr(0, colonloc);
            }
        }else if(typeof id === 'object'){
            if(id.type !== undefined && id.element !== undefined){
                type = id.type;
                id = id.element;
            }else if(id.type !== undefined && id.fn !== undefined){
                type = id.type;
                id = id.fn();
            }else if(!isElement(id)){
                throw 'error'
            }
        }else if(typeof id === 'function'){
            id = id();
        }
        if(type === undefined)  type = 'innerHTML';//change this and other innerHTML to use a function to choose best default instead of always innerHTML
        els.push({'elements': getElements(id, htmlScope), 'type': type});
    }
    return els;
}

function getElements(identifier, htmlScope){

    if(isElement(identifier)){
        //NEEDS TESTING
        return find_html_children_element(htmlScope, identifier);
    }

    else if(typeof identifier === 'function'){
        //NEEDS TESTING
        return find_html_children_element(htmlScope, identifier());
    }
    
    else if(typeof identifier === 'string'){

        var scopes;
        
        identifier = identifier.split('.');

        //find ID's inside of htmlScope element
        if(identifier[0][0] === '#'){
            scopes = find_html_children_id(htmlScope, identifier[0].substr(1));
            identifier.splice(0,1);
        }

        //find classes inside of htmlScope element
        else if(identifier[0][0] === undefined){
            scopes = find_html_children_class(htmlScope, identifier[1]);
            identifier.splice(0,2)
        }else{
            //find elements specified by string inside of htmlScope element
            var first = identifier.shift();
            var i = getIndex(first);
            if(i != -1)
                first = first.substr(0, first.indexOf('['));

            //make sure the first element refers to the correct element and index, if not, return
            if(i > 0 || htmlScope.tagName.toLowerCase() !== first)  return [];

            //if this is the only element referred to, just return it
            else if(identifier.length == 0) return [htmlScope];

            scopes = [htmlScope];
        }

        if(identifier.length == 0)  return scopes;
        
        var elements = [];
        for(var i = 0; i < scopes.length; i++){
            elements = elements.concat(childTags(scopes[i], identifier));
        }

        return elements;
    }
}

//maybe make this function more clear by dividing out the base case
function childTags(curr, tag){
    //div.div.id.a stuff here

    var found = [];
    var currtag = tag.shift();

    var index = getIndex(currtag);
    if(index != -1)
        currtag = currtag.substr(0, currtag.indexOf('['));

    if(index != -1){
        //recurse/return on indexed element
        var element = find_html_index(curr, index, currtag);

        if(tag.length == 0)
            return [element]
        else
            found = found.concat(childTags(element, tag));
    }else{
        //recurse/return all child elements

        var elements = [];
        for(var i = 0; i < curr.children.length; i++)
            if(curr.children[i].tagName.toLowerCase() === currtag)
                elements.push(curr.children[i]);

        if(tag.length == 0){
            return elements;
        }else{
            for(var i = 0; i < elements.length; i++){
                found = found.concat(childTags(elements[i], tag));
            }
        }
    }

    return found;
}

function find_html_index(parent, index, tagname){
    if(index < 0 || index === undefined) return;

    var siblings = parent.children;
    var el = undefined
    for(var i = 0; i < siblings.length; i++){
        if(siblings[i].tagName.toLowerCase() === tagname){
            if(--index < 0){ 
                el = siblings[i];
                break;
            }
        }
    }
    if(el === undefined)    throw 'error, element does not exist';

    return el;
}

function find_html_children_element(curr, find){
    return find_all_tree(curr, find, 
        function(curr, find){ return (curr === find ?  true :  false); },
        function(curr){ return curr.children; },
    false);
}

function find_html_children_class(curr, find){
    return find_all_tree(curr, find, 
        function(curr, find){ return (curr.className === find ?  true :  false); },
        function(curr){ return curr.children; },
    false);
}

function find_html_children_id(curr, find){
    return find_all_tree(curr, find, 
        function(curr, find){ return (curr.id === find ?  true :  false); },
        function(curr){ return curr.children; },
    true);
}

function find_all_tree(curr, find, comparefn, traversefn, unique){
    unique = !!unique;

    var found = [];

    if(comparefn(curr, find)){
        found.push(curr);
        if(unique) return found;
    }

    var children = traversefn(curr);
    for(var i = 0; i < children.length; i++){
        var child = children[i];
        found = found.concat(find_all_tree(child, find, comparefn, traversefn, unique));
        if(unique && found.length > 0) return found; 
    }

    return found;
}

function getIndex(str){
    var index = -1;
    var b_loc_s = str.indexOf('[');
    var b_loc_e = str.indexOf(']');
    if(b_loc_s != -1 && b_loc_e  != -1)
        index = parseInt(str.substr(b_loc_s + 1, b_loc_e - 1), 10);
    return index;
}

function isElement(o){
    return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
        o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string");
}