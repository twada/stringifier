var stringify = require('..'),
    filters = stringify.filters,
    assert = require('assert');

describe('filters', function () {
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
            'Student': filters.fixed('BOOM')
        };
        assert.equal(stringify(this.student, null, handlers), 'BOOM');
    });

    it('prune', function () {
        var handlers = {
            'Student': filters.prune()
        };
        assert.equal(stringify(this.student, null, handlers), '#Student#');
    });

    it('json', function () {
        var handlers = {
            'Student': filters.json()
        };
        assert.equal(stringify(this.student, null, handlers), '{"name":"tom","age":10,"gender":"M"}');
    });

    it('toStr', function () {
        var handlers = {
            'Student': filters.toStr()
        };
        assert.equal(stringify(this.student, null, handlers), '[object Object]');
    });
    
    it('newLike', function () {
        var handlers = {
            'Student': filters.newLike()
        };
        assert.equal(stringify(this.student, null, handlers), 'new Student({"name":"tom","age":10,"gender":"M"})');
    });

    it('composite newLike strategy', function () {
        var handlers = {
            'Student': filters.newLike(filters.fixed('WOA'))
        };
        assert.equal(stringify(this.student, null, handlers), 'new Student(WOA)');
    });
    
    it('number', function () {
        assert.equal(stringify([NaN, 0, Infinity, -0, -Infinity]), '[NaN,0,Infinity,0,-Infinity]');
    });

    it('composite number strategy', function () {
        var handlers = {
            'number': filters.number(filters.fixed('BOO'))
        };
        assert.equal(stringify([NaN, 0, Infinity, -0, -Infinity], null, handlers), '[NaN,BOO,Infinity,BOO,-Infinity]');
    });
});
