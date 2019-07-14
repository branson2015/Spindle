export function autogenObj(object, htmlScope){
    if(htmlScope === undefined){
        object = makeObj(htmlScpoe);
        htmlScope = object;
    }

    var mapping = {};
    for(property in object){
        
        if(typeof property === 'object'){
            autogenObj(property, htmlScope);
            continue;
        }

    }
        
}

export function makeObj(htmlScope){
    throw 'not yet implemented'
}