(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.Spindle = factory();
}(typeof self !== 'undefined' ? self : this, function () { 'use strict';

    /*
    *obj: object with attributes in which to store data bindings in
    *html: DOM html
    *mapping: key-value pair from html to obj attributes
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

        

        //todo: make this recursive for objects that contain objects 
        
        function mapbind(obj, mapping){
            //for every mapping
            var origobj = obj;
            for(var key in mapping){
                obj = origobj;
                
                var nestedKey = key.split('.');
                if(typeof mapping[key] !== 'string'){
                    mapbind(obj[key], mapping[key]);
                    continue;
                }else if(typeof mapping[key] === 'string'){
                    //need to parse for .'s for nested objects in key
                    for(var i = 0; i < nestedKey.length-1; i++){
                        obj = obj[nestedKey[i]];
                    }
                }
                
                var identifier = mapping[key];
                key = nestedKey[nestedKey.length-1];
                

                var type;
                var colonloc = identifier.indexOf(':');
                if(colonloc == -1){
                    type = 'innerHTML';
                }else{
                    type = identifier.substr(colonloc+1);
                    identifier = identifier.substr(0, colonloc);
                }
                

                var value = obj[key];

                //get the html elements to which the value refers (will always return array)
                var el = getElements(identifier, htmlScope);

                //can be multiple HTML elements per object
                for(var i = 0; i < el.length; i++){

                    //TODO: add eventlisteners for two way data binding, take care of circular setting
                    //element.addEventListener(event || 'input', oninput);
                    var e = el[i];
                    e[type] = value;

                    Object.defineProperty(obj, key, {
                        get: function(){
                            return value;
                        },
                        set: function(v){
                            e[type] = value = v;
                        }
                    });
                }
                
            }
        }

        mapbind(obj, mapping);

    }

    function getElements(identifier, htmlScope){

        if(typeof identifier === 'object' && isElement(identifier)){
            throw 'not implemented yet'
        }

        else if(typeof identifier === 'function'){
            throw 'not implemented yet'
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
                console.log('identifier:', identifier);
                throw 'not implemented yet';

            }
        }
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
