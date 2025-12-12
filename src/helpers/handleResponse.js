const sendResponse = (response, headers = null, status, data) => {
    if (headers && headers !== "") {
        return response.set(headers).status(status).send(data);
    }
    return response.set({ "Content-Type": "application/json" }).status(status).send(data);
};

let messages = {};

messages.successResponse = (message = "Your request is successfully executed.", data = {}, meta = {}) => ({
    isSuccess: true,
    status: "SUCCESS",
    message,
    data,
    meta
});

messages.badRequest = (message = "The request cannot be fulfilled due to bad syntax.", data = {}) => ({
    isSuccess: false,
    status: "BAD_REQUEST",
    message,
    data
});

messages.unAuthorizedRequest = (message = "You are not authorized to access the request.", data = {}) => ({
    isSuccess: false,
    status: "UNAUTHORIZED",
    message,
    data
});

messages.forbiddenRequest = (message = "You do not have permission to perform this action.", data = {}) => ({
    isSuccess: false,
    status: "FORBIDDEN",
    message,
    data
});

messages.recordNotFound = (message = "Record not found with that criteria.", data = {}) => ({
    isSuccess: false,
    status: "RECORD_NOT_FOUND",
    message,
    data
});

messages.validationError = (message = "Validation failed for the provided data.", data = {}) => ({
    isSuccess: false,
    status: "VALIDATION_ERROR",
    message,
    data
});

messages.isAssociated = (message = "Data are already associated with another account.", data = {}) => ({
    isSuccess: false,
    status: "CONFLICT",
    message,
    data
});

messages.insufficientParameters = (message = "Required parameters are missing or incomplete.", data = {}) => ({
    isSuccess: false,
    status: "BAD_REQUEST",
    message,
    data
});

messages.invalidCredentials = (message = "Invalid credentials provided.", data = {}) => ({
    isSuccess: false,
    status: "INVALID_CREDENTIALS",
    message,
    data
});

messages.loginSuccess = (message = "Login successfully.", data = {}) => ({
    isSuccess: true,
    status: "SUCCESS",
    message,
    data
});

messages.loginFailed = (message = "Login failed.", data = {}) => ({
    isSuccess: false,
    status: "BAD_REQUEST",
    message,
    data
});

messages.emailSuccess = (message = "Email sent successfully. Please check your email for the reset password link.", data = {}) => ({
    isSuccess: true,
    status: "SUCCESS",
    message,
    data
});

messages.emailFailed = (message = "Email not sent. Please try again later.", data = {}) => ({
    isSuccess: false,
    status: "BAD_REQUEST",
    message,
    data
});

messages.internalServerError = (message = "There is some technical problem, please retry again.", data = {}) => ({
    isSuccess: false,
    status: "INTERNAL_SERVER_ERROR",
    message,
    data
});

module.exports = { sendResponse, messages };