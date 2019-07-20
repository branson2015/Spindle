(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  factory(global.Spindle = {});
}(typeof self !== 'undefined' ? self : this, function (exports) { 'use strict';

  var defaultAttributeMap = {
    'audio': 'src',
    'embed': 'src',
    'form': 'action',
    'img': 'src',
    'input': 'value',
    'object': 'data',
    'optgroup': 'label',
    'option': 'value',
    'output': 'for',
    'param': 'value',
    'progress': 'value',
    'source': 'src',
    'time': 'datetime',
    'track': 'src',
    'video': 'src',
    'button': 'value',
    'checkbox': 'checked',
    'color': 'value',
    'email': 'value',
    'number': 'value',
    'password': 'value',
    'radio': 'checked',
    'range': 'value',
    'reset': 'value',
    'search': 'value',
    'submit': 'value',
    'tel': 'value',
    'text': 'value'
  };
  function getDefaultAttribute(elementName) {
    return defaultAttributeMap[elementName.toLowerCase()] || 'innerHTML';
  }


  var defaultInteractMap = {};

  function getDefaultInteract(elementName) {
    return defaultInteractMap[elementName.toLowerCase()] || 'input';
  }

  //TODO: make get function that returns which element(s) the object is bound to
  //make different ways of binding function (auto create object, make window the htmlScope, etc)

  function Bind(object, htmlScope, mapping){
      if(typeof htmlScope === 'string')   htmlScope = document.querySelector(htmlScope);  //change to querySelectorAll for multibinding
      if(!isElement(htmlScope))   throw 'bad element identifier';
      
      //for every mapping
      for(var key in mapping){
          //reset obj to original object on each loop
          var obj = object;
          
          var identifiers = mapping[key];
          if(typeof identifiers !== 'object' || isElement(identifiers))   //keep objects in object form, put into recursion (also includes arrays)
              identifiers = [identifiers];

          if(typeof obj[key] === 'object'){
              Bind(obj[key], htmlScope, identifiers);
              continue;
          }
          
          //shortcuts (using weird arrays to hack in references)
          key = key.split('.');
          var curr = [key.shift()];
          for(; key.length > 0; curr = [key.shift()]){//length - 1 because if we go to length then obj[i] will be primitive and will not change obj[i], not a reference
              var index = getIndex(curr);
              obj = (index !== -1) ? obj[curr[0]][index] : obj[curr[0]];
          }
          var index = getIndex(curr);
          if(index !== -1){
              obj = obj[curr[0]];
              curr[0] = index;
          }
          
          bindobj(obj, curr[0], elementTypeBundle(htmlScope, identifiers));
      }
  }

  function bindobj(obj, key, els){
      var value = obj[key];

      if(value !== undefined && value.constructor === Array)  //establish 1 to 1 binding (recurse)
          return els.forEach((bundle)=>{ bindobj(value, i, [bundle]); });
      else if(value !== undefined)//establish 1 to all binding (all may be just 1 element)
          for(var i = 0; i < els.length; i++)
              els[i]['e'][els[i]['t']] = value;
      else if(els.length == 1)  //if only 1 element total is present and value is undefined, assign value to element
          value = els[0]['e'][els[0]['t']];
      
      //trigger get (TODO: not all elements have an interact, can skip this sometimes)
      for(var i = 0; i < els.length; i++)
          els[i]['e'].addEventListener(getDefaultInteract(els[i]['e'].tagName), (event)=>{obj[key];});

      //set events to fire here onchange
      Object.defineProperty(obj, key, {
          get: ()=>{ return obj[key] = els[0]['e'][els[0]['t']]; },
          set: (v)=>{ els.forEach((el)=>{el['e'][el['t']] = v;}); }
      });
  }

  function elementTypeBundle(htmlscope, identifiers){
      var els = [];
      identifiers.forEach((id)=>{
          //TODO: put shortcuts for defining which type IN STRING to modify
          //TODO: implement objects: {'element': 'whatever', 'type': 'whatever'}
          if(isElement(id))
              return els.push({'e': id, 't': getDefaultAttribute(id.tagName)});

          id = (function translate(id){ return (typeof id === 'function') ?  translate(id()) : id; })(id);
          els = els.concat(getElements(htmlscope, id));
      });
      return els;
  }

  function getElements(scope, query){
      var bundle = [];
      scope.querySelectorAll(query).forEach((element)=>{
          bundle.push({'e' : element, 't' : getDefaultAttribute(element.tagName)});
      });
      return bundle;
  }

  function getIndex(str, i = 0){
      var start = str[i].indexOf('[') + 1, dist = str[i].indexOf(']') - start;
      var idx = parseInt(str[i].substr(start, dist), 10);
      if(start !== 0)   str[i] = str[i].substr(0, start-1);
      return isNaN(idx) ? -1 : idx;
  }

  function isElement(o){
      return (typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
          o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string");
  }

  exports.Bind = Bind;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
