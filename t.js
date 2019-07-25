var Ctor = (function(global){
    function iCtor(args){    //iCtor is actually an object.
        if (!this || this === global) {
            return new iCtor(args);
        }
        return this;
    }
    return iCtor;
})(this);


/*
upon executing the Ctor function, this === global
anonymous function immidiately returns with iCtor function as return value, making Ctor = iCtor; next time Ctor is called, iCtor will be called.
the first time the user calls Ctor(arg), this === global, because "this" refers to the object it belongs to, which is the same this that the IIFE was.
this will always happen every time the user calls Ctor().


1. in a method (object function), this refers to the owner object
2. alone, it refers to global
3. in a function, refers to owner (default global)
4. in a function in strict, undefined
5. in an event, refers to element that recieved event

then, iCtor sees that, by 3, this === global. it then returns new iCtor(args).
now this refers to the owner of the new iCtor, which, because this is a recursive call, is iCtor. therefore, this we jump out of the recursion and this, iCtor, is returned.

this ensures that every time Ctor is called, it will create a new version of itself.
*/

//Simpler way:

var Ctor = function(args){
   if(!this || this === window)
        return new Ctor(args);
        
    function privateConstructor(args){/*...*/};
    privateConstructor(args)

    return this;
}

//even simpler way:
var Ctor = function(args){
    var privateConstructor = function(args){/*this.foo = bar*/}
    return new privateConstructor(args);
}

//super simple:

var Ctor = function(args){
    return new ((args)=>{/*this.foo = bar*/})(args);
}