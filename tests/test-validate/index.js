var request = require('supertest');

describe('user', function () {
    var injector;
    var userId;

    before(function (done) {
        require('./bin/test')(function (i) {
            injector = i;
            var User = injector.models['User'];
            var u = {a: 1, b: 2};
            User.collection.insert(u, function () {
                userId = u._id.toString();
                done();
            });
        });
    });

    after(function () {
        injector.mongoose.connection.db.dropDatabase();
    });

    describe('GET /users/validate', function () {
        it('Get schemas from system', function (done) {
            request(injector.app)
                .get('/users/validate')
                .expect(200, {
                    count: 1,
                    data: [
                        {
                            id: userId,
                            error: {
                                message: "User validation failed",
                                name: "ValidationError",
                                errors: {
                                    niceName: {
                                        message: "Path `niceName` is required.",
                                        name: "ValidatorError",
                                        kind: "required",
                                        path: "niceName"
                                    }
                                }
                            }
                        }
                    ]
                }, done)
        });
    });
});