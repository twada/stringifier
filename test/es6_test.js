delete require.cache[require.resolve('..')];
const stringifier = require('..');
const stringify = stringifier.stringify;
const assert = require('assert');

const FOO = Symbol('FOO');

describe('ES6 features', () => {
  it('Symbol', () => {
    assert.strictEqual(stringify(FOO), 'Symbol(FOO)');
  });
  it('Symbol as Object key', () => {
    const id = Symbol("id");
    const user = {
      name: "John",
      [id]: 123
    };
    assert.strictEqual(stringify(user), 'Object{name:"John",Symbol(id):123}');
  });
});
