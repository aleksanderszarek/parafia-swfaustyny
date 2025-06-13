const express = require("express");
const router = express.Router();

module.exports = (con, safetytoken, token) => {
  router.post("/pagevisits", (req, res) => {
    const authToken = req.body.authToken;
    const start = req.body.start;
    const end = req.body.end;
    if (authToken == safetytoken) {
      con.query(
        `SELECT url, COUNT(*) AS v FROM userdata GROUP BY url ORDER BY COUNT(*) DESC LIMIT ${start}, ${end}`,
        function (err, result, fields) {
          if (err) throw err;
          return res.send(result);
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/ips", (req, res) => {
    const authToken = req.body.authToken;
    const start = req.body.start;
    const end = req.body.end;
    const order_by = req.body.order_by;
    if (authToken == safetytoken) {
      con.query(
        `SELECT
            userdata.IP,
            SUM(CASE WHEN userdata.method = 'GET' THEN 1 ELSE 0 END) AS get_requests,
            SUM(CASE WHEN userdata.method = 'POST' THEN 1 ELSE 0 END) AS post_requests,
            SUM(CASE WHEN userdata.method NOT IN ('GET', 'POST') THEN 1 ELSE 0 END) AS other_requests,
            COUNT(*) AS total_requests,
            mru.url AS most_requested_url,
            mru.browser AS most_used_browser,
            mru.os AS most_used_os,
            CONCAT(MAX(userdata.date), ' ', MAX(userdata.time)) AS last_request_time
        FROM
            userdata
        INNER JOIN (
            SELECT IP,
                  MAX(url) AS url,
                  MAX(browser) AS browser,
                  MAX(os) AS os
            FROM userdata
            GROUP BY IP
        ) AS mru ON userdata.IP = mru.IP
        GROUP BY
            userdata.IP
        ORDER BY
            ${order_by} DESC
        LIMIT ${start}, ${end};
    
    `,
        function (err, result, fields) {
          if (err) throw err;
          return res.send(result);
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/heat", (req, res) => {
    const authToken = req.body.authToken;
    const start = req.body.start;
    const end = req.body.end;
    if (authToken == safetytoken) {
      con.query(
        `SELECT * FROM blacklisted ORDER BY heat DESC LIMIT ${start}, ${end}`,
        function (err, result, fields) {
          if (err) throw err;
          return res.send(result);
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/unique", (req, res) => {
    const authToken = req.body.authToken;
    const start = req.body.start;
    const end = req.body.end;
    if (authToken == token) {
      con.query(
        `select count(distinct(ip)) as r from userdata;`,
        function (err, result, fields) {
          if (err) throw err;
          return res.send(result);
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/total", (req, res) => {
    const authToken = req.body.authToken;
    const start = req.body.start;
    const end = req.body.end;
    if (authToken == token) {
      con.query(
        `select count(ip) as r from userdata;`,
        function (err, result, fields) {
          if (err) throw err;
          return res.send(result);
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/bots", (req, res) => {
    const authToken = req.body.authToken;
    const start = req.body.start;
    const end = req.body.end;
    if (authToken == token) {
      con.query(
        `select count(ip) as r from blacklisted where heat > 19;`,
        function (err, result, fields) {
          if (err) throw err;
          return res.send(result);
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/pagevisits_count", (req, res) => {
    const authToken = req.body.authToken;
    if (authToken == safetytoken) {
      con.query(
        `SELECT COUNT(DISTINCT url) AS cnt FROM userdata`,
        function (err, result, fields) {
          if (err) throw err;
          return res.send(result);
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/ips_count", (req, res) => {
    const authToken = req.body.authToken;
    if (authToken == safetytoken) {
      con.query(
        `SELECT COUNT(DISTINCT IP) AS cnt FROM userdata`,
        function (err, result, fields) {
          if (err) throw err;
          return res.send(result);
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/heat_count", (req, res) => {
    const authToken = req.body.authToken;
    if (authToken == safetytoken) {
      con.query(
        `SELECT COUNT(DISTINCT IP) AS cnt FROM blacklisted`,
        function (err, result, fields) {
          if (err) throw err;
          return res.send(result);
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  router.post("/ban", (req, res) => {
    const authToken = req.body.authToken;
    const ip = req.body.ip;
    if (authToken == safetytoken) {
      con.query(
        `SELECT * FROM blacklisted WHERE IP = ?`,
        [ip],
        function (err, result, fields) {
          if (err) {
            console.error(
              "Błąd podczas sprawdzania adresu IP w bazie danych:",
              err
            );
            return res.sendStatus(500);
          }
          if (result.length === 0) {
            con.query(
              `INSERT INTO blacklisted(IP, heat) VALUES (?, 30)`,
              [ip],
              function (err, result, fields) {
                if (err) {
                  console.error("Błąd podczas wstawiania nowego rekordu:", err);
                  return res.sendStatus(500);
                }
                return res.sendStatus(200);
              }
            );
          } else {
            con.query(
              `UPDATE blacklisted SET heat = 30 WHERE IP = ?`,
              [ip],
              function (err, result, fields) {
                if (err) {
                  console.error("Błąd podczas aktualizacji rekordu:", err);
                  return res.sendStatus(500);
                }
                return res.sendStatus(200);
              }
            );
          }
        }
      );
    } else {
      return res.sendStatus(403);
    }
  });
  return router;
};
