const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Product = require("../../../model/product.model");
const productService = require("../../../service/dbService")({
    model: Product
});

exports.handler = async (req, res) => {
    try {
        const { title, description, mainImage, sideImages, sizes, price, category, isShow, proDes, shipingInfo, productCare } = req.body;

        const product = await productService.createDocument({
            title,
            description,
            mainImage,
            sideImages: sideImages || [],
            sizes: sizes || [],
            price,
            category,
            isShow: isShow !== undefined ? isShow : false,
            proDes: proDes || '',
            shipingInfo: shipingInfo || '',
            productCare: productCare || ''
        });

        return sendResponse(
            res,
            null,
            201,
            messages.successResponse("Product created successfully.", product)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    title: Joi.string().required().messages({
        "string.empty": "title is required"
    }),
    description: Joi.string().required().messages({
        "string.empty": "description is required"
    }),
    mainImage: Joi.string().uri().required().messages({
        "string.uri": "mainImage must be a valid URL",
        "string.empty": "mainImage is required"
    }),
    sideImages: Joi.array().items(Joi.string().uri()).optional().messages({
        "array.base": "sideImages must be an array",
        "string.uri": "Each sideImage must be a valid URL"
    }),
    sizes: Joi.array().items(Joi.string()).optional().messages({
        "array.base": "sizes must be an array"
    }),
    price: Joi.number().positive().required().messages({
        "number.base": "price must be a number",
        "number.positive": "price must be a positive number",
        "any.required": "price is required"
    }),
    category: Joi.string().required().messages({
        "string.empty": "category is required"
    }),
    isShow: Joi.boolean().optional().messages({
        "boolean.base": "isShow must be a boolean"
    }),
    proDes: Joi.string().optional().allow('').messages({
        "string.base": "proDes must be a string"
    }),
    shipingInfo: Joi.string().optional().allow('').messages({
        "string.base": "shipingInfo must be a string"
    }),
    productCare: Joi.string().optional().allow('').messages({
        "string.base": "productCare must be a string"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

