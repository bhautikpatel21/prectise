const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Product = require("../../../model/product.model");
const productService = require("../../../service/dbService")({
    model: Product
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await productService.getDocumentById(id);

        if (!product) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Product not found.")
            );
        }

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Product retrieved successfully.", product)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    id: objectIdValidation().required().messages({
        "any.required": "id is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

