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

function dumper (acc, x) {
    //console.log(JSON.stringify(this.path));
    var tname = typeName(this.node);
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
        this.before(function (node) {
            this.keys = [];  // skip child iteration
        });
        acc.push('new ' + tname + '(' + JSON.stringify(x) + ')');
        break;
    case 'Boolean':
    case 'Number':
    case 'Date':
        acc.push('new ' + tname + '(' + JSON.stringify(x) + ')');
        break;
    case 'Array':
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
    default:
        // Object
        this.before(function (node) {
            var className = tname === '' ? 'Object' : tname;
            acc.push(className + '{');
        });
        this.after(function (node) {
            acc.push('}');
        });
        this.pre(function (val, key) {
            acc.push(key + ':');
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
