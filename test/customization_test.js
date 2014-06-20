var stringify = require('..'),
    strategies = require('../strategies'),
    assert = require('assert');

describe('strategies', function () {
    function Student (name, age, gender) {
        this.name = name;
        this.age = age;
        this.gender = gender;
    }

    beforeEach(function () {
        this.input = new Student('tom', 10, 'M');
    });

    it('default', function () {
        assert.equal(stringify(this.input), 'Student{name:"tom",age:10,gender:"M"}');
    });

    it('json', function () {
        var handlers = {
                'Student': strategies.json(null, '  ')
            },
            expected = [
                '{',
                '  "name": "tom",',
                '  "age": 10,',
                '  "gender": "M"',
                '}'
            ].join('\n');
        assert.equal(stringify(this.input, null, handlers), expected);
    });

    it('fixed', function () {
        var handlers = {
                'Student': strategies.fixed('BOOM')
            };
        assert.equal(stringify(this.input, null, handlers), 'BOOM');
    });
});
