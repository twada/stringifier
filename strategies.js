var typeName = require('type-name');

function stringifyByFixedValue (str) {
    return function (push, x, config) {
        skipChildIteration(this);
        push(str);
    };
}

function stringifyByJSON (replacer, indent) {
    return function (push, x, config) {
        skipChildIteration(this);
        push(JSON.stringify(x, replacer, indent));
    };
}

function stringifyByToString () {
    return function (push, x, config) {
        skipChildIteration(this);
        push(x.toString());
    };
}

function stringifyNumber () {
    return function (push, x, config) {
        if (isNaN(x)) {
            push('NaN');
            return;
        }
        if (!isFinite(x)) {
            push(x === Infinity ? 'Infinity' : '-Infinity');
            return;
        }
        push(JSON.stringify(x));
    };
}

function stringifyPrimitiveWrapper () {
    return function (push, x, config) {
        var tname = typeName(this.node);
        skipChildIteration(this);
        push('new ' + tname + '(' + JSON.stringify(x) + ')');
    };
}

function stringifyArray () {
    return function (push, x, config) {
        if (this.circular) {
            push('#@Circular#');
            return;
        }
        if (isMaxDepth(this, config)) {
            skipChildIteration(this);
            push('#Array#');
            return;
        }
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
        var tname = typeName(this.node);
        tname = (tname === '') ? 'Object' : tname;
        if (this.circular) {
            push('#@Circular#');
            return;
        }
        if (isMaxDepth(this, config)) {
            skipChildIteration(this);
            push('#' + tname + '#');
            return;
        }
        this.before(function (node) {
            push(tname + '{');
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
    fixed: stringifyByFixedValue,
    toStr: stringifyByToString,
    json: stringifyByJSON,
    number: stringifyNumber,
    primitiveWrapper: stringifyPrimitiveWrapper,
    array: stringifyArray,
    object: stringifyObject
};
