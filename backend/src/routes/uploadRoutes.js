const express = require("express");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  return res.status(200).json({
    imageUrl: req.file.path,
  });
});

module.exports = router;
