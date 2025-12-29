const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const orderService = require("../../../service/dbService")({
    model: Order
});

exports.handler = async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 10, status, userId, dateFilter, selectedDate } = req.query;

        // Build where clause for filtering
        let where = {};

        // Filter by user if userId is provided
        if (userId) {
            where.user = userId;
        }

        // Filter by status if provided
        if (status) {
            const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'];
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

        // Filter by specific selected date (takes priority over dateFilter)
        if (selectedDate) {
            const selected = new Date(selectedDate);
            const startDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate());
            const endDate = new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 23, 59, 59, 999);

            // Filter by orderDate if it exists, otherwise use createdAt
            where.$or = [
                {
                    orderDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                },
                {
                    $and: [
                        { $or: [{ orderDate: { $exists: false } }, { orderDate: null }] },
                        { createdAt: { $gte: startDate, $lte: endDate } }
                    ]
                }
            ];
        }
        // Filter by date range if dateFilter is provided (only if selectedDate is not provided)
        else if (dateFilter) {
            const now = new Date();
            let startDate, endDate;

            switch (dateFilter) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
                    break;
                case 'thisWeek':
                    // Start of week (Sunday)
                    const dayOfWeek = now.getDay();
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - dayOfWeek);
                    startDate.setHours(0, 0, 0, 0);
                    endDate = new Date(now);
                    endDate.setHours(23, 59, 59, 999);
                    break;
                case 'thisMonth':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
                    break;
                default:
                    return sendResponse(
                        res,
                        null,
                        400,
                        messages.badRequest("Invalid dateFilter. Valid options are: today, thisWeek, thisMonth")
                    );
            }

            // Filter by orderDate if it exists, otherwise use createdAt
            where.$or = [
                {
                    orderDate: {
                        $gte: startDate,
                        $lte: endDate
                    }
                },
                {
                    $and: [
                        { $or: [{ orderDate: { $exists: false } }, { orderDate: null }] },
                        { createdAt: { $gte: startDate, $lte: endDate } }
                    ]
                }
            ];
        }

        // Get total count of orders matching the filters
        const totalCount = await orderService.getCountDocument(where);

        // Get orders with pagination and populate related data
        const populatedOrders = await Order.find(where)
            .populate('items.product')
            .populate('user', 'name email phone')
            .sort({ createdAt: -1 })
            .skip((parseInt(pageNumber) - 1) * parseInt(pageSize))
            .limit(parseInt(pageSize));

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("All orders retrieved successfully.", populatedOrders, {
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
    status: Joi.string().valid('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned').optional().messages({
        "any.only": "status must be one of: pending, confirmed, shipped, delivered, cancelled, returned"
    }),
    userId: Joi.string().optional().messages({
        "string.base": "userId must be a string"
    }),
    dateFilter: Joi.string().valid('today', 'thisWeek', 'thisMonth').optional().messages({
        "any.only": "dateFilter must be one of: today, thisWeek, thisMonth"
    }),
    selectedDate: Joi.string().isoDate().optional().messages({
        "string.isoDate": "selectedDate must be a valid ISO date string"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });




