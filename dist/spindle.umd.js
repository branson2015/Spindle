(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.Spindle = {}));
}(this, function (exports) { 'use strict';

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

  function LINK(elements, types, callbacks, retrieve, transforms){ this.e = elements, this.t = types, this.c = callbacks; this.rc = retrieve; this.tc = transforms; }
  function Link(obj){ return new LINK(obj['elements'], obj['types'], obj['callbacks'], obj['retrieve'], obj['transforms']); }

  var OPS = function(op){ this.c = op; };//operation selector class

  function toElements(object, scopes = [document]){    
      if(typeof object === 'string'){
          if(object === 'scopes')                                                         return scopes;
          var elements = [];
          for(var i = 0; i < scopes.length; ++i)
              elements = elements.concat(Array.from(scopes[i].querySelectorAll(object))); return elements;                                                             
      }else if(object instanceof LINK)                                                    return toElements(object.e, scopes);
      else if(object instanceof HTMLElement || object instanceof HTMLDocument)            return [object];
      else if(object instanceof HTMLCollection)                                           return Array.from(object);
      else throw 'Error: Expected Primary Type, instead got ' + object;
  }

  function IsPrimitive(id){ return typeof id === 'string' || id instanceof LINK || id instanceof HTMLElement || id instanceof HTMLCollection; }

  function unbind(element){
      var val = element.Spindle.obj[element.Spindle.key];
      delete element.Spindle.obj[element.Spindle.key];
      element.Spindle.obj[element.Spindle.key] = val;
      element.removeEventListener('input', element.Spindle.s, true);
      delete element.Spindle;
  }

  function UnBind(elements){ return new OPS(function(obj, key, els){
      if(elements === undefined){
          elements = [];
          for(var i = 0; i < els.length; ++i)
              elements.push(els[i].e);
      }else elements = toElements(elements);
      for(var i = 0; i < elements.length; ++i)
          unbind(elements[i]);
  });}

  function ReBind(elements){
      if(!(elements instanceof LINK)) elements = new LINK(elements);
      return new OPS(function(obj, key, els){  
          for(var i = 0; i < els.length; ++i)
              unbind(els[i].e);
          Spindle.Bind({'object': obj, 'mapping': {[key]: elements}});
      });
  }

  //AddBind
  //ChangeBind

  function Bind(options){    
      var object = options['object'] || {};
      reduce(object, options['mapping'], toElements(options['scopes'] || document), function(o,k,i,s){ bindobj(o, k, bundle(o, k, s, i)); });
      return object;
   }

  function addSetter(karr, obj, key, scopes){
      if(obj[key] === undefined){
          Number.isInteger(+karr[0]) ? obj[key] = [] : obj[key] = {};
          var value = obj[key];
          Object.defineProperty(obj, key, {
              get: function(){return value},
              set: function(v){ reduce(obj[key], v, scopes, function(o,k, i){ o[k]=i; }); value = obj[key]; },
              configurable: true
          });
      }
      return obj[key];
  }

   function reduce(object, mapping, scopes, primitivecb){
      for(var key in mapping){
          var obj = object, id = mapping[key];

          var karr = key.split(/[\.\[\]\'\"]/).filter(function(p){ return p; });
          var key = karr.shift();
          for(; karr.length; key = karr.shift())
              obj = addSetter(karr, obj, key, scopes);
          
          if(IsPrimitive(id))
              primitivecb(obj, key, id, scopes);
          else{
              addSetter(karr, obj, key, scopes);  
              reduce(obj[key], id, scopes, primitivecb);
          }
      }
  }

  function bindobj(obj, key, els){
      var value = obj[key];

      if(value !== undefined && Array.isArray(value)){  //establish 1 to 1 binding (recurse)
          for(var i = 0; i < els.length; ++i){ bindobj(value, i, [els[i]]); }  return;
      }else if(value !== undefined)//establish 1 to all binding (all may be just 1 element)
          for(var i = 0; i < els.length; ++i)  els[i].e[els[i].t] = value;
      else if(els.length == 1) value = els[0].e[els[0].t]; //if only 1 element total is present and value is undefined, assign value to element
      else value = null;   //if only 1 value and many elements with potentially different values, initialize value to be null

      Object.defineProperty(obj, key, {
          get: function(){ return els[0].rc ? els[0].rc(value) : value; },
          set: function(v){ 
              if(v instanceof OPS) return v.c(obj, key, els); 
              value = v; 
              for(var i = 0; i < els.length; ++i){
                  els[i].e[els[i].t] = els[i].tc ? els[i].tc(v) : v; 
                  if(els[i].c) els[i].c(v, els[i].e, els[i].t, i);
              } 
          },
          configurable: true
      });
  }

  function bundle(obj, key, scopes, elements){
      var types, callbacks, retrieve, transforms;

      if(elements instanceof LINK) types = elements.t, callbacks = elements.c, retrieve = elements.rc, transforms = elements.tc, elements = elements.e;
      elements = toElements(elements, scopes);
      
      var S;
      var els = [];
      for(var i = 0; i < elements.length; ++i){
          if(elements[i].tagName === 'INPUT'){      //maybe get rid of this if statement?
              (function(i){S = function(event){obj[key] = els[i].e[els[i].t];};})(i);
              elements[i].addEventListener('input', S, true);
          }
          els.push({
              e: elements[i],
              t: Array.isArray(types) ? types[i] : types || getDefaultAttribute(elements[i].tagName), 
              c: Array.isArray(callbacks) ? callbacks[i] : callbacks,
              tc: Array.isArray(transforms) ? transforms[i] : transforms,
          });
          elements[i].Spindle = {'obj': obj, 'key': key, 's': S};
      }
      els[0].rc = retrieve;
      return els;
  }

  exports.Bind = Bind;
  exports.Link = Link;
  exports.ReBind = ReBind;
  exports.UnBind = UnBind;
  exports.getDefaultAttribute = getDefaultAttribute;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
