const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Order = require("../../../model/order.model");
const orderService = require("../../../service/dbService")({
    model: Order
});

exports.handler = async (req, res) => {
    try {
        // Aggregate to find products with most orders
        const aggregationPipeline = [
            // Unwind the items array to get individual order items
            { $unwind: "$items" },
            // Group by product and count how many times it appears in orders
            {
                $group: {
                    _id: "$items.product",
                    orderCount: { $sum: 1 },
                    totalQuantity: { $sum: "$items.quantity" }
                }
            },
            // Sort by order count descending
            { $sort: { orderCount: -1 } },
            // Limit to top 8 products
            { $limit: 8 },
            // Lookup product details
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            // Unwind the product array (should be single product)
            { $unwind: "$product" },
            // Replace root with product document, keeping orderCount for reference
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: ["$product", { orderCount: "$orderCount", totalQuantity: "$totalQuantity" }]
                    }
                }
            }
        ];

        const trendingProducts = await orderService.getDocumentByAggregation(aggregationPipeline);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Trending products retrieved successfully.", trendingProducts)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

