var typeName = require('type-name'),
    strategies = require('./strategies');

function defaultHandlers () {
    return {
        'null': strategies.stringifyByFixedValue('null'),
        'undefined': strategies.stringifyByFixedValue('undefined'),
        'function': strategies.stringifyByFixedValue('#function#'),
        'string': strategies.stringifyByJSON,
        'boolean': strategies.stringifyByJSON,
        'number': strategies.stringifyNumber,
        'RegExp': strategies.stringifyByToString,
        'String': strategies.stringifyPrimitiveWrapper,
        'Boolean': strategies.stringifyPrimitiveWrapper,
        'Number': strategies.stringifyPrimitiveWrapper,
        'Date': strategies.stringifyPrimitiveWrapper,
        'Array': strategies.stringifyArray,
        'Object': strategies.stringifyObject
    };
};

function createDumper (opts) {
    var config = {}, handlers = defaultHandlers();
    if (typeName(opts) === 'Object') {
        if (typeName(opts.maxDepth) === 'number' && 0 < opts.maxDepth) {
            config.maxDepth = opts.maxDepth;
        }
        if (typeName(opts.indent) === 'string' && opts.indent !== '') {
            config.indent = opts.indent;
        }
    }
    config.lineSeparator = '\n';

    return function dump (push, x) {
        var tname = typeName(this.node);
        if (typeof handlers[tname] === 'function') {
            handlers[tname].call(this, push, x, config);
        } else {
            strategies.stringifyObject.call(this, push, x, config);
        }
        return push;
    };
};

module.exports = createDumper;
