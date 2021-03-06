delete require.cache[require.resolve('..')];
const stringifier = require('..');
const assert = require('assert');
const stringify = stringifier.stringify;

describe('traverse', () => {
  describe('Array', () => {
    it('flat', () => {
      const input = [4, 5, 6];
      assert.strictEqual(stringify(input), '[4,5,6]');
    });
    it('nested', () => {
      const input = [4, [5, [6, 7, 8], 9], 10];
      assert.strictEqual(stringify(input), '[4,[5,[6,7,8],9],10]');
    });
    describe('sparse arrays', () => {
      it('empty', () => {
        const input = Array(3);
        assert.strictEqual(stringify(input), '[,,]');
      });
      it('values', () => {
        const input = [];
        input[2] = 'foo';
        input[5] = 'bar';
        assert.strictEqual(stringify(input), '[,,"foo",,,"bar"]');
      });
      it('nested', () => {
        const input = [];
        input[1] = 'foo';
        input[3] = Array(4);
        input[5] = 'bar';
        assert.strictEqual(stringify(input), '[,"foo",,[,,,],,"bar"]');
      });
    });
  });

  describe('Array indentation', () => {
    it('empty array', () => {
      const input = [];
      assert.strictEqual(stringify(input, { indent: '  ' }), '[]');
    });
    it('3 items array', () => {
      const input = [3, 5, 8];

      const expected = [
        '[',
        '  3,',
        '  5,',
        '  8',
        ']'
      ].join('\n');
      assert.strictEqual(stringify(input, { indent: '  ' }), expected);
    });
    it('nested array', () => {
      const input = [4, [5, [6, 7, 8], 9], 10];

      const expected = [
        '[',
        '  4,',
        '  [',
        '    5,',
        '    [',
        '      6,',
        '      7,',
        '      8',
        '    ],',
        '    9',
        '  ],',
        '  10',
        ']'
      ].join('\n');
      assert.strictEqual(stringify(input, { indent: '  ' }), expected);
    });
    it('nested empty array', () => {
      const input = [3, [], 8];

      const expected = [
        '[',
        '  3,',
        '  [],',
        '  8',
        ']'
      ].join('\n');
      assert.strictEqual(stringify(input, { indent: '  ' }), expected);
    });
    it('nested array with maxDepth option', () => {
      const input = [3, [4, 5], 8];

      const expected = [
        '[',
        '  3,',
        '  #Array#,',
        '  8',
        ']'
      ].join('\n');
      assert.strictEqual(stringify(input, { indent: '  ', maxDepth: 1 }), expected);
    });
  });

  describe('Object indentation', () => {
    it('empty object', () => {
      const input = {};
      assert.strictEqual(stringify(input, { indent: '  ' }), 'Object{}');
    });
    it('two props object', () => {
      const input = { name: 'bob', age: 3 };

      const expected = [
        'Object{',
        '  name: "bob",',
        '  age: 3',
        '}'
      ].join('\n');
      assert.strictEqual(stringify(input, { indent: '  ' }), expected);
    });
    it('nested object', () => {
      const input = { a: 'A', b: { ba: 'BA', bb: 'BB' }, c: 4 };

      const expected = [
        'Object{',
        '  a: "A",',
        '  b: Object{',
        '    ba: "BA",',
        '    bb: "BB"',
        '  },',
        '  c: 4',
        '}'
      ].join('\n');
      assert.strictEqual(stringify(input, { indent: '  ' }), expected);
    });
    it('nested empty object', () => {
      const input = { a: 'A', b: {}, c: 4 };

      const expected = [
        'Object{',
        '  a: "A",',
        '  b: Object{},',
        '  c: 4',
        '}'
      ].join('\n');
      assert.strictEqual(stringify(input, { indent: '  ' }), expected);
    });
    it('nested object with maxDepth option', () => {
      const input = { a: 'A', b: { ba: 'BA', bb: 'BB' }, c: 4 };

      const expected = [
        'Object{',
        '  a: "A",',
        '  b: #Object#,',
        '  c: 4',
        '}'
      ].join('\n');
      assert.strictEqual(stringify(input, { indent: '  ', maxDepth: 1 }), expected);
    });
  });

  describe('circular references', () => {
    it('circular object', () => {
      const circularObj = {};
      circularObj.circularRef = circularObj;
      circularObj.list = [ circularObj, circularObj ];
      const expected = [
        'Object{',
        '  circularRef: #@Circular#,',
        '  list: [',
        '    #@Circular#,',
        '    #@Circular#',
        '  ]',
        '}'
      ].join('\n');
      assert.strictEqual(stringify(circularObj, { indent: '  ' }), expected);
    });
    it('circular array', () => {
      const circularArray = [3, 5];
      circularArray.push(circularArray);
      const expected = [
        '[',
        '  3,',
        '  5,',
        '  #@Circular#',
        ']'
      ].join('\n');
      assert.strictEqual(stringify(circularArray, { indent: '  ' }), expected);
    });
  });
});
