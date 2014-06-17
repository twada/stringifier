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
    createDumper = require('./lib/dump');

function stringify(obj, opts) {
    return traverse(obj).reduce(createDumper(opts), []).join('');
}

module.exports = stringify;
