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
        'null': strategies.stringifyByFixedValue('null'),
        'undefined': strategies.stringifyByFixedValue('undefined'),
        'function': strategies.stringifyByFixedValue('#function#'),
        'string': strategies.stringifyByJSON,
        'boolean': strategies.stringifyByJSON,
        'number': strategies.stringifyNumber,
        'RegExp': strategies.stringifyByToString,
        'String': strategies.stringifyPrimitiveWrapper,
        'Boolean': strategies.stringifyPrimitiveWrapper,
        'Number': strategies.stringifyPrimitiveWrapper,
        'Date': strategies.stringifyPrimitiveWrapper,
        'Array': strategies.stringifyArray,
        'Object': strategies.stringifyObject,
        '@default':  strategies.stringifyObject
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
