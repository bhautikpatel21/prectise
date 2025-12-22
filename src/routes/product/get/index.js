const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Product = require("../../../model/product.model");
const productService = require("../../../service/dbService")({
    model: Product
});

exports.handler = async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 30, category, search, showOnly } = req.query;

        let where = {};
        
        // If showOnly is true (frontend request), only show products with isShow: true
        // Admin panel won't send this parameter, so they see all products
        if (showOnly === 'true') {
            where.isShow = true;
        }
        
        if (category) {
            // Use exact match (case-insensitive) to prevent "shirt" from matching "t-shirt"
            where.category = { $regex: `^${category}$`, $options: "i" };
        }

        if (search) {
            where.$or = [
                { title: { $regex: search, $options: "i" } },
            ];
        }

        const products = await productService.getDocumentByQuery(
            where,
            [],
            { createdAt: -1 },
            parseInt(pageNumber),
            parseInt(pageSize)
        );

        const totalCount = await productService.getCountDocument(where);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Products retrieved successfully.", products, {
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
    category: Joi.string().optional(),
    search: Joi.string().optional(),
    showOnly: Joi.string().valid('true', 'false').optional().messages({
        "any.only": "showOnly must be 'true' or 'false'"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

