const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Product = require("../../../model/product.model");
const productService = require("../../../service/dbService")({
    model: Product
});
const { objectIdValidation } = require("../../../helpers/objectIdValidation");

exports.handler = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, mainImage, sideImages, sizes, price, category } = req.body;

        const existingProduct = await productService.getDocumentById(id);

        if (!existingProduct) {
            return sendResponse(
                res,
                null,
                404,
                messages.recordNotFound("Product not found.")
            );
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (mainImage !== undefined) updateData.mainImage = mainImage;
        if (sideImages !== undefined) updateData.sideImages = sideImages;
        if (sizes !== undefined) updateData.sizes = sizes;
        if (price !== undefined) updateData.price = price;
        if (category !== undefined) updateData.category = category;

        const updatedProduct = await productService.updateDocumentById(id, updateData);

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Product updated successfully.", updatedProduct)
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
    title: Joi.string().optional().messages({
        "string.empty": "title cannot be empty"
    }),
    description: Joi.string().optional().messages({
        "string.empty": "description cannot be empty"
    }),
    mainImage: Joi.string().uri().optional().messages({
        "string.uri": "mainImage must be a valid URL",
        "string.empty": "mainImage cannot be empty"
    }),
    sideImages: Joi.array().items(Joi.string().uri()).optional().messages({
        "array.base": "sideImages must be an array",
        "string.uri": "Each sideImage must be a valid URL"
    }),
    sizes: Joi.array().items(Joi.string()).optional().messages({
        "array.base": "sizes must be an array"
    }),
    price: Joi.number().positive().optional().messages({
        "number.base": "price must be a number",
        "number.positive": "price must be a positive number"
    }),
    category: Joi.string().optional().messages({
        "string.empty": "category cannot be empty"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

