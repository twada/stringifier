var stringify = require('..'),
    strategies = require('../lib/strategies'),
    assert = require('assert');

describe('customization', function () {
    function Student (name, age, gender) {
        this.name = name;
        this.age = age;
        this.gender = gender;
    }

    it('default', function () {
        var input = new Student('tom', 10, 'M');
        assert.equal(stringify(input), 'Student{name:"tom",age:10,gender:"M"}');
    });

    it('custom handler', function () {
        var input = new Student('tom', 10, 'M'),
            handlers = {
                'Student': strategies.stringifyByJSON
            };
        assert.equal(stringify(input, null, handlers), '{"name":"tom","age":10,"gender":"M"}');
    });
});
