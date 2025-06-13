const express = require("express");
const router = express.Router();
const path = require("path");
const { bordersFile } = require("../config.json");
const fs = require("fs");
const { error_page } = require("../functions/error_page.js");
module.exports = (token) => {
  let border = "";
  try {
    const data = fs.readFileSync(bordersFile, "utf8");
    const parsedData = JSON.parse(data);
    border = parsedData.border;
  } catch (error) {
    console.error("Error reading data from file:", error);
  }

  router.get("/getCurrentBorders", async (req, res) => {
    res.json({
      borders: border,
    });
  });

  router.post("/editBorders", (req, res) => {
    //Podstawowe dane (zwracane przy get /announcement)
    const newBorders = req.body.borders;
    //Weryfikacja żądania
    const auth = req.body.authToken;
    if (!newBorders) {
      return res.status(400).send(error_page(400, "Bad Request"));
    } else if (token !== auth) {
      return res.status(403).send(error_page(403, "Forbidden"));
    }

    border = newBorders;

    const dataToSave = {
      border,
    };

    fs.writeFileSync(bordersFile, JSON.stringify(dataToSave), "utf8");

    res.sendStatus(201);
  });

  //! GRA

  let p1 = "";
  let p2 = "";
  let p1n = "";
  let p2n = "";
  let p1nc = "";
  let p2nc = "";
  //? Wymiana słówek co rundę
  router.post("/player1-submit", (req, res) => {
    p1 = req.body.text;
    return res.sendStatus(200);
  });
  router.post("/player2-submit", (req, res) => {
    p2 = req.body.text;
    return res.sendStatus(200);
  });
  router.get("/player1-req", (req, res) => {
    const p = p1;
    p1 = "";
    return p ? res.send({ text: p }) : res.send({ text: "no" });
  });
  router.get("/player2-req", (req, res) => {
    const p = p2;
    p2 = "";
    return p ? res.send({ text: p }) : res.send({ text: "no" });
  });
  //? Wymiana nickow
  router.post("/player1-nick", (req, res) => {
    p1n = req.body.nick;
    p1nc = req.body.color;
    return res.sendStatus(200);
  });
  router.post("/player2-nick", (req, res) => {
    p2n = req.body.nick;
    p2nc = req.body.color;
    return res.sendStatus(200);
  });
  router.get("/player1-nick-req", (req, res) => {
    const p = p1n;
    p1n = "";
    const pc = p1nc;
    p1nc = "";
    return p
      ? res.send({ nick: p, color: pc })
      : res.send({ nick: "no", color: "no" });
  });
  router.get("/player2-nick-req", (req, res) => {
    const p = p2n;
    p2n = "";
    const pc = p2nc;
    p2nc = "";
    return p
      ? res.send({ nick: p, color: pc })
      : res.send({ nick: "no", color: "no" });
  });

  return router;
};
