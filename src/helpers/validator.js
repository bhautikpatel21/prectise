const { sendResponse, messages } = require("./handleResponse");

module.exports = (location, schema) => {
  return (req, res, next) => {

    const { error, value } = schema.validate(req[location], { abortEarly: false, stripUnknown: true });

    if (!error) {
      if (location === "query") {
        req.modifiedQuery = value;
      } else {
        req[location] = value;
      }
      return next();
    }

    const errors = error.details.map(err => ({
      field: err.context.key,
      message: err.message.replace(/["]/g, '')
    }));

    return sendResponse(
      res,
      null,
      400,
      messages.validationError(
        undefined,
        errors
      )
    );
  };
};