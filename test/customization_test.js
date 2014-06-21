var stringify = require('..'),
    filters = stringify.filters,
    f = stringify.filters.f,
    s = stringify.filters.s,
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

    it('number', function () {
        var handlers = {
            'number': s.number()
        };
        assert.equal(stringify([NaN, 0, Infinity, -0, -Infinity], null, handlers), '[NaN,0,Infinity,0,-Infinity]');
    });
});


describe('composable filters', function () {
    function Student (name, age, gender) {
        this.name = name;
        this.age = age;
        this.gender = gender;
    }

    beforeEach(function () {
        this.student = new Student('tom', 10, 'M');
    });

    it('str', function () {
        var handlers = {
            'Student': f.compose(f.str('BOOM'), f.skip)
        };
        assert.equal(stringify(this.student, null, handlers), 'BOOM');
    });

    it('tname', function () {
        var handlers = {
            'Student': f.compose(f.typeNameOr('@Anonymous'), f.skip)
        };
        assert.equal(stringify(this.student, null, handlers), 'Student');
    });

    it('newLike', function () {
        var handlers = {
            'Student': f.compose(f.str('new '), f.typeNameOr('@Anonymous'), f.str('('), f.str(')'), f.skip)
        };
        assert.equal(stringify(this.student, null, handlers), 'new Student()');
    });
});
