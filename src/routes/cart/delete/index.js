const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Cart = require("../../../model/cart.model");
const cartService = require("../../../service/dbService")({
    model: Cart
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;

        const cart = await cartService.getSingleDocumentByQuery({ user: userId });

        if (!cart) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Cart not found.")
            );
        }
        await cartService.deleteDocumentById(cart._id);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Cart deleted successfully.")
        );

    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    itemId: objectIdValidation().optional().messages({
        "string.base": "itemId must be a valid ObjectId"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

