/**
 * stringifier
 * 
 * https://github.com/twada/stringifier
 *
 * Copyright (c) 2014 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */
'use strict';

var traverse = require('traverse'),
    typeName = require('type-name'),
    extend = require('xtend'),
    s = require('./strategies');

function defaultHandlers () {
    return {
        'null': s.fixed('null'),
        'undefined': s.fixed('undefined'),
        'function': s.prune(),
        'string': s.json(),
        'boolean': s.json(),
        'number': s.number(),
        'RegExp': s.toStr(),
        'String': s.newLike(),
        'Boolean': s.newLike(),
        'Number': s.newLike(),
        'Date': s.newLike(),
        'Array': s.array(),
        'Object': s.object(),
        '@default': s.object()
    };
}

function defaultConfig () {
    return {
        maxDepth: null,
        indent: null,
        lineSeparator: '\n'
    };
}

function createStringifier (opts, handlers) {
    var config = extend(defaultConfig(), opts),
        typeHandlers = extend(defaultHandlers(), handlers);
    return function stringifyAny (push, x) {
        var tname = typeName(this.node),
            children;
        if (typeName(typeHandlers[tname]) === 'function') {
            children = typeHandlers[tname](this, push, x, config);
        } else {
            children = typeHandlers['@default'](this, push, x, config);
        }
        if (typeName(children) === 'Array') {
            this.keys = children;
        }
        return push;
    };
}

function walk (val, reducer) {
    var acc = [],
        push = function (str) {
            acc.push(str);
        };
    traverse(val).reduce(reducer, push);
    return acc.join('');
}

function stringify (val, config, handlers) {
    return walk(val, createStringifier(config, handlers));
}

function stringifier (config, handlers) {
    return function (val) {
        return walk(val, createStringifier(config, handlers));
    };
}

stringifier.stringify = stringify;
stringifier.strategies = s;
stringifier.defaultConfig = defaultConfig;
stringifier.defaultHandlers = defaultHandlers;
module.exports = stringifier;
