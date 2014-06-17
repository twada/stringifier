/**
 * shallow-stringify
 * 
 * https://github.com/twada/shallow-stringify
 *
 * Copyright (c) 2014 Takuto Wada
 * Licensed under the MIT license.
 *   http://twada.mit-license.org/
 */

'use strict';

var traverse = require('traverse'),
    typeName = require('type-name'),
    dump = require('./lib/dump');

function stringify(obj, opts) {
    // var depth = 1;
    // if (typeName(opts) === 'Object' && typeName(opts.maxDepth) === 'number') {
    //     depth = opts.maxDepth;
    // }
    var actual = traverse(obj).reduce(dump, []);
    return actual.join('');
}

module.exports = stringify;
