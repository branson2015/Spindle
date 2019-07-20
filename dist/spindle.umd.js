(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  factory(global.Spindle = {});
}(typeof self !== 'undefined' ? self : this, function (exports) { 'use strict';

  var defaultAttributeMap = {
    audio: 'src',
    embed: 'src',
    form: 'action',
    img: 'src',
    input: 'value',
    object: 'data',
    optgroup: 'label',
    option: 'value',
    output: 'for',
    param: 'value',
    progress: 'value',
    source: 'src',
    time: 'datetime',
    track: 'src',
    video: 'src',
    button: 'value',
    checkbox: 'checked',
    color: 'value',
    email: 'value',
    number: 'value',
    password: 'value',
    radio: 'checked',
    range: 'value',
    reset: 'value',
    search: 'value',
    submit: 'value',
    tel: 'value',
    text: 'value'
  };
  function getDefaultAttribute(elementName) {
    return defaultAttributeMap[elementName.toLowerCase()] || 'innerHTML';
  }


  var defaultInteractMap = {
    input: 'input'
  };
  function getDefaultInteract(elementName) {
    return defaultInteractMap[elementName.toLowerCase()] || 'input';
  }

  var uniqueID = 'SpindleUniqueID';

  //TODO: make get function that returns which element(s) the object is bound to
  //make different ways of binding function (auto create object, make window the htmlScope, etc)

  function Bind(object, htmlScope, mapping){
      var oldID = undefined;
      var htmlScopeID = htmlScope;
      if(isElement(htmlScope)){
          oldID = htmlScopeID.id;
          htmlScopeID = htmlScope.id = uniqueID;
      }else if(document.getElementById(htmlScopeID) === null){
          throw 'bad ID';
      }
      
      //for every mapping
      for(var key in mapping){
          //reset obj to original object on each loop
          var obj = object;
          
          var identifiers = mapping[key];
          if(typeof identifiers === 'string')
              identifiers = identifiers.split(' ');
          else if(typeof identifiers !== 'object')   //keep objects in object form, put into recursion (also includes arrays)
              identifiers = [identifiers];

          if(typeof obj[key] === 'object'){
              //obj[key]['parent'] = obj;
              Bind(obj[key], htmlScope, identifiers);
              continue;
          }
          
          //shortcuts
          var nestedKey = key.split('.');
          for(var i = 0; i < nestedKey.length-1; i++){//length - 1 because if we go to length then obj[i] will be primitive and will not change obj[i], not a reference
              var index = getIndex(nestedKey[i]);
              if(index == -1)
                  obj = obj[nestedKey[i]];
              else{
                  nestedKey[i] = nestedKey[i].substr(0, nestedKey[i].indexOf('['));
                  obj = obj[nestedKey[i]][index];
              }
          }
          
          //reset key to refer to last nested object (obj will refer to it as well at this point)
          key = nestedKey[nestedKey.length-1];

          var index = getIndex(key);
          if(index != -1){
              obj = obj[key.substr(0, key.indexOf('['))];
              key = index;
          }
          
          bindobj(obj, key, elementTypeBundle(htmlScopeID, identifiers));
      }

      if(isElement(htmlScope))
          htmlScope.id = oldID;

  }

  function bindobj(obj, key, els){//has to be done inside it's own function so value is unique
      var value = obj[key];
     
      if(value !== undefined && value.constructor === Array){    //establish 1 to 1 binding (recurse)
          els.forEach((bundle)=>{ bindobj(value, i, [bundle]); });
          return;
      }else if(value !== undefined)//establish 1 to all binding (all may be just 1 element)
          for(var i = 0; i < els.length; i++)
              els[i].element[els[i].type] = value;
      else if(els.length == 1)  //if only 1 element total is present and value is undefined, assign value to element
          value = els[0].element[els[0].type];
      

      for(var i = 0; i < els.length; i++)
          els[i].element.addEventListener(getDefaultInteract(els[i].element.tagName), function(event){obj[key];});//trigger get

      //set events to fire here onchange
      Object.defineProperty(obj, key, {
          get: function(){
              var rval = els[0].element[els[0].type];
              obj[key] = rval; //calls set function to update all other wrap-bound objects
              return rval; //can't return obj[key] here or else recursion
          },
          set: function(v){
              for(var i = 0; i < els.length; i++)
                  els[i].element[els[i].type] = v;
          }
      });
  }

  function elementTypeBundle(htmlscope, identifiers){

      var els = [];
      for(var i = 0; i < identifiers.length; i++){
          var id = identifiers[i];
          var type = undefined;
          if(typeof id === 'string'){
              var colonloc = id.indexOf(':');
              if(colonloc != -1){
                  type = id.substr(colonloc+1);
                  id = id.substr(0, colonloc);
              }
          }else if(typeof id === 'object'){   //{type: 'whatever', elements: 'whatever'}
              if(id.type !== undefined && id.elements !== undefined){
                  type = id.type;
                  id = id.elements;
              }else if(id.type !== undefined && id.fn !== undefined){ //{type: 'whatever', fn: function(){...}}
                  type = id.type;
                  //TODO: this needs to be put into proper format (converted to array etc)
                  id = id.fn();
              }else if(isElement(id)){
                  throw 'error, not yet implimented'
              }else{
                  throw 'error'
              }
          }else if(typeof id === 'function'){     //function(){...}
              //TODO: this needs to be put into proper format (converted to array etc)
              id = id();
          }

          //change this to use a map keyed on type to minimize loops in get/set functions??
          els = els.concat(getElements(htmlscope, id, type));
      }
      return els;
  }

  function getElements(scope, query, type){
      var bundle = [];
      var elements = document.querySelectorAll('#' + scope + ' > ' + query);

      elements.forEach((element)=>{
          bundle.push({'element' : element, 'type' : type || getDefaultAttribute(element.tagName)});
      });
      return bundle;
  }






  //todo: make this more.. lexical.
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

  exports.Bind = Bind;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
