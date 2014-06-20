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
    strategies = require('./strategies');

function defaultHandlers () {
    return {
        'null': strategies.fixed('null'),
        'undefined': strategies.fixed('undefined'),
        'function': strategies.fixed('#function#'),
        'string': strategies.json(),
        'boolean': strategies.json(),
        'number': strategies.number(),
        'RegExp': strategies.toStr(),
        'String': strategies.primitiveWrapper(),
        'Boolean': strategies.primitiveWrapper(),
        'Number': strategies.primitiveWrapper(),
        'Date': strategies.primitiveWrapper(),
        'Array': strategies.array(),
        'Object': strategies.object(),
        '@default':  strategies.object()
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
        var tname = typeName(this.node);
        if (typeof typeHandlers[tname] === 'function') {
            typeHandlers[tname].call(this, push, x, config);
        } else {
            typeHandlers['@default'].call(this, push, x, config);
        }
        return push;
    };
};

function stringify (obj, opts, handlers) {
    var acc = [],
        push = function (str) {
            acc.push(str);
        };
    traverse(obj).reduce(createStringifier(opts, handlers), push);
    return acc.join('');
}

stringify.strategies = strategies;
stringify.defaultConfig = defaultConfig;
stringify.defaultHandlers = defaultHandlers;
module.exports = stringify;
