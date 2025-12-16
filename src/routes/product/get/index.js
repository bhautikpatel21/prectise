const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Product = require("../../../model/product.model");
const productService = require("../../../service/dbService")({
    model: Product
});

exports.handler = async (req, res) => {
    try {
        const { pageNumber = 1, pageSize = 30, category, search } = req.query;

        let where = {};
        
        if (category) {
            where.category = { $regex: category, $options: "i" };
        }

        if (search) {
            where.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
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
    search: Joi.string().optional()
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

