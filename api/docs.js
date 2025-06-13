const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { error_page } = require("../functions/error_page.js");

router.get("/:err", (req, res) => {
  const { err } = req.params;
  const filePath = path.join(__dirname, "..", "docs", `${err}.html`);

  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      return res.status(404).send(error_page(404, "Not Found"));
    }
    res.sendFile(filePath);
  });
});

module.exports = router;
