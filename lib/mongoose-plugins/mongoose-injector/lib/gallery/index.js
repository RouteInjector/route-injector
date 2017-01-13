// mongoose-Image

module.exports = exports = function (mongoose) {
    var Schema = mongoose.Schema
        , SchemaType = mongoose.SchemaType
        , Types = mongoose.Types
        , mongo = mongoose.mongo;

    /**
     * Gallery constructor
     *
     * @inherits SchemaType
     * @param {String} key
     * @param {Object} [options]
     */

    function Gallery(path, options) {
        SchemaType.call(this, path, options, 'Gallery');
    }

    /**
     * This schema type's name, to defend against minifiers that mangle
     * function names.
     *
     * @api private
     */
    Gallery.schemaName = 'Gallery';

    /*!
     * Inherits from SchemaType.
     */
    Gallery.prototype = Object.create(SchemaType.prototype);
    Gallery.prototype.constructor = Gallery;

    /**
     * Implement checkRequired method.
     *
     * @param {any} val
     * @return {Boolean}
     */

    Gallery.prototype.checkRequired = function (val) {
        return (val !== undefined) && (val !== null);
    };


    /**
     * Casts `val` for Mixed.
     *
     * _this is a no-op_
     *
     * @param {Object} value to cast
     * @api private
     */

    Gallery.prototype.cast = function (val) {
        return val;
    }

    /**
     * Implement query casting, for mongoose 3.0
     *
     * @param {String} $conditional
     * @param {*} [value]
     */

    Gallery.prototype.castForQuery = function ($cond, val) {
        if (arguments.length === 2) return val;
        return $cond;
    };

    Gallery.prototype.external = function (val) {
        if (val === true) {

        }
    }

    /**
     * Expose
     */

    Schema.Types.Gallery = Gallery;
    Types.Gallery = Gallery;
    return Gallery;
}
