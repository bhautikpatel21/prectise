const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const orderService = require("../../../service/dbService")({
    model: Order
});

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;
        const { pageNumber = 1, pageSize = 10, status } = req.query;

        let where = { user: userId };

        // Filter by status if provided
        if (status) {
            const validStatuses = ['pending', 'delivered', 'canceled', 'returned'];
            if (!validStatuses.includes(status)) {
                return sendResponse(
                    res,
                    null,
                    400,
                    messages.badRequest(`Invalid status. Valid statuses are: ${validStatuses.join(", ")}`)
                );
            }
            where.status = status;
        }

        const totalCount = await orderService.getCountDocument(where);

        // Get orders with pagination and populate
        const populatedOrders = await Order.find(where)
            .populate('items.product')
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip((parseInt(pageNumber) - 1) * parseInt(pageSize))
            .limit(parseInt(pageSize));

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Orders retrieved successfully.", populatedOrders, {
                totalCount,
                pageNumber: parseInt(pageNumber),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(totalCount / parseInt(pageSize))
            })
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    pageNumber: Joi.number().integer().min(1).optional(),
    pageSize: Joi.number().integer().min(1).max(100).optional(),
    status: Joi.string().valid('pending', 'delivered', 'canceled', 'returned').optional().messages({
        "any.only": "status must be one of: pending, delivered, canceled, returned"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

