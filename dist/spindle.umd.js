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

  function unbind(obj, key, els){
      var val = obj[key];
      delete obj[key];
      obj[key] = val;
      for(var i = els.length-1; i >= 0; --i){
          els[i].e.removeEventListener(els[i].l, els[i].s, true);
          delete els[i].s;
      }
  }

  var OPS = function(op){ this.c = op; };//operation selector class

  function UnBind(){ return new OPS(unbind); }

  function ReBind(element, type, callback){
      return new OPS((obj, key, els)=>{  
          unbind(obj, key, els);
          var mapping = {};
          mapping[key] = Spindle.Link(element, type, callback);
          Spindle.Bind({'object': obj, 'mapping': mapping});
      });
  }

  //AddBind
  //RemoveBind
  //ChangeBind
  //GetBound

  //TODO: experiment with putting getters/setters on EVERY object for more complex assignment options? - trickle-down assign in setter?

  function LINK(elements, types, callbacks){ this.e = elements,   this.t = types, this.c = callbacks; }
  function Link(e, t, c){ return new LINK(e['elements'] || e, e['types'] || t, e['callbacks'] || c); }

  function Bind(options){    
      var object = options['object'] || {};
      reduce(object, options['mapping'], toElements(options['scopes'] || [document]));
      return object;
   }

  function reduce(object, mapping, scopes){
      for(var key in mapping){
          var obj = object, id = mapping[key];

          var karr = key.split(/[\.\[\]\'\"]/).filter(p => p);
          key = karr.pop();
          karr.reduce((o, p) => obj = (o[p] === undefined) ? {} : o[p], obj);
          
          if(IsPrimitive(id)) 
              bindobj(obj, key, bundle(obj, key, scopes, id));
          else{
              if(obj[key] === undefined)  obj[key] = {};
              reduce(obj[key], id, scopes);   
          }
      }
  }

  function bindobj(obj, key, els){
      var value = obj[key];

      //this code decides on what the value for the elements should be
      if(value !== undefined && Array.isArray(value)){  //establish 1 to 1 binding (recurse)
          for(var i = els.length-1; i >= 0; --i){ bindobj(value, i, [els[i]]); }  return;
      }else if(value !== undefined)//establish 1 to all binding (all may be just 1 element)
          for(var i = els.length-1; i >= 0; --i)
              els[i].e[els[i].t] = value;
      else if(els.length == 1)  //if only 1 element total is present and value is undefined, assign value to element
          value = els[0].e[els[0].t];

      Object.defineProperty(obj, key, {
          get: ()=>{ return value; },
          set: (v)=>{ if(v instanceof OPS) return v.c(obj, key, els); value = v; for(var i = els.length-1; i >= 0; --i){els[i].e[els[i].t] = v; if(els[i].c) els[i].c(v, els[i].e, els[i].t, i);} },
      });
  }

  function bundle(obj, key, scopes, elements){
      var types, callbacks;

      if(elements instanceof LINK) types = elements.t, callbacks = elements.c, elements = elements.e;
      elements = toElements(elements, scopes);

      var els = [];
      for(var i = 0, S, L, ilen = elements.length; i < ilen; ++i){
          if(elements[i].tagName === 'INPUT'){
              ((i)=>{S = function(event){obj[key] = els[i].e[els[i].t];};})(i);
              L = 'input'; elements[i].addEventListener('input', S, true);
          }
          els.push({
              t: Array.isArray(types) ? types[i] : types || getDefaultAttribute(elements[i].tagName), 
              c: Array.isArray(callbacks) ? callbacks[i] : callbacks,
              e: elements[i], l: L, s: S
          });
      }
      return els;
  }

  function toElements(object, scopes = [document]){    
      if(object === 'scopes')                                                             return scopes;
      else if(typeof object === 'string'){
          var elements = [];
          for(var i = 0, ilen = scopes.length; i < ilen; ++i)
              elements = elements.concat(Array.from(scopes[i].querySelectorAll(object))); return elements;                                                             
      }else if(object instanceof LINK)                                                    return toElements(object.e, scopes);
      else if(object instanceof HTMLElement || object instanceof HTMLDocument)            return [object];
      else if(object instanceof HTMLCollection)                                           return Array.from(object);
  }

  function IsPrimitive(id){ return typeof id === 'string' || id instanceof LINK || id instanceof HTMLElement || id instanceof HTMLCollection; }

  exports.LINK = LINK;
  exports.Link = Link;
  exports.Bind = Bind;
  exports.UnBind = UnBind;
  exports.ReBind = ReBind;
  exports.getDefaultAttribute = getDefaultAttribute;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
