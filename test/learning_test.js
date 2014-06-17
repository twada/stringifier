var traverse = require('traverse'),
    assert = require('assert'),
    dumper = require('../dump');

describe('traverse', function () {
    describe('Array', function () {
        it('flat', function () {
            var input = [4, 5, 6];
            var actual = traverse(input).reduce(dumper, []);
            assert.equal(actual.join(''), '[4,5,6]');
        });
        it('nested', function () {
            var input = [4, [5, [6, 7, 8], 9], 10];
            var actual = traverse(input).reduce(dumper, []);
            assert.equal(actual.join(''), '[4,[5,[6,7,8],9],10]');
        });
    });
});
