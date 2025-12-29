const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");

const get = require("./get");
const update = require("./update");

// Get homepage data
router.get(
    "/get",
    get.handler
);

// Save homepage data (creates if not exists, updates if exists)
router.put(
    "/save",
    validator("body", update.rule),
    update.handler
);

module.exports = router;
