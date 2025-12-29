const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Homepage = require("../../../model/homepage.model");
const homepageService = require("../../../service/dbService")({
    model: Homepage
});

exports.handler = async (req, res) => {
    try {
        const { heroMobileImage, heroDesktopImage, collectionMobileImage, collectionDesktopImage, saleImage } = req.body;

        // Get existing homepage data
        const existingHomepage = await homepageService.getDocumentByQuery({});

        if (!existingHomepage || existingHomepage.length === 0) {
            // If no homepage exists, create one
            const homepage = await homepageService.createDocument({
                heroMobileImage: heroMobileImage || '',
                heroDesktopImage: heroDesktopImage || '',
                collectionMobileImage: collectionMobileImage || '',
                collectionDesktopImage: collectionDesktopImage || '',
                saleImage: saleImage || ''
            });

            return sendResponse(
                res,
                null,
                201,
                messages.successResponse("Homepage data created successfully.", homepage)
            );
        }

        // Update existing homepage
        const updateData = {};
        if (heroMobileImage !== undefined) updateData.heroMobileImage = heroMobileImage;
        if (heroDesktopImage !== undefined) updateData.heroDesktopImage = heroDesktopImage;
        if (collectionMobileImage !== undefined) updateData.collectionMobileImage = collectionMobileImage;
        if (collectionDesktopImage !== undefined) updateData.collectionDesktopImage = collectionDesktopImage;
        if (saleImage !== undefined) updateData.saleImage = saleImage;

        const updatedHomepage = await homepageService.updateDocumentById(
            existingHomepage[0]._id,
            updateData
        );

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Homepage data updated successfully.", updatedHomepage)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({
    heroMobileImage: Joi.string().optional().allow('').messages({
        "string.base": "heroMobileImage must be a string"
    }),
    heroDesktopImage: Joi.string().optional().allow('').messages({
        "string.base": "heroDesktopImage must be a string"
    }),
    collectionMobileImage: Joi.string().optional().allow('').messages({
        "string.base": "collectionMobileImage must be a string"
    }),
    collectionDesktopImage: Joi.string().optional().allow('').messages({
        "string.base": "collectionDesktopImage must be a string"
    }),
    saleImage: Joi.string().optional().allow('').messages({
        "string.base": "saleImage must be a string"
    })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });
