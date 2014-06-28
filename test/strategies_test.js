var stringifier = require('..'),
    stringify = stringifier.stringify,
    s = stringifier.strategies,
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
            'Student': s.object(function (kvp) {
                return ['name', 'age'].indexOf(kvp.key) !== -1;
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom",age:10}');
    });

    it('blacklist by property name', function () {
        var handlers = {
            'Student': s.object(function (kvp) {
                return ['age', 'gender'].indexOf(kvp.key) === -1;
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom"}');
    });

    it('whitelist by property value', function () {
        var handlers = {
            'Student': s.object(function (kvp) {
                return typeName(kvp.value) === 'string';
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom",gender:"M"}');
    });

    it('blacklist by property value', function () {
        var handlers = {
            'Student': s.object(function (kvp) {
                return kvp.value !== 'M';
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom",age:10}');
    });

    it('array filtering by value', function () {
        var handlers = {
            'Array': s.array(function (kvp) {
                return /^b.*$/.test(kvp.value);
            })
        };
        assert.equal(stringify(['foo', 'bar', 'baz'], null, handlers), '["bar","baz"]');
    });

    it('array filtering by index', function () {
        var handlers = {
            'Array': s.array(function (kvp) {
                return typeName(kvp.key) === 'number' && kvp.key % 2 === 0;
            })
        };
        assert.equal(stringify(['foo', 'bar', 'baz'], null, handlers), '["foo","baz"]');
    });

    it('per-property strategy customization', function () {
        var handlers = {
            'Student': s.object(function (kvp) {
                if (kvp.key === 'age') {
                    return s.fixed('*secret*');
                }
                return true;
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"tom",age:*secret*,gender:"M"}');
    });

    it('property whitelist and reordering', function () {
        var handlers = {
            'Student': s.object(null, ['gender', 'age'])
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{gender:"M",age:10}');
    });

    it('per-property truncate', function () {
        var handlers = {
            'Student': s.object(function (kvp) {
                if (kvp.key === 'name') {
                    return s.filters.truncate(3)(s.json());
                }
                return true;
            })
        };
        assert.equal(stringify(this.student, null, handlers), 'Student{name:"to..(snip),age:10,gender:"M"}');
    });
});
