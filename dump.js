var typeName = require('type-name');

function stringifyNumber(num) {
    if (isNaN(num)) {
        return 'NaN';
    }
    if (!isFinite(num)) {
        return num === Infinity ? 'Infinity' : '-Infinity';
    }
    return JSON.stringify(num);
}

function sanitizeKey (key) {
    if (!/^[A-Za-z_]+$/.test(key)) {
        return JSON.stringify(key);
    }
    return key;
}

function dumper (acc, x) {
    var maxDepth = 1;
    var tname = typeName(this.node);
    tname = (tname === '') ? 'Object' : tname;
    switch(tname) {
    case 'null':
        acc.push('null');
        break;
    case 'undefined':
        acc.push('undefined');
        break;
    case 'function':
        acc.push('#function#');
        break;
    case 'string':
    case 'boolean':
        acc.push(JSON.stringify(x));
        break;
    case 'number':
        acc.push(stringifyNumber(x));
        break;
    case 'RegExp':
        acc.push(x.toString());
        break;
    case 'String':
    case 'Boolean':
    case 'Number':
    case 'Date':
        this.before(function (node) {
            this.keys = [];  // skip child iteration if any
        });
        acc.push('new ' + tname + '(' + JSON.stringify(x) + ')');
        break;
    case 'Array':
        if (maxDepth <= this.level) {
            this.before(function (node) {
                this.keys = [];  // skip child iteration
            });
            acc.push('#Array#');
            break;
        }
        this.before(function () {
            acc.push('[');
        });
        this.after(function () {
            acc.push(']');
        });
        this.post(function (node) {
            var parentKeys = node.parent.keys,
                idx = parentKeys.indexOf(node.key);
            if (idx !== -1 && idx < (parentKeys.length - 1)) {
                acc.push(',');
            }
        });
        break;
    default:  // Object
        if (maxDepth <= this.level) {
            this.before(function (node) {
                this.keys = [];  // skip child iteration
            });
            acc.push('#' + tname + '#');
            break;
        }
        this.before(function (node) {
            acc.push(tname + '{');
        });
        this.after(function (node) {
            acc.push('}');
        });
        this.pre(function (val, key) {
            acc.push(sanitizeKey(key) + ':');
        });
        this.post(function (node) {
            var parentKeys = node.parent.keys,
                idx = parentKeys.indexOf(node.key);
            if (idx !== -1 && idx < (parentKeys.length - 1)) {
                acc.push(',');
            }
        });
        break;
    }
    return acc;
}

module.exports = dumper;
