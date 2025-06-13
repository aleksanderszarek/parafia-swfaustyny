const express = require("express");
const router = express.Router();
const path = require("path");
const { accountFile } = require("../config.json");
const fs = require("fs");
module.exports = (token, safetytoken) => {
  let accounts = [];
  try {
    const accountsData = fs.readFileSync(accountFile, "utf8");
    accounts = JSON.parse(accountsData);
  } catch (error) {
    console.error("Error reading accounts file:", error);
  }
  function saveAccounts() {
    fs.writeFileSync(accountFile, JSON.stringify(accounts, null, 2), "utf8");
  }

  class Account {
    constructor(username, password, accountPermissions) {
      this.username = username;
      this.password = password;
      this.accountPermissions = accountPermissions;
    }
  }
  /*router.get("/create", (req, res) => {
  const { username, password, accountPermissions } = req.body;
  const existingAccount = accounts.find(
    (account) => account.username === username
  );
  if (existingAccount) {
    return res.sendStatus(400);
  }

  const newAccount = new Account(username, password, accountPermissions);
  accounts.push(newAccount);
  saveAccounts();

  return res.sendStatus(201);
});*/

  router.post("/authenticate", (req, res) => {
    const { username, password } = req.body;
    const account = accounts.find(
      (account) =>
        account.username === username && account.password === password,
    );
    if (!account) {
      return res.status(403).json({ accountPermissions: -1 });
    }
    if (account.accountPermissions == 0)
      return res.status(200).json({
        accountPermissions: 0,
        authToken: "Niedostępny",
        safetyToken: "Niedostępny",
      });
    else if (account.accountPermissions == 1)
      return res.status(200).json({
        accountPermissions: 1,
        authToken: token,
        safetyToken: "Niedostępny",
      });
    else
      return res.status(200).json({
        accountPermissions: 2,
        authToken: token,
        safetyToken: safetytoken,
      });
  });
  router.post("/validate", (req, res) => {
    const { authToken } = req.body;
    return res.send({ valid: authToken == token });
  });
  return router;
};
