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
  //add callback onchange functions

  function LINK(element, type, callback){
      this['element'] = element;
      this['type'] = type;
      this['callback'] = callback;
  }

  function link(element, type, callback){
      if(typeof element === 'object') return new LINK(element['element'], element['type'], element['callback']);
      return new LINK(element, type, callback)
  }

  function Bind(object, htmlScope, mapping){
      if(typeof htmlScope === 'string')   htmlScope = document.querySelectorAll(htmlScope);
      if(htmlScope.constructor === Array){
          if(htmlScope.length > 1){
              for(scope in htmlScope)    Bind(object, scope, mapping);    return;
          }else
              htmlScope = htmlScope[0];
      }else if(!isElement(htmlScope))   throw 'bad element identifier';
      
      for(var key in mapping){
          var obj = object;
          
          var identifiers = mapping[key];
          if(typeof identifiers !== 'object' || identifiers.constructor === LINK || isElement(identifiers))   //keep objects in object form, put into recursion (also includes arrays)
              identifiers = [identifiers];

          if(typeof obj[key] === 'object'){
              Bind(obj[key], htmlScope, identifiers); continue;
          }
          
          //shortcuts (using weird arrays to hack in references)
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
          get: ()=>{ return obj[key] = els[0]['e'][els[0]['t']];  },
          set: (v)=>{ els.forEach((el)=>{el['e'][el['t']] = v; if(el['c']) el['c'](v);}); },
      });
  }

  function elementTypeBundle(htmlscope, identifiers){
      var els = [];
      identifiers.forEach((id)=>{
          var el, type, callback;
          
          if(id.constructor === LINK)
              el = bundle(htmlscope, id['element'], type = id['type'], callback = id['callback']);
          else if(typeof id === 'string' || isElement(id))
              el = bundle(htmlscope, id, type);
          else
              throw 'error, object not in right form'
          els = els.concat(el);
      });
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
      for(var i = 0; i < group.length; ++i)
          b.push({'e' : group[i], 't' : type || getDefaultAttribute(group[i].tagName), 'c': callback});
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

  exports.link = link;
  exports.Bind = Bind;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
