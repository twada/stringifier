!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.stringifier=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
/**
 * stringifier
 * 
 * https://github.com/twada/stringifier
 *
 * Copyright (c) 2014 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */
'use strict';

var traverse = _dereq_('traverse'),
    typeName = _dereq_('type-name'),
    extend = _dereq_('xtend'),
    s = _dereq_('./strategies');

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

function defaultOptions () {
    return {
        maxDepth: null,
        indent: null,
        anonymous: '@Anonymous',
        circular: '#@Circular#',
        snip: '..(snip)',
        lineSeparator: '\n',
        typeFun: typeName
    };
}

function createStringifier (customOptions) {
    var options = extend(defaultOptions(), customOptions),
        handlers = extend(defaultHandlers(), options.handlers);
    return function stringifyAny (push, x) {
        var context = this,
            handler = handlerFor(context.node, options, handlers),
            currentPath = '/' + context.path.join('/'),
            customization = handlers[currentPath],
            acc = {
                context: context,
                options: options,
                handlers: handlers,
                push: push
            };
        if (typeName(customization) === 'function') {
            handler = customization;
        } else if (typeName(customization) === 'number') {
            handler = s.flow.compose(s.filters.truncate(customization),handler);
        }
        handler(acc, x);
        return push;
    };
}

function handlerFor (val, options, handlers) {
    var tname = options.typeFun(val);
    if (typeName(handlers[tname]) === 'function') {
        return handlers[tname];
    }
    return handlers['@default'];
}

function walk (val, reducer) {
    var buffer = [],
        push = function (str) {
            buffer.push(str);
        };
    traverse(val).reduce(reducer, push);
    return buffer.join('');
}

function stringify (val, options) {
    return walk(val, createStringifier(options));
}

function stringifier (options) {
    return function (val) {
        return walk(val, createStringifier(options));
    };
}

stringifier.stringify = stringify;
stringifier.strategies = s;
stringifier.defaultOptions = defaultOptions;
stringifier.defaultHandlers = defaultHandlers;
module.exports = stringifier;

},{"./strategies":5,"traverse":2,"type-name":3,"xtend":4}],2:[function(_dereq_,module,exports){
var traverse = module.exports = function (obj) {
    return new Traverse(obj);
};

function Traverse (obj) {
    this.value = obj;
}

Traverse.prototype.get = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            node = undefined;
            break;
        }
        node = node[key];
    }
    return node;
};

Traverse.prototype.has = function (ps) {
    var node = this.value;
    for (var i = 0; i < ps.length; i ++) {
        var key = ps[i];
        if (!node || !hasOwnProperty.call(node, key)) {
            return false;
        }
        node = node[key];
    }
    return true;
};

Traverse.prototype.set = function (ps, value) {
    var node = this.value;
    for (var i = 0; i < ps.length - 1; i ++) {
        var key = ps[i];
        if (!hasOwnProperty.call(node, key)) node[key] = {};
        node = node[key];
    }
    node[ps[i]] = value;
    return value;
};

Traverse.prototype.map = function (cb) {
    return walk(this.value, cb, true);
};

Traverse.prototype.forEach = function (cb) {
    this.value = walk(this.value, cb, false);
    return this.value;
};

Traverse.prototype.reduce = function (cb, init) {
    var skip = arguments.length === 1;
    var acc = skip ? this.value : init;
    this.forEach(function (x) {
        if (!this.isRoot || !skip) {
            acc = cb.call(this, acc, x);
        }
    });
    return acc;
};

Traverse.prototype.paths = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.path); 
    });
    return acc;
};

Traverse.prototype.nodes = function () {
    var acc = [];
    this.forEach(function (x) {
        acc.push(this.node);
    });
    return acc;
};

Traverse.prototype.clone = function () {
    var parents = [], nodes = [];
    
    return (function clone (src) {
        for (var i = 0; i < parents.length; i++) {
            if (parents[i] === src) {
                return nodes[i];
            }
        }
        
        if (typeof src === 'object' && src !== null) {
            var dst = copy(src);
            
            parents.push(src);
            nodes.push(dst);
            
            forEach(objectKeys(src), function (key) {
                dst[key] = clone(src[key]);
            });
            
            parents.pop();
            nodes.pop();
            return dst;
        }
        else {
            return src;
        }
    })(this.value);
};

function walk (root, cb, immutable) {
    var path = [];
    var parents = [];
    var alive = true;
    
    return (function walker (node_) {
        var node = immutable ? copy(node_) : node_;
        var modifiers = {};
        
        var keepGoing = true;
        
        var state = {
            node : node,
            node_ : node_,
            path : [].concat(path),
            parent : parents[parents.length - 1],
            parents : parents,
            key : path.slice(-1)[0],
            isRoot : path.length === 0,
            level : path.length,
            circular : null,
            update : function (x, stopHere) {
                if (!state.isRoot) {
                    state.parent.node[state.key] = x;
                }
                state.node = x;
                if (stopHere) keepGoing = false;
            },
            'delete' : function (stopHere) {
                delete state.parent.node[state.key];
                if (stopHere) keepGoing = false;
            },
            remove : function (stopHere) {
                if (isArray(state.parent.node)) {
                    state.parent.node.splice(state.key, 1);
                }
                else {
                    delete state.parent.node[state.key];
                }
                if (stopHere) keepGoing = false;
            },
            keys : null,
            before : function (f) { modifiers.before = f },
            after : function (f) { modifiers.after = f },
            pre : function (f) { modifiers.pre = f },
            post : function (f) { modifiers.post = f },
            stop : function () { alive = false },
            block : function () { keepGoing = false }
        };
        
        if (!alive) return state;
        
        function updateState() {
            if (typeof state.node === 'object' && state.node !== null) {
                if (!state.keys || state.node_ !== state.node) {
                    state.keys = objectKeys(state.node)
                }
                
                state.isLeaf = state.keys.length == 0;
                
                for (var i = 0; i < parents.length; i++) {
                    if (parents[i].node_ === node_) {
                        state.circular = parents[i];
                        break;
                    }
                }
            }
            else {
                state.isLeaf = true;
                state.keys = null;
            }
            
            state.notLeaf = !state.isLeaf;
            state.notRoot = !state.isRoot;
        }
        
        updateState();
        
        // use return values to update if defined
        var ret = cb.call(state, state.node);
        if (ret !== undefined && state.update) state.update(ret);
        
        if (modifiers.before) modifiers.before.call(state, state.node);
        
        if (!keepGoing) return state;
        
        if (typeof state.node == 'object'
        && state.node !== null && !state.circular) {
            parents.push(state);
            
            updateState();
            
            forEach(state.keys, function (key, i) {
                path.push(key);
                
                if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                
                var child = walker(state.node[key]);
                if (immutable && hasOwnProperty.call(state.node, key)) {
                    state.node[key] = child.node;
                }
                
                child.isLast = i == state.keys.length - 1;
                child.isFirst = i == 0;
                
                if (modifiers.post) modifiers.post.call(state, child);
                
                path.pop();
            });
            parents.pop();
        }
        
        if (modifiers.after) modifiers.after.call(state, state.node);
        
        return state;
    })(root).node;
}

function copy (src) {
    if (typeof src === 'object' && src !== null) {
        var dst;
        
        if (isArray(src)) {
            dst = [];
        }
        else if (isDate(src)) {
            dst = new Date(src.getTime ? src.getTime() : src);
        }
        else if (isRegExp(src)) {
            dst = new RegExp(src);
        }
        else if (isError(src)) {
            dst = { message: src.message };
        }
        else if (isBoolean(src)) {
            dst = new Boolean(src);
        }
        else if (isNumber(src)) {
            dst = new Number(src);
        }
        else if (isString(src)) {
            dst = new String(src);
        }
        else if (Object.create && Object.getPrototypeOf) {
            dst = Object.create(Object.getPrototypeOf(src));
        }
        else if (src.constructor === Object) {
            dst = {};
        }
        else {
            var proto =
                (src.constructor && src.constructor.prototype)
                || src.__proto__
                || {}
            ;
            var T = function () {};
            T.prototype = proto;
            dst = new T;
        }
        
        forEach(objectKeys(src), function (key) {
            dst[key] = src[key];
        });
        return dst;
    }
    else return src;
}

var objectKeys = Object.keys || function keys (obj) {
    var res = [];
    for (var key in obj) res.push(key)
    return res;
};

function toS (obj) { return Object.prototype.toString.call(obj) }
function isDate (obj) { return toS(obj) === '[object Date]' }
function isRegExp (obj) { return toS(obj) === '[object RegExp]' }
function isError (obj) { return toS(obj) === '[object Error]' }
function isBoolean (obj) { return toS(obj) === '[object Boolean]' }
function isNumber (obj) { return toS(obj) === '[object Number]' }
function isString (obj) { return toS(obj) === '[object String]' }

var isArray = Array.isArray || function isArray (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn)
    else for (var i = 0; i < xs.length; i++) {
        fn(xs[i], i, xs);
    }
};

forEach(objectKeys(Traverse.prototype), function (key) {
    traverse[key] = function (obj) {
        var args = [].slice.call(arguments, 1);
        var t = new Traverse(obj);
        return t[key].apply(t, args);
    };
});

var hasOwnProperty = Object.hasOwnProperty || function (obj, key) {
    return key in obj;
};

},{}],3:[function(_dereq_,module,exports){
/**
 * type-name - Just a reasonable typeof
 * 
 * https://github.com/twada/type-name
 *
 * Copyright (c) 2014 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */
'use strict';

var toStr = Object.prototype.toString;

function funcName (f) {
    return f.name ? f.name : /^\s*function\s*([^\(]*)/im.exec(f.toString())[1];
}

function ctorName (obj) {
    var strName = toStr.call(obj).slice(8, -1);
    if (strName === 'Object') {
        return funcName(obj.constructor);
    }
    return strName;
}

function typeName (val) {
    var type;
    if (val === null) {
        return 'null';
    }
    type = typeof(val);
    if (type === 'object') {
        return ctorName(val);
    }
    return type;
}

module.exports = typeName;

},{}],4:[function(_dereq_,module,exports){
module.exports = extend

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],5:[function(_dereq_,module,exports){
'use strict';

var typeName = _dereq_('type-name'),
    slice = Array.prototype.slice,
    END = {},
    ITERATE = {};

// arguments should end with end or iterate
function compose () {
    var filters = slice.apply(arguments);
    return filters.reduceRight(function(right, left) {
        return left(right);
    });
}

// skip children
function end () {
    return function (acc, x) {
        acc.context.keys = [];
        return END;
    };
}

// iterate children
function iterate () {
    return function (acc, x) {
        return ITERATE;
    };
}

function filter (predicate) {
    return function (next) {
        return function (acc, x) {
            var toBeIterated,
                isIteratingArray = (typeName(x) === 'Array');
            if (typeName(predicate) === 'function') {
                toBeIterated = [];
                acc.context.keys.forEach(function (key) {
                    var indexOrKey = isIteratingArray ? parseInt(key, 10) : key,
                        kvp = {
                            key: indexOrKey,
                            value: x[key]
                        },
                        decision = predicate(kvp);
                    if (decision) {
                        toBeIterated.push(key);
                    }
                    if (typeName(decision) === 'number') {
                        truncateByKey(decision, key, acc);
                    }
                    if (typeName(decision) === 'function') {
                        customizeStrategyForKey(decision, key, acc);
                    }
                });
                acc.context.keys = toBeIterated;
            }
            return next(acc, x);
        };
    };
}

function customizeStrategyForKey (strategy, key, acc) {
    acc.handlers[currentPath(key, acc)] = strategy;
}

function truncateByKey (size, key, acc) {
    acc.handlers[currentPath(key, acc)] = size;
}

function currentPath (key, acc) {
    var pathToCurrentNode = [''].concat(acc.context.path);
    if (typeName(key) !== 'undefined') {
        pathToCurrentNode.push(key);
    }
    return pathToCurrentNode.join('/');
}

function allowedKeys (orderedWhiteList) {
    return function (next) {
        return function (acc, x) {
            var isIteratingArray = (typeName(x) === 'Array');
            if (!isIteratingArray && typeName(orderedWhiteList) === 'Array') {
                acc.context.keys = orderedWhiteList.filter(function (propKey) {
                    return acc.context.keys.indexOf(propKey) !== -1;
                });
            }
            return next(acc, x);
        };
    };
}

function when (guard, then) {
    return function (next) {
        return function (acc, x) {
            var kvp = {
                key: acc.context.key,
                value: x
            };
            if (guard(kvp, acc)) {
                return then(acc, x);
            }
            return next(acc, x);
        };
    };
}

function truncate (size) {
    return function (next) {
        return function (acc, x) {
            var orig = acc.push, ret;
            acc.push = function (str) {
                var savings = str.length - size,
                    truncated;
                if (savings <= size) {
                    orig.call(acc, str);
                } else {
                    truncated = str.substring(0, size);
                    orig.call(acc, truncated + acc.options.snip);
                }
            };
            ret = next(acc, x);
            acc.push = orig;
            return ret;
        };
    };
}

function constructorName () {
    return function (next) {
        return function (acc, x) {
            var name = acc.options.typeFun(x);
            if (name === '') {
                name = acc.options.anonymous;
            }
            acc.push(name);
            return next(acc, x);
        };
    };
}

function always (str) {
    return function (next) {
        return function (acc, x) {
            acc.push(str);
            return next(acc, x);
        };
    };
}

function optionValue (key) {
    return function (next) {
        return function (acc, x) {
            acc.push(acc.options[key]);
            return next(acc, x);
        };
    };
}

function json (replacer) {
    return function (next) {
        return function (acc, x) {
            acc.push(JSON.stringify(x, replacer));
            return next(acc, x);
        };
    };
}

function toStr () {
    return function (next) {
        return function (acc, x) {
            acc.push(x.toString());
            return next(acc, x);
        };
    };
}

function decorateArray () {
    return function (next) {
        return function (acc, x) {
            acc.context.before(function (node) {
                acc.push('[');
            });
            acc.context.after(function (node) {
                afterAllChildren(this, acc.push, acc.options);
                acc.push(']');
            });
            acc.context.pre(function (val, key) {
                beforeEachChild(this, acc.push, acc.options);
            });
            acc.context.post(function (childContext) {
                afterEachChild(childContext, acc.push);
            });
            return next(acc, x);
        };
    };
}

function decorateObject () {
    return function (next) {
        return function (acc, x) {
            acc.context.before(function (node) {
                acc.push('{');
            });
            acc.context.after(function (node) {
                afterAllChildren(this, acc.push, acc.options);
                acc.push('}');
            });
            acc.context.pre(function (val, key) {
                beforeEachChild(this, acc.push, acc.options);
                acc.push(sanitizeKey(key) + (acc.options.indent ? ': ' : ':'));
            });
            acc.context.post(function (childContext) {
                afterEachChild(childContext, acc.push);
            });
            return next(acc, x);
        };
    };
}

function sanitizeKey (key) {
    return /^[A-Za-z_]+$/.test(key) ? key : JSON.stringify(key);
}

function afterAllChildren (context, push, options) {
    if (options.indent && 0 < context.keys.length) {
        push(options.lineSeparator);
        for(var i = 0; i < context.level; i += 1) { // indent level - 1
            push(options.indent);
        }
    }
}

function beforeEachChild (context, push, options) {
    if (options.indent) {
        push(options.lineSeparator);
        for(var i = 0; i <= context.level; i += 1) {
            push(options.indent);
        }
    }
}

function afterEachChild (childContext, push) {
    if (!childContext.isLast) {
        push(',');
    }
}

function nan (kvp, acc) {
    return kvp.value !== kvp.value;
}

function positiveInfinity (kvp, acc) {
    return !isFinite(kvp.value) && kvp.value === Infinity;
}

function negativeInfinity (kvp, acc) {
    return !isFinite(kvp.value) && kvp.value !== Infinity;
}

function circular (kvp, acc) {
    return acc.context.circular;
}

function maxDepth (kvp, acc) {
    return (acc.options.maxDepth && acc.options.maxDepth <= acc.context.level);
}

var prune = compose(
    always('#'),
    constructorName(),
    always('#'),
    end()
);
var omitNaN = when(nan, compose(
    always('NaN'),
    end()
));
var omitPositiveInfinity = when(positiveInfinity, compose(
    always('Infinity'),
    end()
));
var omitNegativeInfinity = when(negativeInfinity, compose(
    always('-Infinity'),
    end()
));
var omitCircular = when(circular, compose(
    optionValue('circular'),
    end()
));
var omitMaxDepth = when(maxDepth, prune);

module.exports = {
    filters: {
        always: always,
        constructorName: constructorName,
        json: json,
        toStr: toStr,
        prune: prune,
        truncate: truncate,
        decorateArray: decorateArray,
        decorateObject: decorateObject
    },
    flow: {
        compose: compose,
        when: when,
        allowedKeys: allowedKeys,
        filter: filter,
        iterate: iterate,
        end: end
    },
    symbols: {
        END: END,
        ITERATE: ITERATE
    },
    always: function (str) {
        return compose(always(str), end());
    },
    json: function () {
        return compose(json(), end());
    },
    toStr: function () {
        return compose(toStr(), end());
    },
    prune: function () {
        return prune;
    },
    number: function () {
        return compose(
            omitNaN,
            omitPositiveInfinity,
            omitNegativeInfinity,
            json(),
            end()
        );
    },
    newLike: function () {
        return compose(
            always('new '),
            constructorName(),
            always('('),
            json(),
            always(')'),
            end()
        );
    },
    array: function (predicate) {
        return compose(
            omitCircular,
            omitMaxDepth,
            decorateArray(),
            filter(predicate),
            iterate()
        );
    },
    object: function (predicate, orderedWhiteList) {
        return compose(
            omitCircular,
            omitMaxDepth,
            constructorName(),
            decorateObject(),
            allowedKeys(orderedWhiteList),
            filter(predicate),
            iterate()
        );
    }
};

},{"type-name":3}]},{},[1])(1)
});