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
    createDumper = require('./lib/dump');

function stringify(obj, opts) {
    var acc = [],
        push = function (str) {
            acc.push(str);
        };
    traverse(obj).reduce(createDumper(opts), push);
    return acc.join('');
}

module.exports = stringify;
