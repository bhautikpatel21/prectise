const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const orderService = require("../../../service/dbService")({
    model: Order
});

// Simple admin check - you can enhance this with a role field in user model
const isAdmin = (email) => {
    // Add your admin email check logic here
    // For now, you can check against environment variable or hardcode
    const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
    return adminEmails.includes(email);
};

exports.handler = async (req, res) => {
    try {
        const userEmail = req.user.email;

        // Check if user is admin
        if (!isAdmin(userEmail)) {
            return sendResponse(
                res,
                null,
                403,
                messages.forbiddenRequest("Access denied. Admin privileges required.")
            );
        }

        const { pageNumber = 1, pageSize = 10, status, userId } = req.query;

        let where = {};

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

        // Filter by user if provided
        if (userId) {
            where.user = userId;
        }

        const totalCount = await orderService.getCountDocument(where);

        // Get orders with pagination
        const orders = await Order.find(where)
            .populate('items.product')
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip((parseInt(pageNumber) - 1) * parseInt(pageSize))
            .limit(parseInt(pageSize));

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("All orders retrieved successfully.", orders, {
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
    }),
    userId: Joi.string().optional()
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

