const Joi = require("joi");
const jwt = require("jsonwebtoken");
const { sendResponse, messages } = require("../../../helpers/handleResponse");
const User = require("../../../model/user.model");
const userService = require("../../../service/dbService")({
  model: User
});
const { hash } = require("../../../helpers/hash");

exports.handler = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await userService.getSingleDocumentByQuery({
      email: { $regex: `^${email}$`, $options: "i" },
    });

    let user;

    const hashedPassword = await hash.createHash(password);

    if (existingUser) {
        return sendResponse(res, null, 409, messages.isAssociated("This email is already registered."));

    } else {
      user = await userService.createDocument({
        name,
        email,
        password: hashedPassword,
      });
    }

    // Generate JWT token (temporary, valid only for OTP operations)
    const token = jwt.sign(
      {
        id: user._id,
        purpose: "verify_email",
        key: hashedPassword
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return sendResponse(
      res,
      null,
      existingUser ? 200 : 201,
      messages.successResponse("User registered successfully and OTP sent to your email.", { userId: user._id, token })
    );

  } catch (error) {
    console.error(error);
    return sendResponse(res, null, 500, messages.internalServerError());
  }
};

exports.rule = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "name is required"
  }),
  email: Joi.string().email().required().messages({
    "string.email": "email must be a valid email",
    "string.empty": "email is required"
  }),
  password: Joi.string().min(6).required().messages({
    "string.min": "password must be at least 6 characters",
    "string.empty": "password is required"
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    "any.only": "confirmPassword must match password",
    "string.empty": "confirmPassword is required"
  })
}).unknown(false).messages({ 'object.unknown': '"{{#key}}" is not allowed' });
