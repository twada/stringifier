delete require.cache[require.resolve('..')];
const stringifier = require('..');
const stringify = stringifier.stringify;
const assert = require('assert');

const FOO = Symbol("FOO");

describe('ES6 features', () => {
    it('Symbol', () => {
        assert.strictEqual(stringify(FOO), 'Symbol(FOO)');
    });
});
