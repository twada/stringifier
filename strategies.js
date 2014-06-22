var typeName = require('type-name'),
    slice = Array.prototype.slice;

// arguments should end with skip or iter or iterateArray or iterateObject
function compose () {
    var filters = slice.apply(arguments);
    return filters.reduceRight(function(right, left) {
        return left(right);
    });
};

function skip (push, x, config) {
    return []; // skip children
}

function iter (push, x, config) {
    return; // iterate children
}

function when (predicate, then) {
    return function (inner) {
        return function (push, x, config) {
            if (predicate.call(this, push, x, config)) {
                return then.call(this, push, x, config);
            }
            return inner.call(this, push, x, config);
        };
    };
}

function typeNameOr (anon) {
    anon = anon || 'Object';
    return function (inner) {
        return function (push, x, config) {
            var name = typeName(this.node);
            name = (name === '') ? anon : name;
            push(name);
            return inner.call(this, push, x, config);
        };
    };
}

function fixedString (str) {
    return function (inner) {
        return function (push, x, config) {
            push(str);
            return inner.call(this, push, x, config);
        };
    };
}

function json (replacer) {
    return function (inner) {
        return function (push, x, config) {
            push(JSON.stringify(x, replacer));
            return inner.call(this, push, x, config);
        };
    };
}

function toStr () {
    return function (inner) {
        return function (push, x, config) {
            push(x.toString());
            return inner.call(this, push, x, config);
        };
    };
}

function iterateArray () {
    return function (push, x, config) {
        this.before(function (node) {
            push('[');
        });
        this.after(function (node) {
            afterCompound(this, push, config);
            push(']');
        });
        this.pre(function (val, key) {
            preCompound(this, push, config);
        });
        this.post(function (childContext) {
            postCompound(childContext, push);
        });
        return; // iterate children
    };
}

function iterateObject () {
    return function (push, x, config) {
        this.before(function (node) {
            push('{');
        });
        this.after(function (node) {
            afterCompound(this, push, config);
            push('}');
        });
        this.pre(function (val, key) {
            preCompound(this, push, config);
            push(sanitizeKey(key) + (config.indent ? ': ' : ':'));
        });
        this.post(function (childContext) {
            postCompound(childContext, push);
        });
        return; // iterate children
    };
}

function sanitizeKey (key) {
    return /^[A-Za-z_]+$/.test(key) ? key : JSON.stringify(key);
}

function afterCompound (context, push, config) {
    if (config.indent && 0 < context.keys.length) {
        push(config.lineSeparator);
        for(var i = 0; i < context.level; i += 1) { // indent level - 1
            push(config.indent);
        }
    }
}

function preCompound (context, push, config) {
    if (config.indent) {
        push(config.lineSeparator);
        for(var i = 0; i <= context.level; i += 1) {
            push(config.indent);
        }
    }
}

function postCompound (childContext, push) {
    if (!childContext.isLast) {
        push(',');
    }
}

function nan (push, x, config) {
    return x !== x;
}

function positiveInfinity (push, x, config) {
    return !isFinite(x) && x === Infinity;
}

function negativeInfinity (push, x, config) {
    return !isFinite(x) && x !== Infinity;
}

function circular (push, x, config) {
    return this.circular;
}

function maxDepth (push, x, config) {
    return (config.maxDepth && config.maxDepth <= this.level);
}

var prune = compose(fixedString('#'), typeNameOr('Object'), fixedString('#'), skip);
var omitNaN = when(nan, compose(fixedString('NaN'), skip));
var omitPositiveInfinity = when(positiveInfinity, compose(fixedString('Infinity'), skip));
var omitNegativeInfinity = when(negativeInfinity, compose(fixedString('-Infinity'), skip));
var omitCircular = when(circular, compose(fixedString('#@Circular#'), skip));
var omitMaxDepth = when(maxDepth, prune);

module.exports = {
    f: {
        compose: compose,
        when: when,
        fixedString: fixedString,
        typeNameOr: typeNameOr,
        json: json,
        toStr: toStr,
        iterateArray: iterateArray,
        iterateObject: iterateObject,
        iter: iter,
        skip: skip
    },
    fixed: function (str) {
        return compose(fixedString(str), skip);
    },
    json: function () {
        return compose(json(), skip);
    },
    toStr: function () {
        return compose(toStr(), skip);
    },
    prune: function () {
        return prune;
    },
    number: function () {
        return compose(omitNaN, omitPositiveInfinity, omitNegativeInfinity, json(), skip);
    },
    newLike: function () {
        return compose(fixedString('new '), typeNameOr('@Anonymous'), fixedString('('), json(), fixedString(')'), skip);
    },
    array: function () {
        return compose(omitCircular, omitMaxDepth, iterateArray());
    },
    object: function () {
        return compose(omitCircular, omitMaxDepth, typeNameOr('Object'), iterateObject());
    }
};
