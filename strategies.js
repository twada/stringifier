'use strict';

var typeName = require('type-name'),
    slice = Array.prototype.slice;

// arguments should end with end or iterate
function compose () {
    var filters = slice.apply(arguments);
    return filters.reduceRight(function(right, left) {
        return left(right);
    });
}

function end () {
    return function (context, push, x, config) {
        return []; // skip children
    };
}

function iterate (predicate) {
    return function (context, push, x, config) {
        var toBeIterated,
            container = context.node,
            isIteratingArray = (typeName(container) === 'Array');
        if (typeName(predicate) === 'function') {
            toBeIterated = [];
            context.keys.forEach(function (key) {
                var value = container[key],
                    indexOrKey = isIteratingArray ? parseInt(key, 10) : key;
                if (predicate(value, indexOrKey, context, config)) {
                    toBeIterated.push(key);
                }
            });
            return toBeIterated;
        }
        return undefined; // iterate all children
    };
}

function when (predicate, then) {
    return function (next) {
        return function (context, push, x, config) {
            if (predicate(x, context.key, context, config)) {
                return then(context, push, x, config);
            }
            return next(context, push, x, config);
        };
    };
}

function typeNameOr (anon) {
    anon = anon || 'Object';
    return function (next) {
        return function (context, push, x, config) {
            var name = typeName(context.node);
            name = (name === '') ? anon : name;
            push(name);
            return next(context, push, x, config);
        };
    };
}

function fixedString (str) {
    return function (next) {
        return function (context, push, x, config) {
            push(str);
            return next(context, push, x, config);
        };
    };
}

function json (replacer) {
    return function (next) {
        return function (context, push, x, config) {
            push(JSON.stringify(x, replacer));
            return next(context, push, x, config);
        };
    };
}

function toStr () {
    return function (next) {
        return function (context, push, x, config) {
            push(x.toString());
            return next(context, push, x, config);
        };
    };
}

function decorateArray () {
    return function (next) {
        return function (context, push, x, config) {
            context.before(function (node) {
                push('[');
            });
            context.after(function (node) {
                afterAllChildren(this, push, config);
                push(']');
            });
            context.pre(function (val, key) {
                beforeEachChild(this, push, config);
            });
            context.post(function (childContext) {
                afterEachChild(childContext, push);
            });
            return next(context, push, x, config);
        };
    };
}

function decorateObject () {
    return function (next) {
        return function (context, push, x, config) {
            context.before(function (node) {
                push('{');
            });
            context.after(function (node) {
                afterAllChildren(this, push, config);
                push('}');
            });
            context.pre(function (val, key) {
                beforeEachChild(this, push, config);
                push(sanitizeKey(key) + (config.indent ? ': ' : ':'));
            });
            context.post(function (childContext) {
                afterEachChild(childContext, push);
            });
            return next(context, push, x, config);
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

function nan (val, key, context, config) {
    return val !== val;
}

function positiveInfinity (val, key, context, config) {
    return !isFinite(val) && val === Infinity;
}

function negativeInfinity (val, key, context, config) {
    return !isFinite(val) && val !== Infinity;
}

function circular (val, key, context, config) {
    return context.circular;
}

function maxDepth (val, key, context, config) {
    return (config.maxDepth && config.maxDepth <= context.level);
}

var prune = compose(
    fixedString('#'),
    typeNameOr('Object'),
    fixedString('#'),
    end()
);
var omitNaN = when(nan, compose(
    fixedString('NaN'),
    end()
));
var omitPositiveInfinity = when(positiveInfinity, compose(
    fixedString('Infinity'),
    end()
));
var omitNegativeInfinity = when(negativeInfinity, compose(
    fixedString('-Infinity'),
    end()
));
var omitCircular = when(circular, compose(
    fixedString('#@Circular#'),
    end()
));
var omitMaxDepth = when(maxDepth, prune);

module.exports = {
    filters: {
        when: when,
        fixedString: fixedString,
        typeNameOr: typeNameOr,
        json: json,
        toStr: toStr,
        prune: prune,
        decorateArray: decorateArray,
        decorateObject: decorateObject
    },
    terminators: {
        compose: compose,
        iterate: iterate,
        end: end
    },
    fixed: function (str) {
        return compose(fixedString(str), end());
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
            fixedString('new '),
            typeNameOr('@Anonymous'),
            fixedString('('),
            json(),
            fixedString(')'),
            end()
        );
    },
    array: function (predicate) {
        return compose(
            omitCircular,
            omitMaxDepth,
            decorateArray(),
            iterate(predicate)
        );
    },
    object: function (predicate) {
        return compose(
            omitCircular,
            omitMaxDepth,
            typeNameOr('Object'),
            decorateObject(),
            iterate(predicate)
        );
    }
};
