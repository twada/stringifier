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
    f = require('./strategies');

function defaultHandlers () {
    var compositeObjectFilter = f.circular(f.maxDepth(f.typeName(f.object()))),
        newLike = [f.rune('new '), f.typeNameOr('anonymous'), f.rune('('), f.jsonx(), f.rune(')')];
    return {
        'null': [f.rune('null')],
        'undefined': [f.rune('undefined')],
        'function': [f.rune('#function#')],
        'string': [f.jsonx()],
        'boolean': [f.jsonx()],
        'number': [f.nanOrInfinity, f.jsonx()],
        'RegExp': [f.tos],
        'String': newLike,
        'Boolean': newLike,
        'Number': newLike,
        'Date': newLike,
        'Array': f.circular(f.maxDepth(f.array())),
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
            // console.log('custom filter for: ' + tname);
            var func = typeHandlers[tname].reduceRight(function(right, left) {
                return left(right);
            }, f.skip);
            var ret = func.call(this, push, x, config);
            if (typeName(ret) === 'Array') {
                this.before(function (node) {
                    this.keys = ret;
                });
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

stringify.filters = f;
stringify.defaultConfig = defaultConfig;
stringify.defaultHandlers = defaultHandlers;
module.exports = stringify;
