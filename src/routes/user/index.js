const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");
const { authToken } = require("../../middleware/auth.middleware");

const getSingle = require("./getSingle");

router.get(
    "/getSingle",
    authToken,
    validator("query", getSingle.rule),
    getSingle.handler
);

module.exports = router;

