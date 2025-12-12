const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");
const { authToken } = require("../../middleware/auth.middleware");

const createPayment = require("./create");
const verifyPayment = require("./verify");

router.post(
    "/create",
    authToken,
    validator("body", createPayment.rule),
    createPayment.handler
);

router.post(
    "/verify",
    validator("body", verifyPayment.rule),
    verifyPayment.handler
);

module.exports = router;
