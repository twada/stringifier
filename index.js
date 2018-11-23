/**
 * stringifier
 *
 * https://github.com/twada/stringifier
 *
 * Copyright (c) 2014-2018 Takuto Wada
 * Licensed under the MIT license.
 *   https://twada.mit-license.org/2014-2018
 */
'use strict';

const traverse = require('traverse');
const typeName = require('type-name');
const s = require('./strategies');

function defaultHandlers () {
  return {
    'null': s.always('null'),
    'undefined': s.always('undefined'),
    'function': s.prune(),
    'string': s.json(),
    'boolean': s.json(),
    'number': s.number(),
    'symbol': s.toStr(),
    'RegExp': s.toStr(),
    'String': s.newLike(),
    'Boolean': s.newLike(),
    'Number': s.newLike(),
    'Date': s.newLike(),
    'Array': s.array(),
    'Object': s.object(),
    'Error': s.object(null, ['message', 'code']),
    '@default': s.object()
  };
}

function defaultOptions () {
  return {
    maxDepth: null,
    indent: null,
    anonymous: '@Anonymous',
    circular: '#@Circular#',
    snip: '..(snip)',
    lineSeparator: '\n',
    typeFun: typeName
  };
}

function createStringifier (customOptions) {
  const options = Object.assign({}, defaultOptions(), customOptions);
  const handlers = Object.assign({}, defaultHandlers(), options.handlers);
  return function stringifyAny (push, x) {
    const context = this;
    let handler = handlerFor(context.node, options, handlers);
    const currentPath = '/' + context.path.join('/');
    const customization = handlers[currentPath];
    const acc = {
      context: context,
      options: options,
      handlers: handlers,
      push: push
    };
    if (typeof customization === 'function') {
      handler = customization;
    } else if (typeof customization === 'number') {
      handler = s.flow.compose(s.filters.truncate(customization), handler);
    } else if (context.parent && Array.isArray(context.parent.node) && !(context.key in context.parent.node)) {
      // sparse arrays
      handler = s.always('');
    }
    handler(acc, x);
    return push;
  };
}

function handlerFor (val, options, handlers) {
  const tname = options.typeFun(val);
  if (typeof handlers[tname] === 'function') {
    return handlers[tname];
  }
  if (tname.endsWith('Error')) {
    return handlers['Error'];
  }
  return handlers['@default'];
}

function walk (val, reducer) {
  const buffer = [];
  const push = function (str) {
    buffer.push(str);
  };
  traverse(val).reduce(reducer, push);
  return buffer.join('');
}

function stringify (val, options) {
  return walk(val, createStringifier(options));
}

function stringifier (options) {
  return function (val) {
    return walk(val, createStringifier(options));
  };
}

stringifier.stringify = stringify;
stringifier.strategies = s;
stringifier.defaultOptions = defaultOptions;
stringifier.defaultHandlers = defaultHandlers;
module.exports = stringifier;
