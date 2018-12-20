(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Spindle = factory();
}(typeof self !== 'undefined' ? self : this, function () { 'use strict';

    /*TODO: 1. arrays as property values
            2. if property values aren't established in the object, have the object inherit the values already in the DOM
            3. fix problem with wrong dom assigment

    */
    /*
    example usage:

    var obj = {p1: 'val1', p2: 'val2', p3: ['val3.1', 'val3.2], p4: 'val4', p5: {p5-1: 'test', p5-2: 'test2'}};
    var element = document.getElementById("test");
    bind(obj, element, {
        p1: 'div.div.ul.li[0].a',
        p2: '.classname[0]',
        p3: '.classname',           -p3 will be an array
        p4: '#id'
        p5: {
           p5-1: document.getElementsByTagName("body")[0] 
        }

        'p6': 'whatever:type' - :type signifies class, innerHTML, innerText, etc (what value to bind to, innerHTML by default)    
        'p7.': function(){...} - will return string in form of previous versions
    });

    */
    function Bind(obj, htmlScope, mapping){
        if(!this || this === window)
            return new Bind(obj, htmlScope, mapping);
        
        function mapbind(obj, mapping){
            //for every mapping
            var origobj = obj;
            for(var key in mapping){
                obj = origobj;
                
                var nestedKey = key.split('.');
                //if the key is an object
                if(typeof mapping[key] !== 'string'){
                    mapbind(obj[key], mapping[key]);
                    continue;
                }
                //if the key is a string
                else if(typeof mapping[key] === 'string'){
                    for(var i = 0; i < nestedKey.length-1; i++){
                        obj = obj[nestedKey[i]];    //reset obj to be furthest nested element in to which key refers
                    }
                }
                
                var identifier = mapping[key];
                //reset key to refer to last nested object (obj will refer to it as well at this point)
                key = nestedKey[nestedKey.length-1];
                

                var type;
                if(typeof identifier === 'string'){
                    var colonloc = identifier.indexOf(':');
                    if(colonloc != -1){
                        type = identifier.substr(colonloc+1);
                        identifier = identifier.substr(0, colonloc);
                    }else{
                        type = 'innerHTML';
                    }
                }else{
                    type = 'innerHTML';
                }

                //get the html elements to which the value refers (will always return array)
                var el = getElements(identifier, htmlScope);

                //TODO: handle splitting property value up into array
                var value = obj[key];

                //can be multiple HTML elements per object
                for(var i = 0; i < el.length; i++){
                    var e = el[i];
                    if(value !== undefined){
                        e[type] = value;
                    }else{
                        obj[key] = value = e[type];
                    }

                    //TODO: add eventlisteners for two way data binding, take care of circular setting
                    //element.addEventListener(event || 'input', oninput);
                    
                }
                makeBind(obj, key, value, el, type);
                
            }
        }
        function makeBind(obj, key, val, el, type){
            var value = val;
            Object.defineProperty(obj, key, {
                get: function(){
                    return value;
                },
                set: function(v){
                    for(var i = 0; i < el.length; i++){
                        el[i][type] = value = v;
                    }
                }
            });
        }

        mapbind(obj, mapping);
        return this; //don't need to do this, but why not. this.whatever is never even set anywhere.
    }
    //end of not currently used


    function getElements(identifier, htmlScope){

        if(typeof identifier === 'object' && isElement(identifier)){
            //NEEDS TESTING
            return find_html_children_element(htmlScope, identifier);
        }

        else if(typeof identifier === 'function'){
            //NEEDS TESTING
            return find_html_children_element(htmlScope, identifier());
        }
        
        else if(typeof identifier === 'string'){
            //find ID's inside of htmlScope element
            if(identifier[0] === '#'){
                return find_html_children_id(htmlScope, identifier.substr(1));
            }
            //find classes inside of htmlScope element
            else if(identifier[0] === '.'){
                return find_html_children_class(htmlScope, identifier.substr(1));
            //find elements specified by string inside of htmlScope element
            }else{
                //div.div.id.a stuff here
                //THIS NEEDS TESTING


                function childTags(curr, tag){
                    var found = [];
                    var newtag = tag.slice();   //makes a copy
                    var currtag = newtag.shift();

                    var index = -1;
                    var b_loc_s = currtag.indexOf('[');
                    var b_loc_e = currtag.indexOf(']');
                    if(b_loc_s != -1 ){
                        if(b_lock_e != -1){
                            index = parseInt(currtag.substr(b_loc_s, b_loc_e));
                        }
                        newtag = newtag.substr(0, b_loc_s);
                    }

                    if(curr.tagName.toLowerCase() !== currtag){
                        return [];
                    }
                    else if(newtag.length == 0){    
                        return [curr];
                    }

                    var children = curr.children;
                    if(index != -1){
                        found = found.concat(childTags(children[index], newtag));
                    }else{
                        for(var i = 0; i < children.length; i++){
                            found = found.concat(childTags(children[i], newtag));
                        }
                    }
                    
                    return found;
                }

                return childTags(htmlScope, identifier.split('.'));
            }
        }
    }

    function find_html_children_element(curr, find){
        return find_all_tree(htmlScope, identifier, 
            function(curr, find){ return (curr === find ?  true :  false); },
            function(curr){ return curr.children; },
        false);
    }

    function find_html_children_class(curr, find){
        return find_all_tree(curr, find, 
            function(curr, find){ return (curr.class === find ?  true :  false); },
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
        var found = [];

        if(comparefn(curr, find)){
            found.push(curr);
            if(unique) return found;
        }

        var children = traversefn(curr);
        for(var i = 0; i < children.length; i++){
            var child = children[i];
            found = found.concat(find_all_tree(child, find, comparefn, traversefn));
            if(unique && found.length > 0) return found; 
        }

        return found;
    }

    function isElement(o){
        return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string");
    }

    return Bind;

}));
