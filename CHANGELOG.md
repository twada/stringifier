## [1.0.0](https://github.com/twada/stringifier/releases/tag/v1.0.0) (2014-11-09)


#### Features

* **stringifier:** absorb `handlers` argument into `options.handlers` ([0b073f53](https://github.com/twada/stringifier/commit/0b073f535eb0e99e97938c6101d8d2086f53a1df))


#### Breaking Changes

* Now `handlers` are moved to `options.handlers`. `handlers` argument is no more.

- changed `stringifier(options, handlers)` to `stringifier(options)`
- changed `stringifier.stringify(val, options, handlers)` to `stringifier.stringify(val, options)`

To migrate, change your code from the following:

```
var stringifier = require('stringifier');
var stringify = stringifier(options, handlers);
console.log(stringify(anyVar));
```

To:

```
var stringifier = require('stringifier');
options.handlers = handlers;
var stringify = stringifier(options);
console.log(stringify(anyVar));
```

And

```
var stringify = require('stringifier').stringify;
console.log(stringify(anyVar, options, handlers));
```

To:

```
var stringify = require('stringifier').stringify;
options.handlers = handlers;
console.log(stringify(anyVar, options));
```

 ([0b073f53](https://github.com/twada/stringifier/commit/0b073f535eb0e99e97938c6101d8d2086f53a1df))


### [0.1.2](https://github.com/twada/stringifier/releases/tag/v0.1.2) (2014-10-27)


#### Bug Fixes

* **stringifier:** do not truncate if string length is short enough ([2d22e44e](https://github.com/twada/stringifier/commit/2d22e44e15ea8c3eb5aae70dc6067de9b1878115))


