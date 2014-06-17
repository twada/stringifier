var traverse = require('traverse'),
    typeName = require('type-name'),
    assert = require('assert');

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
        this.post(function (ctx) {
            var parentKeys = ctx.parent.keys,
                idx = parentKeys.indexOf(ctx.key);
            if (idx !== -1 && idx < (parentKeys.length - 1)) {
                acc.push(',');
            }
        });
        break;
    default:
        // Object
        this.before(function () {
            acc.push(tname + '{');
        });
        this.after(function () {
            acc.push('}');
        });
        this.pre(function (ctx) {
            acc.push(ctx.key + ':');
        });
        this.post(function (ctx) {
            var parentKeys = ctx.parent.keys,
                idx = parentKeys.indexOf(ctx.key);
            if (idx !== -1 && idx < (parentKeys.length - 1)) {
                acc.push(',');
            }
        });
        break;
    }
    return acc;
}


describe('traverse', function () {
    describe('Array', function () {
        it('flat', function () {
            var input = [4, 5, 6];
            var actual = traverse(input).reduce(dumper, []);
            assert.equal(actual.join(''), '[4,5,6]');
        });
        it('nested', function () {
            var input = [4, [5, [6, 7, 8], 9], 10];
            var actual = traverse(input).reduce(dumper, []);
            assert.equal(actual.join(''), '[4,[5,[6,7,8],9],10]');
        });
    });
});
