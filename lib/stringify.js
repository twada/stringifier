'use strict';

var traverse = require('traverse'),
    createDumper = require('./dump');

function stringify(obj, opts) {
    var acc = [],
        push = function (str) {
            acc.push(str);
        };
    traverse(obj).reduce(createDumper(opts), push);
    return acc.join('');
}

module.exports = stringify;
