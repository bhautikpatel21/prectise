const express = require("express");
const router = express.Router();
const validator = require("../../helpers/validator");
const sendMail = require("./sendEmail");
const getAllMails = require('./getAllEmails')

router.post(
    "/sendMail",
    validator("body", sendMail.rule),
    sendMail.handler
);

router.get(
    "/getAll",
    getAllMails.handler
);

module.exports = router;
