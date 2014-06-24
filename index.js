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

function createStringifier (customConfig, customHandlers) {
    var config = extend(defaultConfig(), customConfig),
        handlers = extend(defaultHandlers(), customHandlers);
    return function stringifyAny (push, x) {
        var context = this,
            tname = typeName(context.node),
            children,
            acc = {
                context: context,
                config: config,
                handlers: handlers,
                push: push
            },
            pathStr = '/' + context.path.join('/');
        if (typeName(handlers[pathStr]) === 'function') {
            children = handlers[pathStr](acc, x);
        } else if (typeName(handlers[tname]) === 'function') {
            children = handlers[tname](acc, x);
        } else {
            children = handlers['@default'](acc, x);
        }
        if (typeName(children) === 'Array') {
            this.keys = children;
        }
        return push;
    };
}

function walk (val, reducer) {
    var buffer = [],
        push = function (str) {
            buffer.push(str);
        };
    traverse(val).reduce(reducer, push);
    return buffer.join('');
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
