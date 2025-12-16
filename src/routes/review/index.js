const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");
const { authToken } = require("../../middleware/auth.middleware");

const add = require("./add");
const get = require("./get");
const update = require("./update");
const deleteReview = require("./delete");

router.post(
    "/add",
    authToken,
    validator("body", add.rule),
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
    validator("params", update.paramsRule),
    validator("body", update.rule),
    update.handler
);

router.delete(
    "/delete/:id",
    authToken,
    validator("params", deleteReview.rule),
    deleteReview.handler
);

module.exports = router;

