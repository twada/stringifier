'use strict';

var traverse = require('traverse'),
    typeName = require('type-name'),
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

function createStringifier (opts) {
    var config = defaultConfig(),
        handlers = defaultHandlers();

    if (typeName(opts) === 'Object') {
        if (typeName(opts.maxDepth) === 'number' && 0 < opts.maxDepth) {
            config.maxDepth = opts.maxDepth;
        }
        if (typeName(opts.indent) === 'string' && opts.indent !== '') {
            config.indent = opts.indent;
        }
        if (typeName(opts.lineSeparator) === 'string') {
            config.lineSeparator = opts.lineSeparator;
        }
    }

    return function stringifyAny (push, x) {
        var tname = typeName(this.node);
        if (typeof handlers[tname] === 'function') {
            handlers[tname].call(this, push, x, config);
        } else {
            handlers['@default'].call(this, push, x, config);
        }
        return push;
    };
};

function stringify(obj, opts) {
    var acc = [],
        push = function (str) {
            acc.push(str);
        };
    traverse(obj).reduce(createStringifier(opts), push);
    return acc.join('');
}

module.exports = stringify;
