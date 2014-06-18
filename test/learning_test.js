var stringify = require('..'),
    assert = require('assert');

describe('traverse', function () {
    describe('Array', function () {
        it('flat', function () {
            var input = [4, 5, 6];
            assert.equal(stringify(input), '[4,5,6]');
        });
        it('nested', function () {
            var input = [4, [5, [6, 7, 8], 9], 10];
            assert.equal(stringify(input), '[4,[5,[6,7,8],9],10]');
        });
    });


    describe('Array indentation', function () {
        it('empty array', function () {
            var input = [];
            assert.equal(stringify(input, {indent: '  '}), '[]');
        });
        it('3 items array', function () {
            var input = [3, 5, 8],
                expected = [
                    '[',
                    '  3,',
                    '  5,',
                    '  8',
                    ']'
                ].join('\n');
            assert.equal(stringify(input, {indent: '  '}), expected);
        });
        it('nested array', function () {
            var input = [4, [5, [6, 7, 8], 9], 10],
                expected = [
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
            assert.equal(stringify(input, {indent: '  '}), expected);
        });
        it('nested empty array', function () {
            var input = [3, [], 8],
                expected = [
                    '[',
                    '  3,',
                    '  [],',
                    '  8',
                    ']'
                ].join('\n');
            assert.equal(stringify(input, {indent: '  '}), expected);
        });
        it('nested array with maxDepth option', function () {
            var input = [3, [4, 5], 8],
                expected = [
                    '[',
                    '  3,',
                    '  #Array#,',
                    '  8',
                    ']'
                ].join('\n');
            assert.equal(stringify(input, {indent: '  ', maxDepth: 1}), expected);
        });
    });


    describe('Object indentation', function () {
        it('empty object', function () {
            var input = {};
            assert.equal(stringify(input, {indent: '  '}), 'Object{}');
        });
        it('two props object', function () {
            var input = {name: 'bob', age: 3},
                expected = [
                    'Object{',
                    '  name: "bob",',
                    '  age: 3',
                    '}'
                ].join('\n');
            assert.equal(stringify(input, {indent: '  '}), expected);
        });
    });

});
