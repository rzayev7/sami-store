const express = require("express");
const upload = require("../middleware/uploadMiddleware");
const { protectAdmin } = require("../middleware/adminAuthMiddleware");

const router = express.Router();

router.post("/", protectAdmin, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  return res.status(200).json({
    imageUrl: req.file.path,
  });
});

module.exports = router;
