// mongoose-Image

module.exports = exports = function (mongoose) {
    var Schema = mongoose.Schema
        , SchemaType = mongoose.SchemaType
        , Types = mongoose.Types
        , mongo = mongoose.mongo;

    /**
     * Image constructor
     *
     * @inherits SchemaType
     * @param {String} key
     * @param {Object} [options]
     */

    function Image(path, options) {
        SchemaType.call(this, path, options, 'Image');
    }

    /**
     * This schema type's name, to defend against minifiers that mangle
     * function names.
     *
     * @api private
     */
    Image.schemaName = 'Image';

    /*!
     * Inherits from SchemaType.
     */
    Image.prototype = Object.create(SchemaType.prototype);
    Image.prototype.constructor = Image;

    /**
     * Implement checkRequired method.
     *
     * @param {any} val
     * @return {Boolean}
     */

    Image.prototype.checkRequired = function (val) {
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

    Image.prototype.cast = function (val) {
        return val;
    }

    /**
     * Implement query casting, for mongoose 3.0
     *
     * @param {String} $conditional
     * @param {*} [value]
     */

    Image.prototype.castForQuery = function ($cond, val) {
        if (arguments.length === 2) return val;
        return $cond;
    };
    /**
     * Expose
     */

    Schema.Types.Image = Image;
    Types.Image = Image;
    return Image;
}
