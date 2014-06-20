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
    filters = require('./strategies');

function defaultHandlers () {
    var compositeObjectFilter = filters.circular(filters.maxDepth(filters.typeName(filters.object())));
    return {
        'null': filters.skipChildren(filters.fixed('null')),
        'undefined': filters.skipChildren(filters.fixed('undefined')),
        'function': filters.prune(),
        'string': filters.json(),
        'boolean': filters.json(),
        'number': filters.number(),
        'RegExp': filters.toStr(),
        'String': filters.newLike(),
        'Boolean': filters.newLike(),
        'Number': filters.newLike(),
        'Date': filters.newLike(),
        'Array': filters.circular(filters.maxDepth(filters.array())),
        'Object': compositeObjectFilter,
        '@default': compositeObjectFilter
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
        if (typeName(typeHandlers[tname]) === 'function') {
            typeHandlers[tname].call(this, push, x, config);
        } else if (typeName(typeHandlers[tname]) === 'Array') {
            var func = typeHandlers[tname].reduceRight(function(prev, next) {
                return next(prev);
            }, filters.skip);
            var ret = func.call(this, push, x, config);
            if (ret !== 'TERMINAL') {
                skipChildIteration(this);
            }
        } else {
            typeHandlers['@default'].call(this, push, x, config);
        }
        return push;
    };
};

function skipChildIteration (context) {
    context.before(function (node) {
        context.keys = [];
    });
}

function stringify (obj, opts, handlers) {
    var acc = [],
        push = function (str) {
            acc.push(str);
        };
    traverse(obj).reduce(createStringifier(opts, handlers), push);
    return acc.join('');
}

stringify.filters = filters;
stringify.defaultConfig = defaultConfig;
stringify.defaultHandlers = defaultHandlers;
module.exports = stringify;
