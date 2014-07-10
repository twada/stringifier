stringifier
================================

Yet another stringify function.


DESCRIPTION
---------------------------------------

`stringifier` is a function like `JSON.stringify` but intended to be more customizable. For example,

- Max depth for recursive Object tree traversal
- Per-type output customization
- Circular reference handling


Please note that `stringifier` is a beta version product. Pull-requests, issue reports and patches are always welcomed.

Note that `stringifier` is a spin-off product of [power-assert](http://github.com/twada/power-assert) project.


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

`handlers` is a object where property names are type names (string, number, ...) and values are per-type stringify strategy functions. Various strategies are defined in `stringifier.strategies`, and default strategies are defined as follows.

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

If unknown type is detected, strategy function registered by `'@default'` key will be used.


### strategies

For given `Student` pseudo-class and a `stringifier`,

```javascript
var stringifier = require('stringifier'),
    s = stringifier.strategies,
    assert = require('assert'),

function Student (name, age, gender) {
    this.name = name;
    this.age = age;
    this.gender = gender;
}

var student = new Student('tom', 10, 'M');
```

#### always

`always` strategy always returns passed constant (In this case, `'foo'`).

```javascript
var stringify = stringifier(null, {
  'Student': s.always('foo')
});
assert(stringify(student) === 'foo');
```

#### json

`json` strategy applies `JSON.stringify` to input value then return the result string.

```javascript
var stringify = stringifier(null, {
  'Student': s.json()
});
assert(stringify(student) === '{"name":"tom","age":10,"gender":"M"}');
```

#### toStr

`toStr` strategy calls `toString()` to input value then return the result string.

```javascript
var stringify = stringifier(null, {
  'Student': s.toStr()
});
assert(stringify(student) === '[object Object]');
```

#### prune

`prune` strategy does not serialize target value but returns target type name surrounded by `#`.

```javascript
var stringify = stringifier(null, {
  'Student': s.prune()
});
assert(stringify(student) === '#Student#');
```

#### newLike

`newLike` strategy emulates "new constructor call pattern".

```javascript
var stringify = stringifier(null, {
  'Student': s.newLike()
});
assert(stringify(student) === 'new Student({"name":"tom","age":10,"gender":"M"})');
```

#### object

`object` strategy stringifies target object recursively and decorate object literal-like syntax with its type name. `object` is a default strategy for objects, and any other unknown types.

```javascript
var stringify = stringifier(null, {
  'Student': s.object()
});
assert(stringify(student) === 'Student{name:"tom",age:10,gender:"M"}');
```

#### array

`array` strategy is an array specific stringification strategy, and is a default strategy for arrays.

```javascript
var stringify = stringifier(null, {
  'Array': s.array()
});
assert(stringify(['foo', 'bar', 'baz']) === '["foo","bar","baz"]');
```

#### number

`number` strategy is a number specific stringification strategy, and is a default strategy for number. `number` strategy also provides `NaN`,`Infinity` and `-Infinity` handling.

```javascript
var stringify = stringifier(null, {
  'Array': s.array(),
  'number': s.number()
});
assert(stringify([NaN, 0, Infinity, -0, -Infinity]) === '[NaN,0,Infinity,0,-Infinity]');
```



HOWTO
---------------------------------------

For given values,

```javascript
var stringifier = require('stringifier');

function Student (name, age, gender) {
    this.name = name;
    this.age = age;
    this.gender = gender;
}

var AnonStudent = function(name, age, gender) {
    this.name = name;
    this.age = age;
    this.gender = gender;
};

var student = new Student('tom', 10, 'M');
var anonStudent = new AnonStudent('mary', 9, 'F');

var values = [
    'string', 
    [null, undefined],
    {
        primitives: [true, false, -5, 98.6],
        specific: {
            regex: /^not/,
            numbers: [NaN, Infinity, -Infinity]
        },
        userDefined: [
            student,
            anonStudent
        ]
    }
];
```


#### default output

```javascript
var stringify = stringifier();
console.log(stringify(values));
```
result:

```javascript
["string",[null,undefined],Object{primitives:[true,false,-5,98.6],specific:Object{regex:/^not/,numbers:[NaN,Infinity,-Infinity]},userDefined:[Student{name:"tom",age:10,gender:"M"},@Anonymous{name:"mary",age:9,gender:"F"}]}]
```


#### pretty printing

Use `indent` option for pretty printing. Using four spaces for indentation in this case.

```javascript
var stringify = stringifier({indent: '    '});
console.log(stringify(values));
```

result:

```javascript
[
    "string",
    [
        null,
        undefined
    ],
    Object{
        primitives: [
            true,
            false,
            -5,
            98.6
        ],
        specific: Object{
            regex: /^not/,
            numbers: [
                NaN,
                Infinity,
                -Infinity
            ]
        },
        userDefined: [
            Student{
                name: "tom",
                age: 10,
                gender: "M"
            },
            @Anonymous{
                name: "mary",
                age: 9,
                gender: "F"
            }
        ]
    }
]
```


#### depth limitation

Use `maxDepth` option to stringify at most specified levels.

```javascript
var stringify = stringifier({maxDepth: 3, indent: '    '});
console.log(stringify(values));
```

result:

```javascript
[
    "string",
    [
        null,
        undefined
    ],
    Object{
        primitives: [
            true,
            false,
            -5,
            98.6
        ],
        specific: Object{
            regex: /^not/,
            numbers: #Array#
        },
        userDefined: [
            #Student#,
            #@Anonymous#
        ]
    }
]
```


#### anonymous class label

Use `anonymous` option to specify alternate type name for anonymous constructors.

```javascript
var stringify = stringifier({anonymous: 'ANON'});
console.log(stringify(anonStudent));
```

result:

```javascript
ANON{name:"mary",age:9,gender:"F"}
```


#### omit specific property from output

```javascript
var handlers = {
    'Student': s.object(function (kvp) {
        return ['age', 'gender'].indexOf(kvp.key) === -1;
    })
};
var stringify = stringifier(null, handlers);
console.log(stringify(student));
```

result:

```javascript
Student{name:"tom"}
```



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
