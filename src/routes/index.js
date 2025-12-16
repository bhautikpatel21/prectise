const path = require("path");
const { sendResponse, messages } = require("../helpers/handleResponse");
const { upload } = require("../middleware/image.middleware");
const authRoute = require("./auth");
const productRoute = require("./product");
const cartRoute = require("./cart");
const wishlistRoute = require("./wishlist");
const orderRoute = require("./order");
const userRoute = require("./user");
const reviewRoute = require("./review");
const paymentRoute = require("./payment");
const emailRoute = require("./email");

module.exports = (app) => {
    app.get("/", (req, res) => {
        res.json({
            message: "These are KalyanaVedika APIs",
            apiHealth: "Good",
            apiVersion: "V1.0.0",
        });
    });

    app.use("/v1/auth", authRoute);
    app.use("/v1/product", productRoute);
    app.use("/v1/cart", cartRoute);
    app.use("/v1/wishlist", wishlistRoute);
    app.use("/v1/order", orderRoute);
    app.use("/v1/user", userRoute);
    app.use("/v1/review", reviewRoute);
    app.use("/v1/payment", paymentRoute);
    app.use("/v1/email", emailRoute);

    app.use("/v1/upload", upload.single("image"), (req, res) => {
        if (!req.file) {
            return sendResponse(
                res,
                null,
                400,
                messages.badRequest("No file uploaded.")
            );
        }

        const imagePath = path.join("uploads", req.file.filename);
        const sanitizedImagePath = imagePath.replace(path.sep, "/");

        return sendResponse(
            res,
            null,
            200,
            messages.successResponse("File uploaded successfully!", { imagePath: sanitizedImagePath })
        );
    });

    app.use((err, req, res, next) => {
        console.error("error", err);
        return sendResponse(
            res,
            null,
            500,
            messages.internalServerError()
        );
    });
}
