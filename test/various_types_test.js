delete require.cache[require.resolve('..')];
const stringifier = require('..');
const assert = require('assert');
const typeName = require('type-name');
const stringify = stringifier.stringify;

function Person (name, age) {
  this.name = name;
  this.age = age;
}

const AnonPerson = function (name, age) {
  this.name = name;
  this.age = age;
};

const fixtures = {
  'string literal': {
    input: 'foo',
    expected: '"foo"',
    pruned: '"foo"'
  },
  'number literal': {
    input: 5,
    expected: '5',
    pruned: '5'
  },
  'boolean literal': {
    input: false,
    expected: 'false',
    pruned: 'false'
  },
  'regexp literal': {
    input: /^not/,
    expected: '/^not/',
    pruned: '/^not/'
  },
  'array literal': {
    input: ['foo', 4],
    expected: '["foo",4]',
    pruned: '#Array#'
  },
  'object literal': {
    input: { name: 'bar' },
    expected: 'Object{name:"bar"}',
    pruned: '#Object#'
  },
  'function expression': {
    input: function () {},
    expected: '#function#',
    pruned: '#function#'
  },
  'String object': {
    input: new String('bar'), // eslint-disable-line no-new-wrappers
    expected: 'new String("bar")',
    pruned: 'new String("bar")'
  },
  'Number object': {
    input: new Number('3'), // eslint-disable-line no-new-wrappers
    expected: 'new Number(3)',
    pruned: 'new Number(3)'
  },
  'Boolean object': {
    input: new Boolean('1'), // eslint-disable-line no-new-wrappers
    expected: 'new Boolean(true)',
    pruned: 'new Boolean(true)'
  },
  'Date object': {
    input: new Date('1970-01-01'),
    expected: 'new Date("1970-01-01T00:00:00.000Z")',
    pruned: 'new Date("1970-01-01T00:00:00.000Z")'
  },
  'RegExp object': {
    input: new RegExp('^not', 'g'),
    expected: '/^not/g',
    pruned: '/^not/g'
  },
  'Array object': {
    input: new Array(), // eslint-disable-line no-array-constructor
    expected: '[]',
    pruned: '#Array#'
  },
  'Object object': {
    input: new Object(), // eslint-disable-line no-new-object
    expected: 'Object{}',
    pruned: '#Object#'
  },
  'Function object': {
    input: new Function('x', 'y', 'return x + y'), // eslint-disable-line no-new-func
    expected: '#function#',
    pruned: '#function#'
  },
  'Error object': {
    input: new Error('error!'),
    expected: 'Error{message:"error!"}',
    pruned: '#Error#'
  },
  'TypeError object': {
    input: new TypeError('type error!'),
    expected: 'TypeError{message:"type error!"}',
    pruned: '#TypeError#'
  },
  'RangeError object': {
    input: new RangeError('range error!'),
    expected: 'RangeError{message:"range error!"}',
    pruned: '#RangeError#'
  },
  'user-defined constructor': {
    input: new Person('alice', 5),
    expected: 'Person{name:"alice",age:5}',
    pruned: '#Person#'
  },
  'NaN': {
    input: NaN,
    expected: 'NaN',
    pruned: 'NaN'
  },
  'Infinity': {
    input: Infinity,
    expected: 'Infinity',
    pruned: 'Infinity'
  },
  '-Infinity': {
    input: -Infinity,
    expected: '-Infinity',
    pruned: '-Infinity'
  },
  'Math': {
    input: Math,
    expected: 'Math{}',
    pruned: '#Math#'
  },
  'arguments object': {
    input: (function () { return arguments; })(),
    expected: 'Arguments{}',
    pruned: '#Arguments#'
  },
  'null literal': {
    input: null,
    expected: 'null',
    pruned: 'null'
  },
  'undefined value': {
    input: undefined,
    expected: 'undefined',
    pruned: 'undefined'
  }
};
if (typeof BigInt !== 'undefined') {
  fixtures['bigint literal'] = {
    input: BigInt('-100000000000000005'),
    expected: '-100000000000000005n',
    pruned: '-100000000000000005n'
  };
}
if (typeof JSON !== 'undefined') {
  fixtures['JSON'] = {
    input: JSON,
    expected: 'JSON{}',
    pruned: '#JSON#'
  };
}

const anonymous = new AnonPerson('bob', 4);
if (typeName(anonymous) === 'AnonPerson') {
  fixtures['anonymous constructor'] = {
    input: anonymous,
    expected: 'AnonPerson{name:"bob",age:4}',
    pruned: '#AnonPerson#'
  };
} else {
  fixtures['anonymous constructor'] = {
    input: anonymous,
    expected: '@Anonymous{name:"bob",age:4}',
    pruned: '#@Anonymous#'
  };
}

describe('stringify', () => {
  Object.keys(fixtures).forEach((testTarget) => {
    const sut = fixtures[testTarget];
    const input = sut.input;

    describe('without maxDepth option', () => {
      it('single ' + testTarget, () => {
        assert.strictEqual(stringify(input), sut.expected);
      });
      it('Array containing ' + testTarget, () => {
        const ary = [];
        ary.push(input);
        assert.strictEqual(stringify(ary), '[' + sut.expected + ']');
      });
      it('Object containing ' + testTarget, () => {
        const obj = {};
        obj.val = input;
        assert.strictEqual(stringify(obj), 'Object{val:' + sut.expected + '}');
      });
    });

    describe('with maxDepth = 1', () => {
      it('single ' + testTarget, () => {
        assert.strictEqual(stringify(input, { maxDepth: 1 }), sut.expected);
      });
      it('Array containing ' + testTarget, () => {
        const ary = [];
        ary.push(input);
        assert.strictEqual(stringify(ary, { maxDepth: 1 }), '[' + sut.pruned + ']');
      });
      it('Object containing ' + testTarget, () => {
        const obj = {};
        obj.val = input;
        assert.strictEqual(stringify(obj, { maxDepth: 1 }), 'Object{val:' + sut.pruned + '}');
      });
    });

    it('non-regular prop name' + testTarget, () => {
      const obj = {};
      obj['^pr"op-na:me'] = input;
      assert.strictEqual(stringify(obj, { maxDepth: 1 }), 'Object{"^pr\\"op-na:me":' + sut.pruned + '}');
    });
  });
});
