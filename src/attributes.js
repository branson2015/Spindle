export var defaultAttributeMap = {
  audio: 'src',
  embed: 'src',
  form: 'action',
  img: 'src',
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
}

export function getDefaultAttribute(elementName) {
  var rval = defaultAttributeMap[elementName];
  if(rval === undefined)
    rval = 'innerHTML';
  return rval;
}