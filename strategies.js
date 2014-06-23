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
    return function (acc, x) {
        return []; // skip children
    };
}

function iterate (filterPredicate) {
    return function (acc, x) {
        var toBeIterated,
            isIteratingArray = (typeName(x) === 'Array');
        if (typeName(filterPredicate) === 'function') {
            toBeIterated = [];
            acc.context.keys.forEach(function (key) {
                var value = x[key],
                    indexOrKey = isIteratingArray ? parseInt(key, 10) : key;
                if (filterPredicate(value, indexOrKey)) {
                    toBeIterated.push(key);
                }
            });
        }
        return toBeIterated;
    };
}

function when (guard, then) {
    return function (next) {
        return function (acc, x) {
            if (guard(x, acc.context.key, acc)) {
                return then(acc, x);
            }
            return next(acc, x);
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

function fixedString (str) {
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

function nan (val, key, acc) {
    return val !== val;
}

function positiveInfinity (val, key, acc) {
    return !isFinite(val) && val === Infinity;
}

function negativeInfinity (val, key, acc) {
    return !isFinite(val) && val !== Infinity;
}

function circular (val, key, acc) {
    return acc.context.circular;
}

function maxDepth (val, key, acc) {
    return (acc.config.maxDepth && acc.config.maxDepth <= acc.context.level);
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
    array: function (filterPredicate) {
        return compose(
            omitCircular,
            omitMaxDepth,
            decorateArray(),
            iterate(filterPredicate)
        );
    },
    object: function (filterPredicate) {
        return compose(
            omitCircular,
            omitMaxDepth,
            typeNameOr('Object'),
            decorateObject(),
            iterate(filterPredicate)
        );
    }
};
