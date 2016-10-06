var request = require('supertest');

describe('user', function () {
    var injector;
    var userId;

    before(function (done) {
        require('./bin/test')(function (i) {
            injector = i;
            done();
        });
    });

    after(function () {
        injector.mongoose.connection.db.dropDatabase();
    });

    describe('GET /schemas', function () {
        it('Get schemas from system', function (done) {
            request(injector.app)
                .get('/schemas')
                .expect(200, ['User'], done)
        });
    });

    describe('GET /schema/:schema', function () {
        it('Get User schema', function (done) {
            request(injector.app)
                .get('/schema/User')
                .expect(200, {
                    niceName: {type: 'string', title: 'Nice Name'},
                    birth: {type: 'string', title: 'Birth', format: 'date'},
                    phones: {type: 'array', items: {type: 'string', format: 'mixed'}},
                    friend: {type: 'string', ref: 'User', title: 'Friend'}
                }, done)
        });
    });

    describe('GET /schema/:schema/formconfig', function () {
        it('Get User formconfig', function (done) {
            request(injector.app)
                .get('/schema/User/formconfig')
                .expect(200, {
                    id: '_id',
                    displayField: 'niceName',
                    path: 'user',
                    plural: 'users',
                    isSingle: false,
                    section: 'Models',
                    get: true,
                    post: true,
                    put: true,
                    delete: true,
                    search: true,
                    export: true,
                    import: true
                }, done)
        });
    });

    describe('POST /user', function () {
        it('respond with id', function (done) {
            request(injector.app)
                .post('/user')
                .send({
                    niceName: "Test",
                    birth: new Date("2015-11-17T16:12:55.433Z"),
                    phones: [123, 456, 789]
                })
                .expect(201)
                .end(function (err, res) {
                    if (err) throw err;
                    userId = res.body._id;
                    done();
                });
        });
    });

    describe('GET /user/:id', function () {
        it("Get user by its ObjectId", function (done) {
            request(injector.app)
                .get('/user/' + userId)
                .set('Accept', 'application/json')
                .expect(200, {
                    _id: userId,
                    niceName: "Test",
                    birth: "2015-11-17T16:12:55.433Z",
                    phones: [123, 456, 789]
                }, done)
        });
    });

    describe('PUT /user/:id', function () {
        it("Update a user by its ObjectId", function (done) {
            request(injector.app)
                .put('/user/' + userId)
                .send({
                    niceName: "Test Renamed",
                    phones: [123, 456, 789, 85]
                })
                .expect(200, {
                    _id: userId,
                }, done)
        });
    });

    describe('GET /user/:id', function () {
        it("Get a user by its ObjectId that has been updated", function (done) {
            request(injector.app)
                .get('/user/' + userId)
                .set('Accept', 'application/json')
                .expect(200, {
                    _id: userId,
                    niceName: "Test Renamed",
                    birth: "2015-11-17T16:12:55.433Z",
                    phones: [123, 456, 789, 85]
                }, done)
        });
    });


    describe('PUT /user', function () {
        it("Update a user with a reference of another user", function (done) {
            request(injector.app)
                .put('/user/' + userId)
                .send({
                    friend: userId
                })
                .expect(200, {
                    _id: userId,
                }, done)
        });
    });

    describe('GET /user/:id', function () {
        it("Get a user by its ObjectId that has been updated", function (done) {
            request(injector.app)
                .get('/user/' + userId)
                .set('Accept', 'application/json')
                .expect(200, {
                    _id: userId,
                    niceName: "Test Renamed",
                    birth: "2015-11-17T16:12:55.433Z",
                    phones: [123, 456, 789, 85],
                    friend: userId
                }, done)
        });
    });

    describe('DELETE /user/:id', function () {
        it("Delete a user by its ObjectId", function (done) {
            request(injector.app)
                .delete('/user/' + userId)
                .expect(204, done)
        });
    });

    describe('GET /user/:id', function () {
        it("Get a user by its ObjectId that has been deleted. Expect 404", function (done) {
            request(injector.app)
                .get('/user/' + userId)
                .set('Accept', 'application/json')
                .expect(404, done)
        });
    });
});