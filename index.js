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
    var prune = f.compose(f.str('#'), f.typeNameOr('Object'), f.str('#'), f.skip),
        compositeObjectFilter = f.compose(f.ifCircular(f.compose(f.str('#@Circular#'), f.skip)), f.ifMaxDepth(prune), f.typeNameOr('Object'), f.object, f.iter),
        newLike = f.compose(f.str('new '), f.typeNameOr('anonymous'), f.str('('), f.jsonx(), f.str(')'), f.skip);
    return {
        'null': f.compose(f.str('null'), f.skip),
        'undefined': f.compose(f.str('undefined'), f.skip),
        'function': prune,
        'string': f.compose(f.jsonx(), f.skip),
        'boolean': f.compose(f.jsonx(), f.skip),
        'number': f.compose(f.nanOrInfinity, f.jsonx(), f.skip),
        'RegExp': f.compose(f.tos, f.skip),
        'String': newLike,
        'Boolean': newLike,
        'Number': newLike,
        'Date': newLike,
        'Array': f.compose(f.ifCircular(f.compose(f.str('#@Circular#'), f.skip)), f.ifMaxDepth(prune), f.array, f.iter),
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
