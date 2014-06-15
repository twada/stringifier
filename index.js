/**
 * shallow-stringify
 * 
 * https://github.com/twada/shallow-stringify
 *
 * Copyright (c) 2014 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */

'use strict';

var typeName = require('type-name'),
    keys = Object.keys || require('object-keys'),
    globalConstructors = [
        Boolean,
        Date,
        Number,
        RegExp,
        String
    ];

function stringify(obj, opts) {
    var depth = 2;
    if (typeName(opts) === 'Object' && typeName(opts.depth) === 'number') {
        depth = opts.depth;
    }
    return stringifyAny(obj, depth);
}

function stringifyAny(obj, depth) {
    switch(typeof obj) {
    case 'string':
    case 'boolean':
        return JSON.stringify(obj);
    case 'number':
        return stringifyNumber(obj);
    case 'function':
        return '#function#';
    case 'undefined':
        return 'undefined';
    case 'object':
        if (obj === null) {
            return 'null';
        } else if (Array.isArray(obj)) {
            return stringifyArray(obj, depth);
        } else {
            return stringifyObject(obj, depth);
        }
        break;
    default:
        break;
    }
}

function stringifyNumber(num) {
    if (isNaN(num)) {
        return 'NaN';
    }
    if (!isFinite(num)) {
        return num === Infinity ? 'Infinity' : '-Infinity';
    }
    return JSON.stringify(num);
}

function stringifyArray(ary, depth) {
    depth -= 1;
    if (depth === 0) {
        return '#Array#';
    }
    return '[' + ary.map(function (elem, idx) {
        return stringifyAny(elem, depth);
    }).join(',') + ']';
}

function stringifyObject(obj, depth) {
    var pairs, cname;
    depth -= 1;
    if (obj instanceof RegExp) {
        return obj.toString();
    }
    cname = typeName(obj);
    if (cname === '') {
        cname = 'Object';
    }
    if (globalConstructors.some(function (ctor) { return obj instanceof ctor; })) {
        return 'new ' + cname + '(' + JSON.stringify(obj) + ')';
    }
    if (depth === 0) {
        return '#' + cname + '#';
    }
    pairs = [];
    keys(obj).forEach(function (key) {
        var val = stringifyAny(obj[key], depth);
        if (!/^[A-Za-z_]+$/.test(key)) {
            key = JSON.stringify(key);
        }
        pairs.push(key + ':' + val);
    });
    return cname + '{' + pairs.join(',') + '}';
}

module.exports = stringify;
