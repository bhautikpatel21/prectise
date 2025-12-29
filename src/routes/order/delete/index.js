const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const orderService = require("../../../service/dbService")({
    model: Order
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if order exists
        const existingOrder = await orderService.getDocumentById(id);

        if (!existingOrder) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Order not found.")
            );
        }

        // Delete the order
        await orderService.deleteDocumentById(id);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Order deleted successfully.")
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    id: objectIdValidation().required().messages({
        "any.required": "Order id is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

