var typeName = require('type-name');

function terminal (push, x, config) {
    return 'TERMINAL';
}

function constant (str) {
    return function (inner) {
        return function (push, x, config) {
            push(str);
            return;
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

function rune (str) {
    return function (inner) {
        return function (push, x, config) {
            push(str);
            return inner.call(this, push, x, config);
        };
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

function skip (inner) {
    return function (push, x, config) {
        return 'SKIP';
        // skipChildIteration(this);
        // return inner.call(this, push, x, config);
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
    rune: rune,
    typeNameOr: typeNameOr,

    fixed: fixed,
    constant: constant,
    skip: skip,
    terminal: terminal,
    skipChildren: skipChildren,
    prune: stringifyByPrunedName,
    toStr: stringifyByToString,
    json: stringifyByJSON,
    number: stringifyNumber,
    newLike: stringifyNewLike,
    circular: stringifyCircular,
    maxDepth: stringifyMaxDepth,
    typeName: stringifyTypeName,
    array: stringifyArray,
    object: stringifyObject
};
