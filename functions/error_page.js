function error_page(errorText, errorDescription) {
  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="stylesheet" href="https://swietafaustyna.pl/css/error.css" />
      <title>${errorText} - ${errorDescription}</title>
    </head>
    <body>
      <div id="center">
        <div id="error">
          <h1>${errorText}</h1>
          <div id="line"></div>
          <h1>${errorDescription}</h1>
        </div>
        <div id="learn-more">
          <h3>
            Wystąpił błąd, ale nic się nie martw! Możesz zawsze
            <a href="https://swietafaustyna.pl/docs/${errorText}"
              >dowiedzieć się więcej</a
            >!
          </h3>
        </div>
      </div>
    </body>
  </html>
  `;
}
function error_page_ratelimit() {
  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="https://swietafaustyna.pl/css/error.css" />
        <title>429 - Too many requests</title>
      </head>
      <body>
        <div id="center">
          <div id="error">
            <h1>429</h1>
            <div id="line"></div>
            <h1>Too many requests</h1>
          </div>
          <div id="learn-more">
            <h3>
                <b>Woah! Gorąco się tu zrobiło!</b><br>
                Wysyłasz za dużo żądań do naszego serwera, odczekaj chwilę! Moc obliczeniowa nie rośnie na drzewach :(
            </h3>
          </div>
        </div>
      </body>
    </html>
    `;
}

module.exports = {
  error_page: error_page,
  error_page_ratelimit: error_page_ratelimit,
};
