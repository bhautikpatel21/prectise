const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const orderService = require("../../../service/dbService")({
    model: Order
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('items.product')
            .populate('user', 'name email');

        if (!order) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Order not found.")
            );
        }

        // Check if order belongs to the user
        if (order.user._id.toString() !== userId.toString()) {
            return sendResponse(
                res,
                null,
                403,
                messages.forbiddenRequest("You don't have permission to view this order.")
            );
        }

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Order retrieved successfully.", order)
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

