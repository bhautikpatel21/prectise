const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname);
    const filename = Date.now() + extension;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error("Only image files are allowed!"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB per file
    fieldSize: 50 * 1024 * 1024, // 50MB for non-file fields (like JSON data with base64 images)
    fieldNameSize: 100, // Max field name size
    fields: 20, // Max number of non-file fields
    files: 20 // Max number of file fields
  }
});

module.exports = { upload };