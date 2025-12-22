const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");
const { authToken } = require("../../middleware/auth.middleware");
const { upload } = require("../../middleware/image.middleware");

const add = require("./add");
const get = require("./get");
const update = require("./update");
const deleteReview = require("./delete");
const deleteReviewByAdmin = require("./deleteByAdmin");

router.post(
    "/add",
    authToken,
    upload.array("images", 5), // Allow up to 5 images
    (req, res, next) => {
        // Convert rating to number if it's a string (from form-data)
        if (req.body.rating && typeof req.body.rating === 'string') {
            req.body.rating = parseInt(req.body.rating);
        }
        validator("body", add.rule)(req, res, next);
    },
    add.handler
);

router.get(
    "/get",
    validator("query", get.rule),
    get.handler
);

router.put(
    "/update/:id",
    authToken,
    upload.array("images", 5), // Allow up to 5 images
    validator("params", update.paramsRule),
    (req, res, next) => {
        // Convert rating to number if it's a string (from form-data)
        if (req.body.rating && typeof req.body.rating === 'string') {
            req.body.rating = parseInt(req.body.rating);
        }
        validator("body", update.rule)(req, res, next);
    },
    update.handler
);

router.delete(
    "/delete/:id",
    authToken,
    validator("params", deleteReview.rule),
    deleteReview.handler
);

router.delete(
    "/deleteByAdmin/:id",
    authToken,
    validator("params", deleteReviewByAdmin.rule),
    deleteReviewByAdmin.handler
);

module.exports = router;

