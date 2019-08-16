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

  function LINK(elements, types, values, callbacks, retrieves, transforms){ this.e = elements, this.t = types, this.v = values, this.c = callbacks; this.rc = retrieves; this.tc = transforms; }
  function Link(obj){ return new LINK(obj['elements'], obj['types'], obj['values'], obj['callbacks'], obj['retrieves'], obj['transforms']); }

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

  function IsPrimitive(id){ return typeof id !== 'object' || id instanceof LINK || id instanceof HTMLElement || id instanceof HTMLCollection; }

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

  //TODO: impliment functions as primary type?
  //put more info into els object?

  function Bind(options){    
      var object = options['object'] || {};
      reduce(object, options['mapping'], toElements(options['scopes'] || document), makeEls );
      return object;
   }

  function addSetter(obj, key, scopes){
      if(Object.getOwnPropertyDescriptor(obj, key).set === undefined){
          var value = obj[key];
          Object.defineProperty(obj, key, {
              get: function(){return value},
              set: function(v){ reduce(obj[key], v, scopes, function(o,k,i){ o[k]=i; }); value = obj[key]; },
              configurable: true
          });
      }
  }

   function reduce(object, mapping, scopes, primitivecb){
      for(var key in mapping){
          var obj = object, id = mapping[key];

          var karr = key.split(/[\.\[\]\'\"]/).filter(function(p){ return p; });
          var key = karr.shift();
          for(; karr.length; key = karr.shift()){
              obj[key] ||  (obj[key] = Number.isInteger(+karr[0]) ? [] : {});
              addSetter(obj, key, scopes);
              obj = obj[key];
          }
          
          if(IsPrimitive(id))
              primitivecb(obj, key, id, scopes);
          else{
              obj[key] || (obj[key] = {});    //could this ever be array?
              addSetter(obj, key, scopes);  
              reduce(obj[key], id, scopes, primitivecb);
          }
      }
  }

  function bindobj(obj, key, els, scopes){

      if(Array.isArray(els.v)){  //establish 1 to 1 binding (recurse)
          obj[key] = []; 
          addSetter(obj, key, scopes);
          for(var i = 0; i < els.length; ++i){
              var val = [els[i]]; 
              val.v = els.v[i]; 
              bindobj(obj[key], i, val, scopes); 
          }  
          return;
      }else if(els.v !== undefined)//establish 1 to all binding (all may be just 1 element)
          for(var i = 0; i < els.length; ++i)  els[i].e[els[i].t] = els.v;
      else if(els.length == 1) els.v = els[0].e[els[0].t]; //if only 1 element total is present and value is undefined, assign value to element
      else els.v = null;   //if only 1 value and many elements with potentially different values, initialize value to be null
      
      for(var i = 0; i < els.length; ++i){
          if(els[i].e.tagName === 'INPUT'){
              (function(i){
                  var S = function(event){
                      els.dirty = true;
                      var val = els[i].e[els[i].t]; 
                      obj[key] = els[i].rc ? els[i].rc(val) : val; 
                      for(var j = 0; j < els.length; ++j) els[j].e[els[j].t] = val; 
                  };
                  els[i].e.addEventListener('input', S, true);
                  els[i].e.Spindle = {'obj': obj, 'key': key, 's': S};
              })(i);
          }
      }

      Object.defineProperty(obj, key, {
          get: function(){ return els.v; },
          set: function(v){ 
              if(v instanceof OPS) return v.c(obj, key, els); 
              els.v = v; 
              for(var i = 0; i < els.length; ++i){
                  if(!els.dirty) els[i].e[els[i].t] = els[i].tc ? els[i].tc(v) : v; 
                  if(els[i].c) els[i].c(v, els[i].e, els[i].t, i);
              } 
              delete els.dirty;
          },
          configurable: true
      });
  }

  function makeEls(obj, key, primitive, scopes){
      if(Array.isArray(obj[key])) addSetter(obj,key,scopes);
      var types, values, callbacks, retrieves, transforms;

      if(primitive instanceof LINK) types = primitive.t, values = primitive.v, callbacks = primitive.c, retrieves = primitive.rc, transforms = primitive.tc, primitive = primitive.e;
      primitive = toElements(primitive, scopes);
      
      var els = [];
      for(var i = 0; i < primitive.length; ++i){
          els.push({
              e: primitive[i],
              t: Array.isArray(types) ? types[i] : types || getDefaultAttribute(primitive[i].tagName), 
              c: Array.isArray(callbacks) ? callbacks[i] : callbacks,
              tc: Array.isArray(transforms) ? transforms[i] : transforms,
              rc: Array.isArray(retrieves) ? retrieves[i] : retrieves,
          });
      }
      els.v = values || obj[key];
      bindobj(obj, key, els, scopes);
  }

  exports.Bind = Bind;
  exports.Link = Link;
  exports.ReBind = ReBind;
  exports.UnBind = UnBind;
  exports.getDefaultAttribute = getDefaultAttribute;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
