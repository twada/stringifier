stringifier
================================

Yet another stringify function.


DESCRIPTION
---------------------------------------

`stringifier` is a function like `JSON.stringify` but intended to be more customizable. For example,

- Max depth for recursive Object tree traversal
- Per-type customization
- Circular reference handling


Please note that `stringifier` is a beta version product. Pull-requests, issue reports and patches are always welcomed.

This is a spin-off product of [power-assert](http://github.com/twada/power-assert) project.


EXAMPLE
---------------------------------------

## Simplest usage

```javascript
var stringify = require('stringifier').stringify;
console.log(stringify(anyVar));
```


API
---------------------------------------


### stringifier(options, handlers)

`require('stringifier')` exports single function `stringifier` that accepts `options` and `handlers` as optional parameters and returns configured function for stringify. This is the comprehensive usage.

```javascript
var stringifier = require('stringifier');
var stringify = stringifier(options, handlers);
console.log(stringify(anyVar));
```


### stringifier.stringify(val, options, handlers)

For more simplified usage, `stringifier` has a function `stringify`, that simply takes target object/value and returns stringified result string. `stringifier.stringify` accepts `options` and `handlers` as second and third optional parameters too.

```javascript
var stringify = require('stringifier').stringify;
console.log(stringify(anyVar));
```


CONFIGURATION
---------------------------------------

### options


#### options.maxDepth
Type: `number`
Default value: `null`

Max depth for recursive Object tree traversal


#### options.indent
Type: `String`
Default value: `null`

string value for indentation.
If this value is not empty, stringified result may contain multiple lines.


#### options.lineSeparator
Type: `String`
Default value: `'\n'`

string value for line-separator.
Makes sense only if `options.indent` is not empty.


#### options.anonymous
Type: `String`
Default value: `'@Anonymous'`

Type name string alternative for displaying Object created by anonymous constructor


#### options.circular
Type: `String`
Default value: `'#@Circular#'`

Alternative string for displaying Circular reference


#### options.snip
Type: `String`
Default value: `'..(snip)'`

For displaying truncated string



### handlers

`handlers` is a object where property names are type names (string, number, ...) and values are per-type stringify strategy functions. Various stringify strategies are defined in `stringifier.strategies`.  And default strategies are defined as follows.

```javascript
var s = require('./strategies');
function defaultHandlers () {
    return {
        'null': s.always('null'),
        'undefined': s.always('undefined'),
        'function': s.prune(),
        'string': s.json(),
        'boolean': s.json(),
        'number': s.number(),
        'RegExp': s.toStr(),
        'String': s.newLike(),
        'Boolean': s.newLike(),
        'Number': s.newLike(),
        'Date': s.newLike(),
        'Array': s.array(),
        'Object': s.object(),
        '@default': s.object()
    };
}
```



HOWTO
---------------------------------------

## cookbook
- blacklist by replacer
- whitelist
- custom strategy by replacer




INSTALL
---------------------------------------

### via npm

Install

    $ npm install --save stringifier

Use

```javascript
var stringify = require('stringifier').stringify;
console.log(stringify(anyVar));
```

### via bower

Install

    $ bower install --save stringifier

Load (`stringifier` function is exported)

    <script type="text/javascript" src="./path/to/bower_components/stringifier/build/stringifier.js"></script>

Use

```javascript
console.log(stringifier.stringify(anyVar));
```


AUTHOR
---------------------------------------
* [Takuto Wada](http://github.com/twada)


LICENSE
---------------------------------------
Licensed under the [MIT](http://twada.mit-license.org/) license.
