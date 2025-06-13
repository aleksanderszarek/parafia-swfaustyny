 const express = require("express");
const router = express.Router();
const path = require("path");
const { eventFolder } = require("../config.json");
const fs = require("fs");
const { error_page } = require("../functions/error_page.js");

class Event {
  constructor(id, eventTitle, eventDescription, eventPictures) {
    this.id = id;
    this.eventTitle = eventTitle;
    this.eventDescription = eventDescription;
    this.eventPictures = [];
    eventPictures.forEach((picture) => {
      this.eventPictures.push(`${id}/${picture}`);
    });
  }
}
let events = [];

fs.readdir(eventFolder, (err, folders) => {
  folders.forEach((folder) => {
    fs.readdir(path.join(eventFolder, folder), (err, files) => {
      if (err) {
        console.error(err);
        return;
      }
      fs.readFile(path.join(eventFolder, folder, "data.json"), (err, data) => {
        const eventData = JSON.parse(data);
        events.push(
          new Event(folder, eventData.title, eventData.description, files),
        );
      });
    });
  });

  if (err) {
    console.error(err);
    return;
  }
});

router.get("/getEventList", (req, res) => {
  return res.json({ events: events });
});
router.get("/getImage/:folder/:file", (req, res) => {
  const { folder, file } = req.params;
  if (file == "data.json") {
    return res.sendStatus(200);
  }
  return res.sendFile(path.join(__dirname, "..", "eventsData", folder, file));
});

module.exports = router;
