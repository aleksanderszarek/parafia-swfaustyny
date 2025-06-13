const express = require("express");
const router = express.Router();
const { safetyFile } = require("../config.json");
const fs = require("fs");
const { error_page } = require("../functions/error_page.js");

module.exports = (safetytoken) => {
  router.delete("/safetyLockdown", (req, res) => {
    const authToken = req.body.authToken;
    if (authToken == safetytoken) {
      fs.writeFileSync(
        safetyFile,
        JSON.stringify({
          piracyLockdown: true,
          maintenanceLockdown: false,
        }),
      );
      return res
        .status(200)
        .send(error_page("WARNING", "PIRACY LOCKDOWN ENABLED!"));
    }
  });

  router.post("/lockdown", (req, res) => {
    const authToken = req.body.authToken;
    console.log(`${authToken} ${safetytoken}`); // Tutaj safetytoken nadal odnosi się do argumentu funkcji
    if (authToken == safetytoken) {
      fs.writeFileSync(
        safetyFile,
        JSON.stringify({
          piracyLockdown: false,
          maintenanceLockdown: true,
        }),
      );
      return res.status(200).send(error_page(200, "OK"));
    } else {
      return res.status(403).send(error_page(403, "Forbidden"));
    }
  });

  router.post("/unlock", (req, res) => {
    const authToken = req.body.authToken;
    if (authToken == safetytoken) {
      fs.writeFileSync(
        safetyFile,
        JSON.stringify({
          piracyLockdown: false,
          maintenanceLockdown: false,
        }),
      );
      return res.status(200).send(error_page(200, "OK"));
    }
  });

  return router;
};
