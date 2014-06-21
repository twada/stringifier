var typeName = require('type-name'),
    slice = Array.prototype.slice;

// arguments should end with skip or iter
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

function toStr (inner) {
    return function (push, x, config) {
        push(x.toString());
        return inner.call(this, push, x, config);
    };
}

function nanOrInfinity (inner) {
    return function (push, x, config) {
        if (isNaN(x)) {
            push('NaN');
            return [];
        }
        if (!isFinite(x)) {
            push(x === Infinity ? 'Infinity' : '-Infinity');
            return [];
        }
        return inner.call(this, push, x, config);
    };
}

function ifCircular (then) {
    return function (inner) {
        return function (push, x, config) {
            if (this.circular) {
                return then.call(this, push, x, config);
            }
            return inner.call(this, push, x, config);
        };
    };
}

function ifMaxDepth (then) {
    return function (inner) {
        return function (push, x, config) {
            if (isMaxDepth(this, config)) {
                return then.call(this, push, x, config);
            }
            return inner.call(this, push, x, config);
        };
    };
}

function arrayx (inner) {
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
        // return; // iterate children
        return inner.call(this, push, x, config);
    };
}

function objectx (inner) {
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
        return inner.call(this, push, x, config);
    };
}

function isMaxDepth (context, config) {
    return (config.maxDepth && config.maxDepth <= context.level);
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

var omitCircular = ifCircular(compose(fixedString('#@Circular#'), skip)),
    omitMaxDepth = ifMaxDepth(compose(fixedString('#'), typeNameOr('Object'), fixedString('#'), skip));

module.exports = {
    f: {
        compose: compose,
        str: fixedString,
        typeNameOr: typeNameOr,
        jsonx: json,
        tos: toStr,
        nanOrInfinity: nanOrInfinity,
        ifCircular: ifCircular,
        ifMaxDepth: ifMaxDepth,
        array: arrayx,
        object: objectx,
        iter: iter,
        skip: skip
    },
    s: {
        fixed: function (str) {
            return compose(fixedString(str), skip);
        },
        json: function () {
            return compose(json(), skip);
        },
        toStr: function () {
            return compose(toStr, skip);
        },
        prune: function () {
            return compose(fixedString('#'), typeNameOr('Object'), fixedString('#'), skip);
        },
        number: function () {
            return compose(nanOrInfinity, json(), skip);
        },
        newLike: function () {
            return compose(fixedString('new '), typeNameOr('@Anonymous'), fixedString('('), json(), fixedString(')'), skip);
        },
        array: function () {
            return compose(omitCircular, omitMaxDepth, arrayx, iter);
        },
        object: function () {
            return compose(omitCircular, omitMaxDepth, typeNameOr('Object'), objectx, iter);
        }
    }
};
