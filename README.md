![Spindle Logo](spindle-logo.png)
# Spindle.js

A **Two-Way data binding** JavaScript library for front-end, prototyping, testing, and development.

# Usage

### Minimalistic Example:
```javascript
var obj = Spindle.Bind({'mapping': {property1: '#id'}});
```

### Complex Example:
```javascript
//arbitrarily complicated Object
var obj = {
	property1: 'value 1',	
	property2: undefined,
	property3: [],	//defaults to one-to-one binding
	property4: {
		arr: [
			{subProperty1: 'value 4-1'},
			{subProperty2: 'value 4-2'},
			'value 4-3'
		]
	}
}

//mapping descr
var mapping = {		
	property1: document.getElementById('someId'),		//one to one binding
	property2: '.className',							//CSS-Selector
	property3: document.getElementsByTagName('tagName'),
	property4: {
		arr: [
			{subProperty1: Spindle.Link({'elements': 'tagName', 'types': 'innerHTML', 'callbacks': (v)=>{console.log(v);}})}
		]
	},
	//one-to-many binding to .className2's innerHTML attribute with callback function on any value change
	'property4.arr[1].subProperty2': Spindle.Link(document.getElementsByClassName('className2'), 'innerHTML', (v)=>{console.log(v)}),
	'property4.arr[2]': '#id1'
}

var scopes = document.getElementsByClassName('className3');

Spindle.Bind({'object': obj, 'mapping': mapping, 'scopes': scopes}) 
```
# Explanation
### Spindle.Bind(options)
This is the heart of the library that does all the heavy lifting of binding object values to Elements.
**options** must be an object containing the following properties:
- **object**:	*Not Required*
	- The resulting object in which the values of the bound elements is stored. If not specified, an object will be automatically created and returned.
- **mapping**:	*Required*
	- The object that links objects from **object** to DOM Elements
- **scopes**: *Not Required*
	- If specified, all mapped DOM Elements must appear as some descendant of the scopes specified

### Spindle.Link(elements, types, callbacks)
- **Elements**: *Required*
	- the **Mapped Value** To the DOM Object
- **types**: *Not Required*
	- the Attribute that the corresponding **object** value will be bound to
- **callbacks**: *Not Required*
	- a callback function that is fired when the corresponding **object** value has changed.
	- Callback is passed the following paramters:
		- value - what the value has been changed to
		- type - the type of the corresponding DOM Element
		- element - the corresponding DOM Element
		- i - (if array) which index in the **object**'s value the element refers to

### Mapping Values - Primitives
- Mapping values can be of type HTMLElement, HTMLCollection, string, or **Spindle.Link**, or an Array of any of these types. These types form the **Primitives**.
- if the value is HTMLElement or HTMLCollection, scoping rules defined for **scopes** will be ignoed.
- If the **primitive** value results to **undefined**, the value of the HTML Element's corresponding type will be used as the value. if there is only one binded HTML Element. If there are multiple, then the value remains **undefined** and the HTMLElements remain their previous values until the corresponding **object** property is updated. 
- If the value is defined, the HTML Element's corresponding type will be immidiately updated. 
- If the **primtive** value is of type Array, then any One-to-Many bindings will become One-to-One bindings.
- if **Spindle.Link** is not used as the primitive, then a default attribute will be chosen to modify based on the linked element's type. This default behavior can be modified by accessing **Spindle.defaultAttributeMap**. 


### Auto Object Generation:
- Simply do not specify an **object** in **options** passed to **Spindle.Bind()** and a **object** will be returned to you who's types match those defined in **mapping**

### UnBind, ReBind:
 - Due to the nature of Object.DefineProperty, **UnBind** and **ReBind** have abnormal syntaxes.
```javascript
obj.property1 = UnBind();
obj.property2 = ReBind(/*primitives*/)
```
# Warning
 - This library advocates flexibility over all else, so the Programmer is responsible for correctly using it. It is not difficult to cause infinite loops, overflow the stack, or cause errors to be thrown if callbacks functions are abused or incorrect parameter types are passed. Linking multiple objects to the same element is also possible, and changing the values of other linked objects via callback functions is possible. With all this in mind, it is ultimately up to the programmer to exercise good practices to prevent these problems.

# Features
- Dynamic Binding and UnBinding of arbitrarily complex object properties to DOM Element attributes
- One-to-One or One-to-Many bindings
- Auto-generation of binded objects
- Extremely small footprint!  < 2kb when minified, under 200 lines of code!
- No Dependencies!

# Requirements
The version of Spindle currently uses ES6 styled Arrow Functions. Fully ES5-compliant versions of the library can be expected. Polyfills you may need for older standards include:
- Object.DefinePropterty()
- Object.getOwnPropertyDescriptor()
- Array.isArray()
- Array.from()
- Array.filter()
- Element.querySelectorAll()

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
