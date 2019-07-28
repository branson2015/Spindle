![Spindle Logo](spindle-logo.png)
# Spindle.js
A JavaScript library for front-end development.

## Example Usage

```javascript
var obj = {p1: 'val1', p2: 'val2', p3: undefined, p4: 'val4', p5: {p5-1: 'test', p5-2: 'test2'},....};
var element = document.getElementById("test");
bind(obj, element, {
    //THESE ARE MAPPING OBJECT EXAMPLES
    p1: 'div.div.ul.li[0].a',
    p2: '.classname[0]',
    p3: '.classname',           -p3 will be an array
    p4: '#id'
    p5: {
       p5-1: document.getElementsByTagName("body")[0] 
    },
    "p5.p5-2": '#id'

    'p6': 'whatever:type' - :type signifies class, innerHTML, innerText, etc (what value to bind to, innerHTML by default)    
    'p7': function(){...} - will return string in form of previous versions

    'p8': ['#id1', '#id2'] ---equivalent to below
    'p9': '#id1 #id2'      ---equivalent to above
    'p10[n]': '#id'
    p10: [
        p10_1: '#id' --- same as 'p10[0].p10_1': '#id'
    ]

    p11: {type: 'className', fn: function}
});
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.