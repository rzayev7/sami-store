const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "sami-products",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ quality: "auto:good", fetch_format: "auto" }],
    format: "webp",
  },
});

const upload = multer({
  storage,
  // Images endpoint: reject uploads over 10MB.
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = upload;
