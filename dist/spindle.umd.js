(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    factory(global.Spindle = {});
}(typeof self !== 'undefined' ? self : this, function (exports) { 'use strict';

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
    function Bind(obj, html, mapping){
        if(!this || this === window)
            return new Bind(obj, html, mapping);

        

        //todo: make this recursive for objects that contain objects 
        
        //for every mapping
        for(var key in mapping){
            var identifier = mapping[key];

            var colonloc = identifier.indexOf(':');
            var type = (colonloc == -1 ? 'innerHTML' : identifier.substr(colonloc+1));
            identifier = identifier.substr(0, colonloc);

            //get the html elements to which the value refers
            var el = getElement(identifier, html);
            if(el.length == 1 || !el.lenth){
                el = el[0];
                var value = el.type;
                Object.defineProperty(obj, key, {
                    get: function(){
                        return value;
                    },
                    set: function(v){
                        el[type] = v;
                        value = v;
                    }
                });

            }else{

                throw 'not implemented yet'
            }
            
        }

        return this;
    }

    function getElement(identifier, html){

        if(typeof identifier === 'object' && isElement(identifier)){
            throw 'not implemented yet'
        }

        else if(typeof identifier === 'function'){
            throw 'not implemented yet'
        }
        
        //change this to use document.querySelectorAll
        else if(typeof identifier === 'string'){
            if(identifier[0] === '#'){
                return find_html_children_id(html, identifier.substr(1));
            }else if(identifier[0] === '.'){
                return find_html_children_class(html, identifier.substr(1));
            }else{
                
                throw 'not implemented yet'

            }
        }
    }

    function find_html_children_class(start, find){
        return find_all_tree(start, find, 
            function(curr, tofind){ return (curr.class === tofind ?  true :  false); },
            function(curr){ return curr.children; },
            false);
    }

    function find_html_children_id(start, find){
        return find_all_tree(start, find, 
            function(curr, tofind){ return (curr.id === tofind ?  true :  false); },
            function(curr){ return curr.children; },
            true);
    }

    function find_all_tree(start, find, comparefn, traversefn, unique){
        var found = [];

        if(comparefn(start, find)){
            found.push(start);
            if(unique) return found;
        }

        var children = traversefn(start);
        if(children){
            if(!children.length) children = [children];
            for(var i = 0; i < children.length; i++){
                var child = children[i];
                found = found.concat(find_all_tree(child, find, comparefn, traversefn));
                if(unique && found.length > 0) return found; 
            }
        }else{
            return [];
        }

        return found;

    }

    function isElement(o){
        return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string");
    }

    exports.Bind = Bind;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
