const Joi = require("joi");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const Wishlist = require("../../../model/wishlist.model");
const wishlistService = require("../../../service/dbService")({
    model: Wishlist
});

exports.handler = async (req, res) => {
    try {
        const userId = req.user._id;

        const wishlist = await Wishlist.findOne({ user: userId }).populate('products');

        if (!wishlist) {
            return sendResponse(
                res,
                null,
                200,
                messages.successResponse("Wishlist retrieved successfully.", {
                    user: userId,
                    products: []
                })
            );
        }

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("Wishlist retrieved successfully.", wishlist)
        );
    } catch (error) {
        console.error(error);
        return sendResponse(res, null, 500, messages.internalServerError());
    }
};

exports.rule = Joi.object({}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });

