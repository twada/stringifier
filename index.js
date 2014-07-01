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
        'null': s.always('null'),
        'undefined': s.always('undefined'),
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
        anonymous: '@Anonymous',
        circular: '#@Circular#',
        snip: '..(snip)',
        lineSeparator: '\n'
    };
}

function createStringifier (customConfig, customHandlers) {
    var config = extend(defaultConfig(), customConfig),
        handlers = extend(defaultHandlers(), customHandlers);
    return function stringifyAny (push, x) {
        var context = this,
            handler = handlerFor(context.node, handlers),
            currentPath = '/' + context.path.join('/'),
            customization = handlers[currentPath],
            acc = {
                context: context,
                config: config,
                handlers: handlers,
                push: push
            };
        if (typeName(customization) === 'function') {
            handler = customization;
        } else if (typeName(customization) === 'number') {
            handler = s.flow.compose(s.filters.truncate(customization), handler);
        }
        handler(acc, x);
        return push;
    };
}

function handlerFor (val, handlers) {
    var tname = typeName(val);
    if (typeName(handlers[tname]) === 'function') {
        return handlers[tname];
    }
    return handlers['@default'];
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
