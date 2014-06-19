var typeName = require('type-name');

function stringifyByJSON (push, x, config) {
    push(JSON.stringify(x));
}

function stringifyByToString (push, x, config) {
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

function skipChildIteration (context) {
    context.before(function (node) {
        context.keys = [];
    });
}

function stringifyPrimitiveWrapper (push, x, config) {
    var tname = typeName(this.node);
    skipChildIteration(this);
    push('new ' + tname + '(' + JSON.stringify(x) + ')');
}

function stringifyArray (push, x, config) {
    var prunedName = '#Array#';
    if (config.maxDepth && config.maxDepth <= this.level) {
        skipChildIteration(this);
        push(prunedName);
        return;
    }
    this.before(function () {
        push('[');
    });
    this.after(function () {
        afterCompound(this, push, config);
        push(']');
    });
    this.pre(function (val, key) {
        if (config.indent) {
            push(config.lineSeparator);
            for(var i = 0; i <= this.level; i += 1) {
                push(config.indent);
            }
        }
    });
    this.post(function (node) {
        var parentKeys = node.parent.keys,
            idx = parentKeys.indexOf(node.key);
        if (idx !== -1 && idx < (parentKeys.length - 1)) {
            push(',');
        }
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

function stringifyObject (push, x, config) {
    var tname = typeName(this.node);
    tname = (tname === '') ? 'Object' : tname;
    var prunedName = '#' + tname + '#';
    if (config.maxDepth && config.maxDepth <= this.level) {
        skipChildIteration(this);
        push(prunedName);
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
        if (config.indent) {
            push(config.lineSeparator);
            for(var i = 0; i <= this.level; i += 1) {
                push(config.indent);
            }
        }
        push(sanitizeKey(key) + ':');
        if (config.indent) {
            push(' ');
        }
    });
    this.post(function (node) {
        var parentKeys = node.parent.keys,
            idx = parentKeys.indexOf(node.key);
        if (idx !== -1 && idx < (parentKeys.length - 1)) {
            push(',');
        }
    });
}

function sanitizeKey (key) {
    return /^[A-Za-z_]+$/.test(key) ? key : JSON.stringify(key);
}


var handlers = {
    'null': function (push, x, config) {
        push('null');
    },
    'undefined': function (push, x, config) {
        push('undefined');
    },
    'function': function (push, x, config) {
        push('#function#');
    },
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
