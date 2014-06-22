var stringify = require('..'),
    s = stringify.strategies,
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

    it('fixed', function () {
        var handlers = {
            'Student': s.fixed('BOOM')
        };
        assert.equal(stringify(this.student, null, handlers), 'BOOM');
    });

    it('prune', function () {
        var handlers = {
            'Student': s.prune()
        };
        assert.equal(stringify(this.student, null, handlers), '#Student#');
    });

    it('json', function () {
        var handlers = {
            'Student': s.json()
        };
        assert.equal(stringify(this.student, null, handlers), '{"name":"tom","age":10,"gender":"M"}');
    });

    it('toStr', function () {
        var handlers = {
            'Student': s.toStr()
        };
        assert.equal(stringify(this.student, null, handlers), '[object Object]');
    });

    it('newLike', function () {
        var handlers = {
            'Student': s.newLike()
        };
        assert.equal(stringify(this.student, null, handlers), 'new Student({"name":"tom","age":10,"gender":"M"})');
    });

    it('object', function () {
        var handlers = {
            'Student': s.object()
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom",age:10,gender:"M"}');
    });

    it('number and array', function () {
        var handlers = {
            'Array': s.array(),
            'number': s.number()
        };
        assert.equal(stringify([NaN, 0, Infinity, -0, -Infinity], null, handlers), '[NaN,0,Infinity,0,-Infinity]');
    });

    it('property name whitelist', function () {
        var handlers = {
            'Student': s.object(function (key, val) {
                return ['name', 'age'].indexOf(key) !== -1;
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom",age:10}');
    });

    it('property name blacklist', function () {
        var handlers = {
            'Student': s.object(function (key, val) {
                return ['age', 'gender'].indexOf(key) === -1;
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom"}');
    });
});
