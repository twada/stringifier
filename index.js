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
    filters = require('./strategies'),
    f = require('./strategies').f;

function defaultHandlers () {
    var compositeObjectFilter = filters.circular(filters.maxDepth(filters.typeName(filters.object()))),
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
        'Array': f.compose(f.ifCircular('#@Circular#'), f.ifMaxDepth(f.compose(f.rune('#'), f.typeNameOr('@Anonymous'), f.rune('#'), f.skip)), f.array, f.iter),
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
        var tname = typeName(this.node),
            children;
        if (typeName(typeHandlers[tname]) === 'function') {
            children = typeHandlers[tname].call(this, push, x, config);
        } else if (typeName(typeHandlers[tname]) === 'Array') {
            // console.log('custom filter for: ' + tname);
            var func = typeHandlers[tname].reduceRight(function(right, left) {
                return left(right);
            }, f.skip);
            children = func.call(this, push, x, config);
        } else {
            children = typeHandlers['@default'].call(this, push, x, config);
        }
        if (typeName(children) === 'Array') {
            this.before(function (node) {
                this.keys = children;
            });
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
