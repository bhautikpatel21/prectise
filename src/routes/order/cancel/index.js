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
        const { cancelReason } = req.body;

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
                messages.forbiddenRequest("You don't have permission to cancel this order.")
            );
        }

        // Check if order is already canceled or delivered
        if (order.status === 'canceled') {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Order is already canceled.")
            );
        }

        if (order.status === 'delivered') {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Cannot cancel a delivered order. Please use return order instead.")
            );
        }

        // Check if order is within 3 days
        const orderDate = new Date(order.orderDate);
        const currentDate = new Date();
        const daysDifference = (currentDate - orderDate) / (1000 * 60 * 60 * 24);

        if (daysDifference > 3) {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("Order can only be canceled within 3 days of placement.")
            );
        }

        // Cancel the order
        const updatedOrder = await orderService.updateDocumentById(id, {
            status: 'canceled',
            cancelDate: new Date(),
            cancelReason: cancelReason || null
        });

        // Populate order details
        const populatedOrder = await Order.findById(updatedOrder._id)
            .populate('items.product')
            .populate('user', 'name email');

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Order canceled successfully.", populatedOrder)
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
    cancelReason: Joi.string().optional().messages({
        "string.empty": "cancelReason cannot be empty"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

