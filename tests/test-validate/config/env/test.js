module.exports = {
    database: {
        endpoint: "localhost:27017",
        name: "routeinjector-test",
        debug: false
    },
    bind: {
        port: 40001
    },
    images: {
        path: __dirname + "/../../image",
        cache: __dirname + "/../../image/.cache",
        galleryFolder: __dirname + "/../../images"
    },
    swagger: true
};
