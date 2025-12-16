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
        const { returnReason } = req.body;

        const order = await orderService.getDocumentById(id);

        if (!order) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Order not found.")
            );
        }

        // Check if order belongs to the user
        if (order.user.toString() !== userId.toString()) {
            return sendResponse(
                res,
                null,
                403,
                messages.forbiddenRequest("You don't have permission to return this order.")
            );
        }

        // Check if order is delivered
        if (order.status !== 'delivered') {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Only delivered orders can be returned.")
            );
        }

        // Check if order is already returned
        if (order.status === 'returned') {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Order is already returned.")
            );
        }

        // Return the order
        const updatedOrder = await orderService.updateDocumentById(id, {
            status: 'returned',
            returnDate: new Date(),
            returnReason: returnReason || null
        });

        // Populate order details
        const populatedOrder = await Order.findById(updatedOrder._id)
            .populate('items.product')
            .populate('user', 'name email');

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Order returned successfully.", populatedOrder)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.paramsRule = Joi.object({
    id: objectIdValidation().required().messages({
        "any.required": "id is required"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

exports.rule = Joi.object({
    returnReason: Joi.string().optional().messages({
        "string.empty": "returnReason cannot be empty"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

