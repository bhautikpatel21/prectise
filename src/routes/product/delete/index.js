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

        const existingProduct = await productService.getDocumentById(id);

        if (!existingProduct) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Product not found.")
            );
        }

        await productService.deleteDocumentById(id);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Product deleted successfully.")
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

