delete require.cache[require.resolve('..')];
const stringifier = require('..');
const assert = require('assert');
const typeName = require('type-name');
const stringify = stringifier.stringify;
const s = stringifier.strategies;

describe('strategies', () => {
    function Student (name, age, gender) {
        this.name = name;
        this.age = age;
        this.gender = gender;
    }

    var AnonStudent = function(name, age, gender) {
        this.name = name;
        this.age = age;
        this.gender = gender;
    };
    var anonymous = new AnonStudent('mary', 9, 'F');

    let student, longNameStudent;
    beforeEach(() => {
        student = new Student('tom', 10, 'M');
        longNameStudent = new Student('the_long_name_man', 18, 'M');
    });

    it('always', () => {
        var options = {
            handlers: {
                'Student': s.always('BOOM')
            }
        };
        assert.strictEqual(stringify(student, options), 'BOOM');
    });

    it('prune', () => {
        var options = {
            handlers: {
                'Student': s.prune()
            }
        };
        assert.strictEqual(stringify(student, options), '#Student#');
    });

    it('json', () => {
        var options = {
            handlers: {
                'Student': s.json()
            }
        };
        assert.strictEqual(stringify(student, options), '{"name":"tom","age":10,"gender":"M"}');
    });

    it('toStr', () => {
        var options = {
            handlers: {
                'Student': s.toStr()
            }
        };
        assert.strictEqual(stringify(student, options), '[object Object]');
    });

    it('newLike', () => {
        var options = {
            handlers: {
                'Student': s.newLike()
            }
        };
        assert.strictEqual(stringify(student, options), 'new Student({"name":"tom","age":10,"gender":"M"})');
    });

    it('object', () => {
        var options = {
            handlers: {
                'Student': s.object()
            }
        };
        assert.strictEqual(stringify(student, options), 'Student{name:"tom",age:10,gender:"M"}');
    });

    it('number and array', () => {
        var options = {
            handlers: {
                'Array': s.array(),
                'number': s.number()
            }
        };
        assert.strictEqual(stringify([NaN, 0, Infinity, -0, -Infinity], options), '[NaN,0,Infinity,0,-Infinity]');
    });

    it('whitelist by property name', () => {
        var options = {
            handlers: {
                'Student': s.object((kvp) => {
                    return ['name', 'age'].indexOf(kvp.key) !== -1;
                })
            }
        };
        assert.strictEqual(stringify(student, options), 'Student{name:"tom",age:10}');
    });

    it('blacklist by property name', () => {
        var options = {
            handlers: {
                'Student': s.object((kvp) => {
                    return ['age', 'gender'].indexOf(kvp.key) === -1;
                })
            }
        };
        assert.strictEqual(stringify(student, options), 'Student{name:"tom"}');
    });

    it('whitelist by property value', () => {
        var options = {
            handlers: {
                'Student': s.object((kvp) => {
                    return typeName(kvp.value) === 'string';
                })
            }
        };
        assert.strictEqual(stringify(student, options), 'Student{name:"tom",gender:"M"}');
    });

    it('blacklist by property value', () => {
        var options = {
            handlers: {
                'Student': s.object((kvp) => {
                    return kvp.value !== 'M';
                })
            }
        };
        assert.strictEqual(stringify(student, options), 'Student{name:"tom",age:10}');
    });

    it('array filtering by value', () => {
        var options = {
            handlers: {
                'Array': s.array((kvp) => {
                    return /^b.*$/.test(kvp.value);
                })
            }
        };
        assert.strictEqual(stringify(['foo', 'bar', 'baz'], options), '["bar","baz"]');
    });

    it('array filtering by index', () => {
        var options = {
            handlers: {
                'Array': s.array((kvp) => {
                    return typeName(kvp.key) === 'number' && kvp.key % 2 === 0;
                })
            }
        };
        assert.strictEqual(stringify(['foo', 'bar', 'baz'], options), '["foo","baz"]');
    });

    it('per-property strategy customization', () => {
        var options = {
            handlers: {
                'Student': s.object((kvp) => {
                    if (kvp.key === 'age') {
                        return s.always('*secret*');
                    }
                    return true;
                })
            }
        };
        assert.strictEqual(stringify(student, options), 'Student{name:"tom",age:*secret*,gender:"M"}');
    });

    it('property whitelist and reordering', () => {
        var options = {
            handlers: {
                'Student': s.object(null, ['gender', 'age'])
            }
        };
        assert.strictEqual(stringify(student, options), 'Student{gender:"M",age:10}');
    });

    it('per-property truncate simply', () => {
        var options = {
            handlers: {
                'Student': s.object((kvp) => {
                    if (kvp.key === 'name') {
                        return 3;
                    }
                    return true;
                })
            }
        };
        assert.strictEqual(stringify(longNameStudent, options), 'Student{name:"th..(snip),age:18,gender:"M"}');
    });

    it('do not truncate if string length is short enough', () => {
        var options = {
            handlers: {
                'Student': s.object((kvp) => {
                    if (kvp.key === 'name') {
                        return 3;
                    }
                    return true;
                })
            }
        };
        assert.strictEqual(stringify(student, options), 'Student{name:"tom",age:10,gender:"M"}');
    });

    it('per-property truncate bare handler', () => {
        var options = {
            handlers: {
                'Student': s.object((kvp) => {
                    if (kvp.key === 'name') {
                        return s.flow.compose(s.filters.truncate(3), s.json());
                    }
                    return true;
                })
            }
        };
        assert.strictEqual(stringify(longNameStudent, options), 'Student{name:"th..(snip),age:18,gender:"M"}');
    });

    if (typeName(anonymous) !== 'AnonStudent') {
        it('anonymous constructor object', () => {
            var options = {
                handlers: {
                    'Student': s.object(),
                    '': s.object()
                }
            };
            assert.strictEqual(stringify(anonymous, options), '@Anonymous{name:"mary",age:9,gender:"F"}');
        });
        it('anonymous constructor alternate name', () => {
            var options = {
                anonymous: 'Anon',
                handlers: {
                    'Student': s.object(),
                    '': s.object()
                }
            };
            assert.strictEqual(stringify(anonymous, options), 'Anon{name:"mary",age:9,gender:"F"}');
        });
        it('type detection override', () => {
            var options = {
                typeFun: function (val) {
                    if (typeName(val) === '' &&
                        typeName(val.name) === 'string' &&
                        typeName(val.age) === 'number' &&
                        typeName(val.gender) === 'string'
                       ) {
                           return 'Student';
                       } else {
                           return typeName(val);
                       }
                },
                handlers: {
                    'Student': s.object()
                }
            };
            assert.strictEqual(stringify(anonymous, options), 'Student{name:"mary",age:9,gender:"F"}');
        });
    }

});
