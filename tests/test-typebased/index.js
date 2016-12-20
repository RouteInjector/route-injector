var request = require('supertest');

describe('test-typebased', function () {
    var injector;
    var userId, userId2, vehicleId;

    before(function (done) {
        require('./bin/test')(function (i) {
            injector = i;
            done();
        });
    });

    after(function () {
        injector.mongoose.connection.db.dropDatabase();
    });

    describe('POST /user', function () {
        it('Add a new user to the system, and store its _id', function (done) {
            request(injector.app)
                .post('/user')
                .send({
                    niceName: "Johan",
                    password: "Johanpass"
                })
                .expect(201)
                .end(function (err, res) {
                    if (err) throw err;
                    userId = res.body._id;
                    done();
                });
        });
    });

    describe('POST /vehicle', function () {
        it("Add a new vehicle to the system, and store it's _id", function (done) {
            request(injector.app)
                .post('/vehicle')
                .send({
                    niceName: "Herby",
                    color: "Green",
                    brand: "Volkswagen"
                })
                .expect(201)
                .end(function (err, res) {
                    if (err) throw err;
                    vehicleId = res.body._id;
                    done();
                });
        });
    });

    describe('PUT /user/:id', function () {
        it("Update a user by adding a reference to a vehicle", function (done) {
            request(injector.app)
                .put('/user/' + userId)
                .send({
                    vehicle: vehicleId
                })
                .expect(200, {
                    _id: userId
                }, done);
        });
    });

    describe('GET /user/:id', function () {
        it("Get a user by its ObjectId that has been updated", function (done) {
            request(injector.app)
                .get('/user/' + userId)
                .set('Accept', 'application/json')
                .expect(200, {
                    _id: userId,
                    niceName: "Johan",
                    password: "Johanpass",
                    vehicle: vehicleId
                }, done);
        });
    });

    describe('GET /user/:id/vehicle', function () {
        it("Get a vehicle jumping from the User reference", function (done) {
            request(injector.app)
                .get('/user/' + userId + '/vehicle')
                .set('Accept', 'application/json')
                .expect(200, {
                    _id: vehicleId,
                    niceName: "Herby",
                    color: "Green",
                    brand: "Volkswagen"
                }, done)
        });
    });

    // describe('GET /vehicle/:id/vehicle/users', function () {
    //     it("Get a vehicle jumping from the User reference", function (done) {
    //         request(injector.app)
    //             .get('/vehicle/' + vehicleId + '/vehicle/users')
    //             .set('Accept', 'application/json')
    //             .expect(200, [{
    //                 _id: userId,
    //                 niceName: "Johan",
    //                 password: "Johanpass",
    //                 vehicle: vehicleId
    //             }], done);
    //     });
    // });

    // describe('POST /user', function () {
    //     it('Add a new user to the system, and store its _id', function (done) {
    //         request(injector.app)
    //             .post('/user')
    //             .send({
    //                 niceName: "Maite",
    //                 password: "Maitepass",
    //                 vehicle: vehicleId
    //             })
    //             .expect(201)
    //             .end(function (err, res) {
    //                 if (err) throw err;
    //                 userId2 = res.body._id;
    //                 done();
    //             });
    //     });
    // });

    // describe('GET /vehicle/:id/vehicle/users', function () {
    //     it("Get a vehicle jumping from the User reference", function (done) {
    //         request(injector.app)
    //             .get('/vehicle/' + vehicleId + '/vehicle/users')
    //             .set('Accept', 'application/json')
    //             .expect(200, [{
    //                 _id: userId,
    //                 niceName: "Johan",
    //                 password: "Johanpass",
    //                 vehicle: vehicleId
    //             }, {
    //                 _id: userId2,
    //                 niceName: "Maite",
    //                 password: "Maitepass",
    //                 vehicle: vehicleId
    //             }], done);
    //     });
    // });
});
