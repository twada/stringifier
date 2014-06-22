var stringify = require('..'),
    s = stringify.strategies,
    typeName = require('type-name'),
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

    it('whitelist by property name', function () {
        var handlers = {
            'Student': s.object(function (val, key) {
                return ['name', 'age'].indexOf(key) !== -1;
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom",age:10}');
    });

    it('blacklist by property name', function () {
        var handlers = {
            'Student': s.object(function (val, key) {
                return ['age', 'gender'].indexOf(key) === -1;
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom"}');
    });

    it('whitelist by property value', function () {
        var handlers = {
            'Student': s.object(function (val, key) {
                return typeName(val) === 'string';
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom",gender:"M"}');
    });

    it('blacklist by property value', function () {
        var handlers = {
            'Student': s.object(function (val, key) {
                return val !== 'M';
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom",age:10}');
    });

    it('array filtering by value', function () {
        var handlers = {
            'Array': s.array(function (val, index) {
                return /^b.*$/.test(val);
            })
        };
        assert.equal(stringify(['foo', 'bar', 'baz'], null, handlers), '["bar","baz"]');
    });

    it('array filtering by index', function () {
        var handlers = {
            'Array': s.array(function (val, index) {
                return index % 2 === 0;
            })
        };
        assert.equal(stringify(['foo', 'bar', 'baz'], null, handlers), '["foo","baz"]');
    });
});
