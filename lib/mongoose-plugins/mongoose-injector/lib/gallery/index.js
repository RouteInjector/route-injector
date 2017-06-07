// mongoose-Image

module.exports = exports = function (mongoose) {
    var Schema = mongoose.Schema
        , SchemaType = mongoose.SchemaType
        , Types = mongoose.Types
        , mongo = mongoose.mongo
	, CastError = mongoose.Error.CastError;

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
     * Check if the given value satisfies a required validator.
     *
     * @param {Any} value
     * @param {Document} doc
     * @return {Boolean}
     * @api public
     */

    Gallery.prototype.checkRequired = function checkRequired(value, doc) {
        if (SchemaType._isRef(this, value, doc, true)) {
            return !!value;
        }
        return (value instanceof String || typeof value === 'string') && value.length;
    };

    /**
     * Casts to String
     *
     * @api private
     */

    Gallery.prototype.cast = function (value, doc, init) {
        // if (SchemaType._isRef(this, value, doc, init)) {
        //     // wait! we may need to cast this to a document
        //
        //     if (value === null || value === undefined) {
        //         return value;
        //     }
        //
        //     // lazy load
        //     Document || (Document = require('./../document'));
        //
        //     if (value instanceof Document) {
        //         value.$__.wasPopulated = true;
        //         return value;
        //     }
        //
        //     // setting a populated path
        //     if (typeof value === 'string') {
        //         return value;
        //     } else if (Buffer.isBuffer(value) || !utils.isObject(value)) {
        //         throw new CastError('string', value, this.path);
        //     }
        //
        //     // Handle the case where user directly sets a populated
        //     // path to a plain object; cast to the Model used in
        //     // the population query.
        //     var path = doc.$__fullPath(this.path);
        //     var owner = doc.ownerDocument ? doc.ownerDocument() : doc;
        //     var pop = owner.populated(path, true);
        //     var ret = new pop.options.model(value);
        //     ret.$__.wasPopulated = true;
        //     return ret;
        // }

        // If null or undefined
        if (value === null || value === undefined) {
            return value;
        }

        if (typeof value !== 'undefined') {
            // handle documents being passed
            if (value._id && typeof value._id === 'string') {
                return value._id;
            }

            // Re: gh-647 and gh-3030, we're ok with casting using `toString()`
            // **unless** its the default Object.toString, because "[object Object]"
            // doesn't really qualify as useful data
            if (value.toString && value.toString !== Object.prototype.toString) {
                return value.toString();
            }
        }

        throw new CastError('string', value, this.path);
    };

    /*!
     * ignore
     */

    function handleSingle(val) {
        return this.castForQuery(val);
    }

    function handleArray(val) {
        var _this = this;
        if (!Array.isArray(val)) {
            return [this.castForQuery(val)];
        }
        return val.map(function (m) {
            return _this.castForQuery(m);
        });
    }

    Gallery.prototype.$conditionalHandlers = function () {
        var newKeys = {
            $all: handleArray,
            $gt: handleSingle,
            $gte: handleSingle,
            $lt: handleSingle,
            $lte: handleSingle,
            $options: handleSingle,
            $regex: handleSingle,
            $not: handleSingle
        };

        for (var i in SchemaType.prototype.$conditionalHandlers) {
            if (SchemaType.prototype.$conditionalHandlers.hasOwnProperty(i)) {
                if (!newKeys[i]) {
                    newKeys[i] = SchemaType.prototype.$conditionalHandlers[i];
                }
            }
        }
        return newKeys;
    }();

    /**
     * Expose
     */

    Schema.Types.Gallery = Gallery;
    Types.Gallery = Gallery;
    return Gallery;
}
