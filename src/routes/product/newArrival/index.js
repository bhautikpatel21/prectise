const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Product = require("../../../model/product.model");
const productService = require("../../../service/dbService")({
    model: Product
});

exports.handler = async (req, res) => {
    try {
        // Show ALL products (isShow: true or false) when accessed from navbar filter
        const products = await productService.getDocumentByQuery(
            {},
            [],
            { createdAt: -1 },
            1,
            8
        );

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("New arrivals retrieved successfully.", products)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

