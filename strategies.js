'use strict';

var typeName = require('type-name'),
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
                    if (typeName(decision) === 'function') {
                        customizeStrategyForKey(key, decision, acc);
                    }
                });
                acc.context.keys = toBeIterated;
            }
            return next(acc, x);
        };
    };
}

function customizeStrategyForKey (key, strategy, acc) {
    var pathToCurrentNode = [''].concat(acc.context.path);
    if (typeName(key) !== 'undefined') {
        pathToCurrentNode.push(key);
    }
    acc.handlers[pathToCurrentNode.join('/')] = strategy;
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
                var truncated = str.substring(0, size);
                orig.call(acc, truncated + '..(snip)');
            };
            ret = next(acc, x);
            acc.push = orig;
            return ret;
        };
    };
}

function typeNameOr (anon) {
    anon = anon || 'Object';
    return function (next) {
        return function (acc, x) {
            var name = typeName(x);
            name = (name === '') ? anon : name;
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
                afterAllChildren(this, acc.push, acc.config);
                acc.push(']');
            });
            acc.context.pre(function (val, key) {
                beforeEachChild(this, acc.push, acc.config);
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
                afterAllChildren(this, acc.push, acc.config);
                acc.push('}');
            });
            acc.context.pre(function (val, key) {
                beforeEachChild(this, acc.push, acc.config);
                acc.push(sanitizeKey(key) + (acc.config.indent ? ': ' : ':'));
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

function afterAllChildren (context, push, config) {
    if (config.indent && 0 < context.keys.length) {
        push(config.lineSeparator);
        for(var i = 0; i < context.level; i += 1) { // indent level - 1
            push(config.indent);
        }
    }
}

function beforeEachChild (context, push, config) {
    if (config.indent) {
        push(config.lineSeparator);
        for(var i = 0; i <= context.level; i += 1) {
            push(config.indent);
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
    return (acc.config.maxDepth && acc.config.maxDepth <= acc.context.level);
}

var prune = compose(
    always('#'),
    typeNameOr('Object'),
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
    always('#@Circular#'),
    end()
));
var omitMaxDepth = when(maxDepth, prune);

module.exports = {
    filters: {
        always: always,
        typeNameOr: typeNameOr,
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
            typeNameOr('@Anonymous'),
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
            typeNameOr('Object'),
            decorateObject(),
            allowedKeys(orderedWhiteList),
            filter(predicate),
            iterate()
        );
    }
};
