const express = require("express");
const router = express.Router();
const { error_page } = require("../functions/error_page.js");
module.exports = (con, token) => {
  let announcement = [];
  let announcementDescription = [];
  let announcementDate = [];
  con.query(
    "SELECT * FROM announcements ORDER BY ID DESC LIMIT 10",
    function (err, result, fields) {
      if (err) throw err;
      result.forEach((r) => {
        announcement.push(r.Announcement_title);
        announcementDescription.push(r.Announcement_description);
        announcementDate.push(r.Announcement_date);
      });
    }
  );

  router.get("/getCurrentAnnouncement", async (req, res) => {
    res.json({
      title: announcement,
      description: announcementDescription,
      date: announcementDate,
    });
  });

  router.get("/getAnnouncementRawData/:id", async (req, res) => {
    const { id } = req.params;
    con.query(
      "SELECT * FROM announcements WHERE ID = ?",
      [id],
      function (err, result, fields) {
        if (err) throw err;
        res.json({
          title: result[0].Announcement_title,
          description: result[0].Announcement_description,
          date: result[0].Announcement_date,
          quote: result[0].Announcement_quote,
          quoteColor: result[0].Announcement_quote_color,
          quoteSize: result[0].Announcement_quote_size,
          rawText: result[0].Announcement_rawtext,
        });
      }
    );
  });
  router.get("/getAnnouncements", async (req, res) => {
    con.query(
      "SELECT ID, Announcement_description FROM announcements ORDER BY ID DESC LIMIT 100",
      function (err, result, fields) {
        if (err) throw err;
        res.send(result);
      }
    );
  });

  router.post("/postAnnouncement", (req, res) => {
    //Podstawowe dane (zwracane przy get /announcement)
    const title = req.body.title;
    const description = req.body.description;
    const date = req.body.date;

    //Dane edytowskie (zwracane przy get /announcement_admin)
    const rawText = req.body.rawText; //? tekst z wyłączeniem cytatu
    const quote = req.body.quote;
    const quoteColor = req.body.quoteColor;
    const quoteSize = req.body.quoteSize;

    //Weryfikacja żądania
    const auth = req.body.authToken;
    if (
      !title ||
      !description ||
      !date ||
      !rawText ||
      !quote ||
      !quoteColor ||
      !quoteSize
    ) {
      return res.status(400).send(error_page(400, "Bad Request"));
    } else if (token !== auth) {
      return res.status(403).send(error_page(403, "Forbidden"));
    }

    announcement.unshift(title);
    announcement.pop();
    announcementDescription.unshift(description);
    announcementDescription.pop();
    announcementDate.unshift(date);
    announcementDate.pop();
    announcementRawText = rawText;
    announcementQuote = quote;
    announcementQuoteColor = quoteColor;
    announcementQuoteSize = quoteSize;
    con.query(
      "INSERT INTO announcements(Announcement_title, Announcement_description, Announcement_date, Announcement_rawtext, Announcement_quote, Announcement_quote_color, Announcement_quote_size) VAlUES(?,?,?,?,?,?,?)",
      [title, description, date, rawText, quote, quoteColor, quoteSize],
      function (err, result, fields) {
        if (err) throw err;
      }
    );

    res.sendStatus(201);
  });
  router.post("/editAnnouncement", (req, res) => {
    //Podstawowe dane (zwracane przy get /announcement)
    const title = req.body.title;
    const description = req.body.description;
    const date = req.body.date;

    //Dane edytowskie (zwracane przy get /announcement_admin)
    const rawText = req.body.rawText; //? tekst z wyłączeniem cytatu
    const quote = req.body.quote;
    const quoteColor = req.body.quoteColor;
    const quoteSize = req.body.quoteSize;
    const id = req.body.id;
    //Weryfikacja żądania
    const auth = req.body.authToken;
    if (
      !title ||
      !description ||
      !date ||
      !rawText ||
      !quote ||
      !quoteColor ||
      !quoteSize ||
      !id
    ) {
      return res.status(400).send(error_page(400, "Bad Request"));
    } else if (token !== auth) {
      return res.status(403).send(error_page(403, "Forbidden"));
    }
    con.query(
      "UPDATE announcements SET Announcement_title = ?, Announcement_description = ?, Announcement_date = ?, Announcement_rawtext = ?, Announcement_quote = ?, Announcement_quote_color = ?, Announcement_quote_size = ? WHERE ID = ?",
      [title, description, date, rawText, quote, quoteColor, quoteSize, id],
      function (err, result, fields) {
        if (err) throw err;
      }
    );
    announcement = [];
    announcementDescription = [];
    announcementDate = [];
    con.query(
      "SELECT * FROM announcements ORDER BY ID DESC LIMIT 10",
      function (err, result, fields) {
        if (err) throw err;
        result.forEach((r) => {
          announcement.push(r.Announcement_title);
          announcementDescription.push(r.Announcement_description);
          announcementDate.push(r.Announcement_date);
        });
      }
    );
    res.sendStatus(201);
  });
  return router;
};
