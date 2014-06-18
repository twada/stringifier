var typeName = require('type-name');

function stringifyByJSON (acc, x, config) {
    acc.push(JSON.stringify(x));
}

function stringifyByToString (acc, x, config) {
    acc.push(x.toString());
}

function stringifyNumber (acc, x, config) {
    if (isNaN(x)) {
        acc.push('NaN');
        return;
    }
    if (!isFinite(x)) {
        acc.push(x === Infinity ? 'Infinity' : '-Infinity');
        return;
    }
    acc.push(JSON.stringify(x));
    return;
}

function stringifyPrimitiveWrapper (acc, x, config) {
    var tname = typeName(this.node);
    this.before(function (node) {
        this.keys = [];  // skip child iteration if any
    });
    acc.push('new ' + tname + '(' + JSON.stringify(x) + ')');
}

function stringifyArray (acc, x, config) {
    var prunedName = '#Array#';
    if (config.maxDepth && config.maxDepth <= this.level) {
        this.before(function (node) {
            this.keys = [];  // skip child iteration
        });
        acc.push(prunedName);
        return;
    }
    this.before(function () {
        acc.push('[');
    });
    this.after(function () {
        if (config.indent && 0 < this.keys.length) {
            acc.push(config.lineSeparator);
            for(var i = 0; i < this.level; i += 1) { // indent level - 1
                acc.push(config.indent);
            }
        }
        acc.push(']');
    });
    this.pre(function (val, key) {
        if (config.indent) {
            acc.push(config.lineSeparator);
            for(var i = 0; i <= this.level; i += 1) {
                acc.push(config.indent);
            }
        }
    });
    this.post(function (node) {
        var parentKeys = node.parent.keys,
            idx = parentKeys.indexOf(node.key);
        if (idx !== -1 && idx < (parentKeys.length - 1)) {
            acc.push(',');
        }
    });
}

function stringifyObject (acc, x, config) {
    var tname = typeName(this.node);
    tname = (tname === '') ? 'Object' : tname;
    var prunedName = '#' + tname + '#';
    if (config.maxDepth && config.maxDepth <= this.level) {
        this.before(function (node) {
            this.keys = [];  // skip child iteration
        });
        acc.push(prunedName);
        return;
    }
    this.before(function (node) {
        acc.push(tname + '{');
    });
    this.after(function (node) {
        if (config.indent && 0 < this.keys.length) {
            acc.push(config.lineSeparator);
            for(var i = 0; i < this.level; i += 1) { // indent level - 1
                acc.push(config.indent);
            }
        }
        acc.push('}');
    });
    this.pre(function (val, key) {
        if (config.indent) {
            acc.push(config.lineSeparator);
            for(var i = 0; i <= this.level; i += 1) {
                acc.push(config.indent);
            }
        }
        acc.push(sanitizeKey(key) + ':');
        if (config.indent) {
            acc.push(' ');
        }
    });
    this.post(function (node) {
        var parentKeys = node.parent.keys,
            idx = parentKeys.indexOf(node.key);
        if (idx !== -1 && idx < (parentKeys.length - 1)) {
            acc.push(',');
        }
    });
}

function sanitizeKey (key) {
    return /^[A-Za-z_]+$/.test(key) ? key : JSON.stringify(key);
}


var handlers = {
    'null': function (acc, x, config) {
        acc.push('null');
    },
    'undefined': function (acc, x, config) {
        acc.push('undefined');
    },
    'function': function (acc, x, config) {
        acc.push('#function#');
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

    return function dump (acc, x) {
        var tname = typeName(this.node);
        if (typeof handlers[tname] === 'function') {
            handlers[tname].call(this, acc, x, config);
            return acc;
        }
        stringifyObject.call(this, acc, x, config);
        return acc;
    };
};

module.exports = createDumper;
