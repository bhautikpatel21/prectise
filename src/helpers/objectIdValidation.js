const Joi = require("joi");
const mongoose = require("mongoose");

const objectIdValidation = () => Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.message("Invalid MongoDB ObjectId");
    }
    return value;
}, "ObjectId Validation");

module.exports = { objectIdValidation };