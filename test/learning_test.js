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

    describe('indent', function () {
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
    });

});
