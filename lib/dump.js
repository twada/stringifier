var typeName = require('type-name');

function stringifyByFixedValue (str) {
    return function (push, x, config) {
        push(str);
    };
}

function stringifyByJSON (push, x, config) {
    skipChildIteration(this);
    push(JSON.stringify(x));
}

function stringifyByToString (push, x, config) {
    skipChildIteration(this);
    push(x.toString());
}

function stringifyNumber (push, x, config) {
    if (isNaN(x)) {
        push('NaN');
        return;
    }
    if (!isFinite(x)) {
        push(x === Infinity ? 'Infinity' : '-Infinity');
        return;
    }
    push(JSON.stringify(x));
    return;
}

function stringifyPrimitiveWrapper (push, x, config) {
    var tname = typeName(this.node);
    skipChildIteration(this);
    push('new ' + tname + '(' + JSON.stringify(x) + ')');
}

function stringifyArray (push, x, config) {
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
}

function stringifyObject (push, x, config) {
    var tname = typeName(this.node);
    tname = (tname === '') ? 'Object' : tname;
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


var handlers = {
    'null': stringifyByFixedValue('null'),
    'undefined': stringifyByFixedValue('undefined'),
    'function': stringifyByFixedValue('#function#'),
    'string': stringifyByJSON,
    'boolean': stringifyByJSON,
    'number': stringifyNumber,
    'RegExp': stringifyByToString,
    'String': stringifyPrimitiveWrapper,
    'Boolean': stringifyPrimitiveWrapper,
    'Number': stringifyPrimitiveWrapper,
    'Date': stringifyPrimitiveWrapper,
    'Array': stringifyArray,
    'Object': stringifyObject
};

function createDumper (opts) {
    var config = {};
    if (typeName(opts) === 'Object') {
        if (typeName(opts.maxDepth) === 'number' && 0 < opts.maxDepth) {
            config.maxDepth = opts.maxDepth;
        }
        if (typeName(opts.indent) === 'string' && opts.indent !== '') {
            config.indent = opts.indent;
        }
    }
    config.lineSeparator = '\n';

    return function dump (push, x) {
        var tname = typeName(this.node);
        if (typeof handlers[tname] === 'function') {
            handlers[tname].call(this, push, x, config);
            return push;
        }
        stringifyObject.call(this, push, x, config);
        return push;
    };
};

module.exports = createDumper;
