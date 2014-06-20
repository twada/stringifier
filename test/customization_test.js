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
        this.student = new Student('tom', 10, 'M');
    });

    it('default', function () {
        assert.equal(stringify(this.student), 'Student{name:"tom",age:10,gender:"M"}');
    });

    it('fixed', function () {
        var handlers = {
            'Student': strategies.fixed('BOOM')
        };
        assert.equal(stringify(this.student, null, handlers), 'BOOM');
    });

    it('prune', function () {
        var handlers = {
            'Student': strategies.prune()
        };
        assert.equal(stringify(this.student, null, handlers), '#Student#');
    });

    it('json', function () {
        var handlers = {
            'Student': strategies.json()
        };
        assert.equal(stringify(this.student, null, handlers), '{"name":"tom","age":10,"gender":"M"}');
    });

    it('toStr', function () {
        var handlers = {
            'Student': strategies.toStr()
        };
        assert.equal(stringify(this.student, null, handlers), '[object Object]');
    });
    
    it('newLike', function () {
        var handlers = {
            'Student': strategies.newLike()
        };
        assert.equal(stringify(this.student, null, handlers), 'new Student({"name":"tom","age":10,"gender":"M"})');
    });

    it('composite newLike', function () {
        var handlers = {
            'Student': strategies.newLike(strategies.fixed('WOA'))
        };
        assert.equal(stringify(this.student, null, handlers), 'new Student(WOA)');
    });
});
