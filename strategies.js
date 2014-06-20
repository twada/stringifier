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

function rune (str) {
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









function stringifyByPrunedName (mark) {
    mark = mark || '#';
    return function (push, x, config) {
        var tname = typeName(this.node);
        skipChildIteration(this);
        push(mark + tname + mark);
    };
}

function skipChildren (inner) {
    return function (push, x, config) {
        skipChildIteration(this);
        inner.call(this, push, x, config);
    };
}

function fixed (str) {
    return function (push, x, config) {
        push(str);
    };
}

function stringifyByPrunedName (mark) {
    mark = mark || '#';
    return function (push, x, config) {
        var tname = typeName(this.node);
        skipChildIteration(this);
        push(mark + tname + mark);
    };
}

function stringifyByJSON (replacer) {
    return function (push, x, config) {
        skipChildIteration(this);
        push(JSON.stringify(x, replacer));
    };
}

function stringifyByToString () {
    return function (push, x, config) {
        skipChildIteration(this);
        push(x.toString());
    };
}

function stringifyNumber (inner) {
    inner = inner || stringifyByJSON();
    return function (push, x, config) {
        if (isNaN(x)) {
            push('NaN');
            return;
        }
        if (!isFinite(x)) {
            push(x === Infinity ? 'Infinity' : '-Infinity');
            return;
        }
        inner.call(this, push, x, config);
    };
}

function stringifyNewLike (inner) {
    inner = inner || stringifyByJSON();
    return function (push, x, config) {
        skipChildIteration(this);
        push('new ' + typeName(this.node) + '(');
        inner.call(this, push, x, config);
        push(')');
    };
}

function stringifyTypeName (inner) {
    return function (push, x, config) {
        var tname = typeName(this.node);
        tname = (tname === '') ? 'Object' : tname;
        push(tname);
        inner.call(this, push, x, config);
    };
}

function stringifyCircular (inner, str) {
    str = str || '#@Circular#';
    return function (push, x, config) {
        if (this.circular) {
            push(str);
            return;
        }
        inner.call(this, push, x, config);
    };
}

function stringifyMaxDepth (inner) {
    return function (push, x, config) {
        var tname = typeName(this.node);
        tname = (tname === '') ? 'Object' : tname;
        if (isMaxDepth(this, config)) {
            skipChildIteration(this);
            push('#' + tname + '#');
            return;
        }
        inner.call(this, push, x, config);
    };
}

function stringifyArray () {
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
    };
}

function stringifyObject () {
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
    };
}

function isMaxDepth (context, config) {
    return (config.maxDepth && config.maxDepth <= context.level);
}

function sanitizeKey (key) {
    return /^[A-Za-z_]+$/.test(key) ? key : JSON.stringify(key);
}

function skipChildIteration (context) {
    context.before(function (node) {
        context.keys = [];
    });
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

module.exports = {
    f: {
        compose: compose,
        rune: rune,
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

    fixed: fixed,
    skipChildren: skipChildren,
    prune: stringifyByPrunedName,
    json: stringifyByJSON,
    toStr: stringifyByToString,
    number: stringifyNumber,
    newLike: stringifyNewLike,

    circular: stringifyCircular,
    maxDepth: stringifyMaxDepth,
    typeName: stringifyTypeName,
    array: stringifyArray,
    object: stringifyObject
};
