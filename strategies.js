'use strict';

const END = {};
const ITERATE = {};

// arguments should end with end or iterate
function compose () {
  const filters = Array.from(arguments);
  return filters.reduceRight((right, left) => left(right));
}

// skip children
function end () {
  return (acc, x) => {
    acc.context.keys = [];
    return END;
  };
}

// iterate children
function iterate () {
  return (acc, x) => ITERATE;
}

function filter (predicate) {
  return (next) => {
    return (acc, x) => {
      const isIteratingArray = Array.isArray(x);
      if (typeof predicate === 'function') {
        const toBeIterated = [];
        acc.context.keys.forEach((key) => {
          const indexOrKey = isIteratingArray ? parseInt(key, 10) : key;
          const kvp = {
            key: indexOrKey,
            value: x[key]
          };
          const decision = predicate(kvp);
          if (decision) {
            toBeIterated.push(key);
          }
          if (typeof decision === 'number') {
            truncateByKey(decision, key, acc);
          }
          if (typeof decision === 'function') {
            customizeStrategyForKey(decision, key, acc);
          }
        });
        acc.context.keys = toBeIterated;
      }
      return next(acc, x);
    };
  };
}

function customizeStrategyForKey (strategy, key, acc) {
  acc.handlers[currentPath(key, acc)] = strategy;
}

function truncateByKey (size, key, acc) {
  acc.handlers[currentPath(key, acc)] = size;
}

function currentPath (key, acc) {
  const pathToCurrentNode = [''].concat(acc.context.path);
  if (key !== undefined) {
    pathToCurrentNode.push(key);
  }
  return pathToCurrentNode.join('/');
}

function allowedKeys (orderedWhiteList) {
  return (next) => {
    return (acc, x) => {
      if (!Array.isArray(x) && Array.isArray(orderedWhiteList)) {
        acc.context.keys = orderedWhiteList.filter((propKey) => x.hasOwnProperty(propKey));
      }
      return next(acc, x);
    };
  };
}

function safeKeys () {
  return (next) => {
    return (acc, x) => {
      if (!Array.isArray(x)) {
        acc.context.keys = acc.context.keys.filter((propKey) => {
          // Error handling for unsafe property access.
          // For example, on PhantomJS,
          // accessing HTMLInputElement.selectionEnd causes TypeError
          try {
            const _ = x[propKey]; // eslint-disable-line no-unused-vars
            return true;
          } catch (e) {
            // skip unsafe key
            return false;
          }
        });
      }
      return next(acc, x);
    };
  };
}

function arrayIndicesToKeys () {
  return (next) => {
    return (acc, x) => {
      if (Array.isArray(x) && x.length > 0) {
        const indices = Array(x.length);
        for (let i = 0; i < x.length; i += 1) {
          indices[i] = String(i); // traverse uses strings as keys
        }
        acc.context.keys = indices;
      }
      return next(acc, x);
    };
  };
}

function when (guard, then) {
  return (next) => {
    return (acc, x) => {
      const kvp = {
        key: acc.context.key,
        value: x
      };
      if (guard(kvp, acc)) {
        return then(acc, x);
      }
      return next(acc, x);
    };
  };
}

function truncate (size) {
  return (next) => {
    return (acc, x) => {
      const orig = acc.push;
      acc.push = (str) => {
        const savings = str.length - size;
        if (savings <= size) {
          orig.call(acc, str);
        } else {
          const truncated = str.substring(0, size);
          orig.call(acc, truncated + acc.options.snip);
        }
      };
      const ret = next(acc, x);
      acc.push = orig;
      return ret;
    };
  };
}

function constructorName () {
  return (next) => {
    return (acc, x) => {
      let name = acc.options.typeFun(x);
      if (name === '') {
        name = acc.options.anonymous;
      }
      acc.push(name);
      return next(acc, x);
    };
  };
}

function always (str) {
  return (next) => {
    return (acc, x) => {
      acc.push(str);
      return next(acc, x);
    };
  };
}

function optionValue (key) {
  return (next) => {
    return (acc, x) => {
      acc.push(acc.options[key]);
      return next(acc, x);
    };
  };
}

function json (replacer) {
  return (next) => {
    return (acc, x) => {
      acc.push(JSON.stringify(x, replacer));
      return next(acc, x);
    };
  };
}

function toStr () {
  return (next) => {
    return (acc, x) => {
      acc.push(x.toString());
      return next(acc, x);
    };
  };
}

function decorateArray () {
  return (next) => {
    return (acc, x) => {
      acc.context.before(function (node) {
        acc.push('[');
      });
      acc.context.after(function (node) {
        afterAllChildren(this, acc.push, acc.options);
        acc.push(']');
      });
      acc.context.pre(function (val, key) {
        beforeEachChild(this, acc.push, acc.options);
      });
      acc.context.post(function (childContext) {
        afterEachChild(childContext, acc.push);
      });
      return next(acc, x);
    };
  };
}

function decorateObject () {
  return (next) => {
    return (acc, x) => {
      acc.context.before(function (node) {
        acc.push('{');
      });
      acc.context.after(function (node) {
        afterAllChildren(this, acc.push, acc.options);
        acc.push('}');
      });
      acc.context.pre(function (val, key) {
        beforeEachChild(this, acc.push, acc.options);
        acc.push(sanitizeKey(key) + (acc.options.indent ? ': ' : ':'));
      });
      acc.context.post(function (childContext) {
        afterEachChild(childContext, acc.push);
      });
      return next(acc, x);
    };
  };
}

function sanitizeKey (key) {
  return /^[A-Za-z_]+$/.test(key) ? key : JSON.stringify(key);
}

function afterAllChildren (context, push, options) {
  if (options.indent && context.keys.length > 0) {
    push(options.lineSeparator);
    for (let i = 0; i < context.level; i += 1) { // indent level - 1
      push(options.indent);
    }
  }
}

function beforeEachChild (context, push, options) {
  if (options.indent) {
    push(options.lineSeparator);
    for (let i = 0; i <= context.level; i += 1) {
      push(options.indent);
    }
  }
}

function afterEachChild (childContext, push) {
  if (!childContext.isLast) {
    push(',');
  }
}

function nan (kvp, acc) {
  return kvp.value !== kvp.value; // eslint-disable-line no-self-compare
}

function positiveInfinity (kvp, acc) {
  return !isFinite(kvp.value) && kvp.value === Infinity;
}

function negativeInfinity (kvp, acc) {
  return !isFinite(kvp.value) && kvp.value !== Infinity;
}

function circular (kvp, acc) {
  return acc.context.circular;
}

function maxDepth (kvp, acc) {
  return (acc.options.maxDepth && acc.options.maxDepth <= acc.context.level);
}

const prune = compose(
  always('#'),
  constructorName(),
  always('#'),
  end()
);
const omitNaN = when(nan, compose(
  always('NaN'),
  end()
));
const omitPositiveInfinity = when(positiveInfinity, compose(
  always('Infinity'),
  end()
));
const omitNegativeInfinity = when(negativeInfinity, compose(
  always('-Infinity'),
  end()
));
const omitCircular = when(circular, compose(
  optionValue('circular'),
  end()
));
const omitMaxDepth = when(maxDepth, prune);

module.exports = {
  filters: {
    always: always,
    optionValue: optionValue,
    constructorName: constructorName,
    json: json,
    toStr: toStr,
    prune: prune,
    truncate: truncate,
    decorateArray: decorateArray,
    decorateObject: decorateObject
  },
  flow: {
    compose: compose,
    when: when,
    allowedKeys: allowedKeys,
    safeKeys: safeKeys,
    arrayIndicesToKeys: arrayIndicesToKeys,
    filter: filter,
    iterate: iterate,
    end: end
  },
  symbols: {
    END: END,
    ITERATE: ITERATE
  },
  always: (str) => compose(always(str), end()),
  json: () => compose(json(), end()),
  toStr: () => compose(toStr(), end()),
  prune: () => prune,
  number: () => {
    return compose(
      omitNaN,
      omitPositiveInfinity,
      omitNegativeInfinity,
      json(),
      end()
    );
  },
  newLike: () => {
    return compose(
      always('new '),
      constructorName(),
      always('('),
      json(),
      always(')'),
      end()
    );
  },
  array: (predicate) => {
    return compose(
      omitCircular,
      omitMaxDepth,
      decorateArray(),
      arrayIndicesToKeys(),
      filter(predicate),
      iterate()
    );
  },
  object: (predicate, orderedWhiteList) => {
    return compose(
      omitCircular,
      omitMaxDepth,
      constructorName(),
      decorateObject(),
      allowedKeys(orderedWhiteList),
      safeKeys(),
      filter(predicate),
      iterate()
    );
  }
};
