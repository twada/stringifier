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
            //assert.equal(stringify(input), '[4,[5,[6,7,8],9],10]');
            assert.equal(stringify(input), '[4,#Array#,10]');
        });
    });
});
