const {
	rateLimitRequests,
	safetyFile,
	static,
	bannedIPs,
	adminIP,
	mySQLUser,
	mySQLPassword,
} = require("./config.json");
const {
	error_page,
	error_page_ratelimit,
} = require("./functions/error_page.js");
const express = require("express");
const app = express();
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");
const publicDir = path.join(__dirname, "public");
const mysql = require("mysql");
const { v4: uuidv4 } = require("uuid");
const tokenFilePath = path.join(__dirname, "data", "token.json");
const con = mysql.createConnection({
	host: "localhost",
	database: "f4ustyna_db",
	user: mySQLUser,
	password: mySQLPassword,
});
con.connect((err) => {
	if (err) throw err;
});
const generateTokens = () => {
	con.query(
		"update blacklisted set heat = 0 where heat < 21",
		function (err, result, fields) {
			if (err) throw err;
		}
	);
	const token = uuidv4();
	const tokenExpirationDate = new Date();
	tokenExpirationDate.setDate(tokenExpirationDate.getDate() + 30);

	const safetyToken = uuidv4();
	const safetyTokenExpirationDate = new Date();
	safetyTokenExpirationDate.setDate(safetyTokenExpirationDate.getDate() + 30);

	return {
		token: { value: token, expirationDate: tokenExpirationDate },
		safetyToken: {
			value: safetyToken,
			expirationDate: safetyTokenExpirationDate,
		},
	};
};

const loadTokens = () => {
	try {
		const tokensData = fs.readFileSync(tokenFilePath, "utf8");
		return JSON.parse(tokensData);
	} catch (error) {
		console.error("Error loading tokens:", error);
		return null;
	}
};

const saveTokens = (tokensData) => {
	try {
		fs.writeFileSync(tokenFilePath, JSON.stringify(tokensData, null, 2));
	} catch (error) {
		console.error("Error saving tokens:", error);
	}
};

const isTokenValid = (tokenData) => {
	if (!tokenData) return false;
	const expirationDate = new Date(tokenData.expirationDate);
	const currentDate = new Date();
	return expirationDate > currentDate;
};

const loadOrCreateTokens = () => {
	let tokensData = loadTokens();
	if (!isTokenValid(tokensData.token)) {
		tokensData = generateTokens();
		saveTokens(tokensData);
	}
	return tokensData;
};

const tokenData = loadOrCreateTokens();
const safetytoken = tokenData.safetyToken.value;
const token = tokenData.token.value;

static.forEach((element) => {
	app.use(`/${element}`, express.static(path.join(publicDir, element)));
});
app.use(bodyParser.json());
app.set("trust proxy", 1);
const announcementsRouter = require("./api/announcements.js")(con, token);
const eventsRouter = require("./api/events.js");
const safetyRouter = require("./api/safety.js")(safetytoken);
const userdataRouter = require("./api/userdata.js")(con, safetytoken, token);
const accountsRouter = require("./api/accounts.js")(token, safetytoken);
const borderRouter = require("./api/borders.js")(con, token);
const docsRouter = require("./api/docs.js");
const limiter = rateLimit({
	windowMs: 60000,
	max: rateLimitRequests,
	message: error_page_ratelimit(),
});
app.use(limiter);
app.use(express.json());
app.use((req, res, next) => {
	const timestamp = new Date();
	const formattedDate = new Intl.DateTimeFormat("pl-PL", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(timestamp);
	const formattedTime = new Intl.DateTimeFormat("pl-PL", {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).format(timestamp);
	const ip = req.ip;
	const method = req.method;
	const url = req.url;
	const userAgent = req.headers["user-agent"];
	const getDeviceInfo = (userAgent) => {
		const osInfo = userAgent.match(/\(([^)]+)\)/);
		const browserInfo = userAgent.match(
			/(Firefox|Chrome|Safari|Edge|Opera)\/(\d+)/
		);

		const os = osInfo ? osInfo[1] : "Unknown OS";
		const browser = browserInfo
			? `${browserInfo[1]} ${browserInfo[2]}`
			: "Unknown Browser";

		return { os, browser };
	};

	const { os, browser } = getDeviceInfo(userAgent);
	const body = JSON.stringify(req.body);
	con.query(
		"INSERT INTO userdata(ip, date, time, method, url, os, browser, body) values(?, ?, ?, ?, ?, ?, ?, ?)",
		[ip, formattedDate, formattedTime, method, url, os, browser, body],
		function (err, result, fields) {
			if (err) throw err;
		}
	);

	next();
});
app.use((req, res, next) => {
	const isBlacklisted =
		bannedIPs.findIndex((ip) => ip === req.ip.toString()) !== -1;

	if (isBlacklisted) {
		return res.sendStatus(403);
	}

	next();
});
app.get("/blacklisted", (req, res) => {
	return res.json(bannedIPs).status(200);
});
app.use("/api/v3/announcements", announcementsRouter);
app.use("/api/v3/events", eventsRouter);
app.use("/api/v3/safety", safetyRouter);
app.use("/api/v3/userdata", userdataRouter);
app.use("/api/v3/accounts", accountsRouter);
app.use("/api/v3/borders", borderRouter);
app.use("/docs", docsRouter);

const checkSafety = (req, res, next) => {
	con.query(
		`SELECT heat FROM blacklisted WHERE IP = ?`,
		[req.ip],
		function (err, result, fields) {
			if (err) {
				console.error("Błąd podczas sprawdzania bezpieczeństwa:", err);
				return res
					.status(500)
					.send("Wystąpił błąd podczas sprawdzania bezpieczeństwa.");
			}
			if (result.length > 0 && result[0].heat > 20) {
				return res
					.status(403)
					.sendFile(path.join(publicDir, "..", "errors", "banned.html"));
			} else {
				if (req.ip === adminIP) {
					return next();
				} else {
					const safetyData = JSON.parse(fs.readFileSync(safetyFile));
					if (safetyData.piracyLockdown) {
						return res
							.status(410)
							.sendFile(path.join(publicDir, "..", "errors", "410.html"));
					} else if (safetyData.maintenanceLockdown) {
						return res.status(503).send(error_page(503, "Service Unavailable"));
					} else {
						return next();
					}
				}
			}
		}
	);
};

const pages = [
	"index",
	"announcements",
	"biblegroup",
	"borders",
	"contact",
	"schedule",
	"gallery",
	"privacypolicy",
	"service",
	"outhouse",
	"standards",
	"acknowledgements",
];
const pagesMains = [
	`      <div class="message-container" style="padding: 20px 5%">
        <div class="message-container" style="background-color: #00000000">
          <div class="imageText">
            <img src="images/1.JPG" alt="" />
            <div>
              <h2>
                Witamy na stronie Parafii Świętej Faustyny Dziewicy w
                Częstochowie!
              </h2>
              <h3>
                Dnia 3 kwietnia 2005 roku, w Niedzielę Miłosierdzia Bożego,
                czyli dzień po śmierci Jana Pawła II, ksiądz arcybiskup
                Stanisław Nowak powołał do istnienia nową parafię na terenie
                Częstochowy, której patronką została św. Faustyna Dziewica.
                Rozpoczęły się wówczas prace nad przygotowaniem tymczasowej
                kaplicy, które trwały od 23 lipca do 25 września tego samego
                roku. Po zakończeniu prac, 25 września została odprawiona
                pierwsza Msza Święta, co zainaugurowało również Nowennę do
                Bożego Miłosierdzia, przygotowującą wiernych do pierwszej
                uroczystości patronalnej.
              </h3>
            </div>
          </div>
        </div>
        <div class="message-container" style="background-color: #00000000">
          <div class="imageText">
            <div class="ar">
              <h2>Wprowadzenie obrazu Bożego Miłosierdzia</h2>
              <h3>
                Kilka miesięcy później, 5 października 2005 roku, w dniu odpustu
                parafialnego ku czci św. Faustyny Dziewicy, wprowadzono do
                parafii obraz Bożego Miłosierdzia. Ten niezwykle ważny wizerunek
                został poświęcony przez świętego Jana Pawła II, gdy ten jeszcze
                żył, a następnie peregrynował po całej archidiecezji
                częstochowskiej w latach 2002–2003. Obraz nawiedził każdą
                parafię oraz wszystkie domy zakonne w archidiecezji, a po
                zakończeniu peregrynacji przez kolejne 22 miesiące odbierał
                cześć w Archikatedrze, zanim trafił do nowo powstałej parafii
                św. Faustyny.
              </h3>
            </div>
            <img src="images/obm.webp" alt="" />
          </div>
        </div>
        <div class="message-container" style="background-color: #00000000">
          <div class="imageText">
            <img src="images/mb-ludzmierska.jpg" id="mbi" alt="" />
            <div>
              <h2>Figura Matki Boskiej Ludźmierskiej</h2>
              <h3>
                6 października 2007 roku, dzięki staraniom księdza arcybiskupa
                oraz kustosza sanktuarium w Ludźmierzu, księdza prałata Tadeusza
                Juchasa, do parafii wprowadzono piękną kopię figury Matki Bożej
                Ludźmierskiej. Ta niezwykła rzeźba, dar Związku Podhalan,
                dotarła w asyście około 400 górali, podkreślając duchowy związek
                tej parafii z Podhalem. Oryginalna figura Matki Bożej
                Ludźmierskiej, zwana Królową Podhala, znajduje się w kościele
                parafialnym w Ludźmierzu, gdzie zajmuje centralne miejsce w
                głównym ołtarzu. Wykonana z drewna lipowego przez nieznanego
                artystę, słynie z łask, jakie otrzymują wierni za jej
                wstawiennictwem. Cała rzeźba jest pozłacana, a wyraz twarzy
                Madonny pełen wdzięku i serdeczny uśmiech nadają jej
                szczególnego uroku. Dzieciątko Jezus, które Maryja trzyma na
                rękach, błogosławi wiernych prawą ręką, a w lewej dzierży jabłko
                królewskie. Historycy sztuki zaliczają tę rzeźbę do tzw.
                "Pięknych Madonn" z kręgu nowosądeckiej szkoły artystycznej XV
                wieku.
                <br /><br />
                Koronacja tej figury miała miejsce 15 sierpnia 1963 roku, a
                dokonał jej prymas Polski, ks. kardynał Stefan Wyszyński, w
                otoczeniu biskupów, używając koron papieskich Jana XXIII. W
                przygotowania do tej uroczystości zaangażowany był również ks.
                Stanisław Nowak, przyszły arcybiskup, który wówczas pełnił
                funkcję wikariusza w Ludźmierzu. W czasie koronacji wydarzyło
                się coś niezwykłego — berło, które trzymała Matka Boża, wypadło
                z jej ręki, a bp Karol Wojtyła złapał je w locie. Kardynał
                Wyszyński skomentował to znamienne wydarzenie słowami: „Matka
                Boża daje Ci swoje królestwo”. Tę chwilę uznano za proroczą,
                ponieważ Matka Boża Ludźmierska w sposób symboliczny przekazała
                swoje królestwo przyszłemu papieżowi Janowi Pawłowi II, który w
                1979 roku, podczas swojej pierwszej pielgrzymki do Polski,
                odwiedził Nowy Targ, witając się z Matką Bożą Ludźmierską.
                <br /><br />
                Dzięki tej kopii figury, Królowa Podhala i Jezus Miłosierny
                królują razem na Wzgórzu Miłosierdzia, przypominając o głębokich
                więzach duchowych między regionami Podhala i Częstochowy.
              </h3>
            </div>
          </div>
        </div>
        <div class="message-container" style="background-color: #00000000">
          <div class="imageText" style="border-bottom: none; padding-bottom: 0">
            <div class="ar">
              <h2>Rozpoczęcie budowy kościoła</h2>
              <h3>
                Kolejnym istotnym wydarzeniem w historii parafii było
                rozpoczęcie budowy nowego kościoła. Miało to miejsce 11 czerwca
                2010 roku, w Uroczystość Najświętszego Serca Pana Jezusa. Wtedy
                to, zgodnie z tradycją, ksiądz arcybiskup symbolicznym wbiciem
                pierwszej łopaty zainaugurował budowę nowego kościoła pod
                wezwaniem św. Faustyny Dziewicy w Częstochowie, kontynuując
                rozwój duchowy i materialny tej młodej wspólnoty parafialnej.
              </h3>
            </div>
            <img src="images/2.JPG" alt="" />
          </div>
        </div>
      </div>`,
	`<div class="message-container" id="loadingContainer">
<div class="message">Trwa ładowanie...</div>
</div>

<div class="message-container" id="rateLimitContainer">
<div class="message">Odpocznij chwilę!</div>
<div class="details">
Zostałeś ograniczony w związku z za dużą ilością żądań, którą otrzymaliśmy z twojego urządzenia. Poczekaj chwilę i spróbuj ponownie.
</div>
</div>`,
	`<div class="message-container">
<div class="message">
<b>Spotkania w każdy czwartek po Mszy Świętej. </b>
</div>
<div class="details">
<h3>
  Od czterech lat w naszej parafii odbywają się spotkania biblijne.
  Pierwszy rok był poświęcony historii powstania Biblii i omówieniu
  najważniejszych tematów Pisma Świętego. W następnym roku - Roku Św.
  Pawła - towarzyszyliśmy Apostołowi Narodów w jego podróżach
  misyjnych i analizowaliśmy treść Jego listów apostolskich. W trzecim
  roku naszych spotkań poznawaliśmy wielkie postacie Starego
  Testamentu: Abrahama, Izaaka Jakuba... Obecnie poznajemy bliżej
  wielkie postacie Nowego Testamentu: Św. Annę, Św. Joachima, Św.
  Józefa, Najświętszą Maryję Pannę, a następnie przyjrzymy się
  postaciom Apostołów i Ewangelistów.
</h3>
<br />
Zapraszamy na spotkania biblijne!
</div>
</div>`,
	`<div class="message-container" id="loadingContainer">
<div class="message">Trwa ładowanie...</div>
</div>

<div class="message-container" id="rateLimitContainer">
<div class="message">Zrobiło się trochę gorąco!</div>
<div class="details">
Zostałeś ograniczony w związku z za dużą ilością żądań, którą otrzymaliśmy z twojego urządzenia. Poczekaj chwilę i spróbuj ponownie.
</div>
</div>

<div class="message-container" id="bordersContainer"></div>`,
	`   <div class="message-container">
        <h2>Skontaktuj się z nami!</h2>
        <br />
        <div class="contact-container">
          <div class="contact-box">
            <img class="icon" src="./images/envelope-icon.png" alt="" />
            <div class="message"><b>E-mail</b></div>
            <div class="details">swfaustyna.cz@gmail.com</div>
          </div>
          <div class="contact-box">
            <img src="./images/phone-icon.png" alt="" class="icon" />
            <div class="message"><b>Numer telefonu</b></div>
            <div class="details">34 322 17 37</div>
          </div>
          <div class="contact-box">
            <img src="./images/maps-pin-black-icon.png" alt="" class="icon" />
            <div class="details">
              <div class="message"><b>Adres</b></div>
              ulica Świętej Faustyny 14<br />
              Częstochowa
            </div>
          </div>
          <div class="contact-box">
            <img src="./images/money-bag-icon.png" alt="" class="icon" />
            <div class="message"><b>Numer konta bankowego</b></div>
            <div class="details">21 1050 1142 1000 0090 7655 5318</div>
          </div>
        </div>
        <br /><br />
        <h2>Kancelaria parafialna</h2>
        Kancelaria parafialna w Naszym kościele jest czynna codziennie od
        godziny <b>17:00</b> do rozpoczęcia Mszy świętej wieczornej.
      </div>`,
	`      <div class="message-container">
        <h2>Organizacja Mszy Świętych</h2>
        <div class="contact-container" style="justify-content: center">
          <span class="contact-box">
            <div class="message">
              <b>Dni powszednie</b>
            </div>
            <div class="details">
              Lipiec i sierpień: <b>19:00</b><br />
              Inne miesiące: <b>18:00</b>
            </div>
          </span>
          <span class="contact-box">
            <div class="message">
              <b>Niedziele i święta</b>
            </div>
            <div class="details">9:00<br />12:00<br />18:00</div>
          </span>
        </div>
      </div>
      <div class="message-container">
        <h2>Uroczystości</h2>
        <div class="contact-container">
          <span class="contact-box">
            <div class="message"><b>Nabożeństwa majowe</b></div>
            <div class="details">
              <b>przez cały maj</b><br />
              - w tygodniu, po Mszy świętej o godzinie 18:00<br />- w niedziele,
              o 19:00 przy kapliczce Matki Boskiej Szkaplernej przy ulicy
              Bialskiej
            </div>
          </span>
          <span class="contact-box">
            <div class="message"><b>Nabożeństwa czerwcowe</b></div>
            <div class="details">
              <b>przez cały czerwiec</b><br />
              - w tygodniu, po Mszy świętej o godzinie 18:00<br />
              - w niedziele, po Mszy świętej o godzinie 12:00
            </div>
          </span>
          <span class="contact-box">
            <div class="message"><b>Różaniec</b></div>
            <div class="details">
              W każdy czwartek o godzinie 17:30 oraz
              <b> przez cały październik</b><br />
              - w tygodniu, po Mszy świętej o godzinie 18:00<br />
              - w niedziele, po Mszy świętej o godznie 12:00
            </div>
          </span>
          <span class="contact-box">
            <div class="message"><b>Oktawa Wszystkich Świętych</b></div>
            <div class="details">1 - 8 listopada</div>
          </span>
          <span class="contact-box">
            <div class="message"><b>Koronka do Krwi Chrystusa</b></div>
            <div class="details">
              w każdy wtorek przed Mszą świętą wieczorną
            </div>
          </span>
        </div>
      </div>
      <div class="message-container">
        <h2>Spotkania formacyjne</h2>
        <div class="contact-container" style="justify-self: center">
          <span class="contact-box">
            <div class="message"><b>I Komunia Święta</b></div>
            <div class="details">
              Spotkania dla dzieci przygotowujących się do I Komunii św. - II<br />
              niedziela miesiąca po Mszy św. o g. 12.00 a dla dzieci ze
              szkoły<br />
              specjalnej numer 23 w III niedzielę miesiąca po Mszy św. o g.
              12.00
            </div>
          </span>
          <span class="contact-box"
            ><div class="message"><b>Sakrament Bierzmowania</b></div>
            <div class="details">
              Spotkania dla młodzieży przygotowującej się do sakramentu<br />
              bierzmowania - piątek po Mszy św. o g. 18.00
            </div></span
          >
        </div>
      </div>`,
	`<div class="message-container" id="loadingContainer">
<div class="icon">🔄</div>
<div class="message">Trwa ładowanie...</div>
</div>

<div class="message-container" id="rateLimitContainer">
<div class="icon">🔥</div>
<div class="message">Zrobiło się trochę gorąco!</div>
<div class="details">
  Wysyłasz za dużo żądań do naszego serwera, moc obliczeniowa nie rośnie
  na drzewach, odczekaj chwilę!
</div>
</div>

<div class="message-container" id="errorContainer">
<div class="icon">❌</div>
<div class="message">Coś poszło nie tak!</div>
<div class="details">
  Nasz serwer nie odpowiada, spróbuj ponownie później!
</div>
</div>
<div class="message-container" id="eventList"></div>
<div class="message-container" id="eventsContainer"></div>`,
	`<div class="message-container">
<h1>Polityka prywatności</h1>
<p>
  <em>Data ostatniej aktualizacji: <i>24.03.2024</i></em>
</p>
<p>
  Twoja prywatność jest dla nas ważna. W tej polityce prywatności
  opisujemy, jakie informacje zbieramy, dlaczego je zbieramy i jak z
  nich korzystamy.
</p>
</div>
<br />
<div class="message-container">
<div class="message"><b>Rodzaje zbieranych informacji</b></div>
<div class="details">
  <h3>Zapytania do naszego serwera</h3>
  <p>
    Podczas korzystania z naszej strony, możemy analizować zapytania
    wysyłane do Naszego serwera w celu ulepszania strony, prowadzenia
    statystyk, identyfikowania występujących na niej błędów, łatania
    luk, poprawy wydajności strony oraz blokowania dostępu do strony w
    przypadku wykrycia nietypowego ruchu lub próby obejścia zabezpieczeń
    strony. Do danych dotyczących zapytań do serwera dołączony jest twój
    adres IP, typ przeglądarki, system operacyjny, typ i treść żądania
    oraz data i godzina owego. Dane te są przechowywane na naszych
    serwerach w bazie danych pogrupowanej według adresów IP, a
    przykładowy zapis tych danych wygląda w taki sposób:<br />
    <b
      >[01.02.2020, 23:25:40] GET /events | Windows NT 10.0; Win64; x64
      | Chrome 119 | {}</b
    >
  </p>
</div>
</div>
<br />
<div class="message-container">
<div class="message"><b>Sposób przechowywania informacji</b></div>
<div class="details">
  <h3>Dane przechowywane na naszych serwerach</h3>
  <p>
    Wszystkie dane przechowywane na naszych serwerach są odpowiednio
    zabezpieczone. Wgląd do danych jest możliwy jedynie poprzez ręczny
    przegląd bazy danych. Dane są anonimizowane.
  </p>
  <h3>Pliki cookies</h3>
  <p>
    Wykorzystujemy pliki cookies w celu personalizacji wyglądu strony. Pliki cookies nie są przesyłane na nasze serwery i są tylko dostępne lokalnie. W celu usunięcia wszystkich swoich preferencji <a href="" onclick="localStorage.clear(); alert('Pliki cookies usunięte z urządzenia, odśwież stronę w celu zobaczenia efektów');">kliknij tutaj</a>.
  </p>
</div>
</div>
<br />
<div class="message-container">
<div class="message">
  <b>Sprzedaż i udostępnianie danych firmom trzecim</b>
</div>
<div class="details">
  <p>
    Niesprzedajemy oraz nie udostępnaimy danych firmom trzecim.
    Wszystkie dane są przechowywane jedynie na naszych serwerach.
  </p>
</div>
</div>
<br />
<div class="message-container">
<div class="message"><b>Działanie w przypadku wycieku danych</b></div>
<div class="details">
  <p>
    W przypadku wycieku danych, zobowiązujemy się przeanalizować wyciek
    oraz poinformować wszystkich dotchniętych użytkowników poprzez
    komunikat na stronie głównej, jakie dane wyciekły oraz co było tego
    przyczyną.
  </p>
</div>
</div>
<br />
<div class="message-container">
<div class="message"><b>Postanowienia końcowe</b></div>
<div class="details">
  <h3>Zgoda na zbieranie danych osobowych</h3>
  <p>
    Wchodząc na stronę oraz korzystając z niej wyrażasz zgodę na
    zbieranie danych przedstawionych w tej polityce prywatności oraz
    wykorzystywaniu i przechowywaniu ich w sposób w niej przedstawiony.
    Nie jest możliwe korzystanie ze strony bez wyrażenia tej zgody.
  </p>
  <h3>Aktualizacje Polityki Prywatności</h3>
  <p>
    W przypadku aktualizacji postanowień zawartych w polityce
    prywatności, informacja o tej zmianie jest pokazywana na stronie
    głównej przez 24 godziny od opublikowania zmian. Zmiany w polityce
    prywatności mogą zostać wdrożone nie wcześniej niż 24 godziny od
    opublikowania zmian.
  </p>
  <h3>Prawa autorskie</h3>
  <p>
    Ta wersja Polityki Prywatności należy tylko i wyłączenie do Parafii
    Świętej Faustyny Dziewicy w Częstochowie oraz administracji strony.
    Wykorzystywanie jej w innym celu niż informowanie użytkowników
    strony <u>swietafaustyna.pl</u> o sposobie przetwarzania,
    wykorzystywania i zbierania ich danych osobowych na owej stronie
    jest zakazana i nielegalna.
  </p>
</div>
</div>`,
	``,
	`<div class="message-container">
<iframe
  width="1280"
  height="720"
  src="https://www.youtube.com/embed/YKdZUJmspqI"
  title="Góralska (ruchoma) szopka w Częstochowie."
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
  allowfullscreen
></iframe>
</div>`,
	`<div class="message-container">
        <h2>
          Standardy ochrony dzieci<br />w parafii świętej Faustyny Dziewicy w
          Częstochowie
        </h2>
      </div>
      <div class="message-container">
        <button
          class="nav-btn"
          onclick="location.href='/files/Standardy-ochrony-dzieci.doc'"
        >
          Standardy ochrony dzieci
        </button>
        <button
          class="nav-btn"
          onclick="location.href='/files/Karta-interwencji.docx'"
        >
          Karta interwencji
        </button>
      </div>`,
	`      <div class="message-container">
        <div>
          <h2>Podziękowania / Acknowledgements</h2>
          <hr />
          <h3>
            <b
              >Oto biblioteki o otwartym kodzie źródłowym użyte do stworzenia
              tej strony:</b
            >
            <ul style="list-style-type: none">
              <li>@express</li>
              <li>@express-rate-limit</li>
              <li>@express-app</li>
              <li>@fs</li>
              <li>@body-parser</li>
              <li>@path</li>
              <li>@mysql</li>
              <li>@uuid</li>
              <li>@path</li>
              <li>@promise</li>
              <li>@pullstream</li>
              <li>@randombytes</li>
              <li>@regenerate</li>
              <li>@repeat-string</li>
              <li>@repeating</li>
              <li>@schema-utils</li>
              <li>@safe-buffer</li>
              <li>@nodejs</li>
              <li>@nodejs-router</li>
            </ul>
          </h3>
        </div>
      </div>`,
];
const pagesJS = [
	0,
	"index.js",
	0,
	"borders.js",
	0,
	0,
	"gallery.js",
	0,
	0,
	0,
	0,
];
app.get("/", checkSafety, (req, res) => {
	return res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Parafia Świętej Faustyny w Częstochowie</title>
    <link rel="icon" type="image/x-icon" href="images/favicon.ico" />
    <link rel="stylesheet" href="css/style.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <header>
      <div>
        <img class="bgimg" src="images/background-image.png" />
        <h1 id="mobile">
          Parafia<br />
          Św. Faustyny Dziewicy<br />
          w Częstochowie
          <div id="menuBtn">
            <div id="nav-icon1" onclick="hamburgerMenu()">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </h1>
        <h1 id="computer">Parafia Św. Faustyny Dziewicy w Częstochowie</h1>
      </div>
    </header>
    <div class="message-container" id="bigMenu">
      <button class="nav-btn" onclick="location.href='/'">Strona Główna</button>
      <button class="nav-btn" onclick="location.href='/announcements'">
        Ogłoszenia
      </button>
      <button class="nav-btn" onclick="location.href='/gallery'">
        Galeria
      </button>
      <button class="nav-btn" onclick="location.href='/schedule'">Harmonogram</button>
      <button class="nav-btn" onclick="location.href='/borders'">
        Teren parafii
      </button>
      <button class="nav-btn" onclick="location.href='/outhouse'">
        Szopka bożonarodzeniowa
      </button>
      <button class="nav-btn" onclick="location.href='/contact'">
        Kontakt
      </button>
    </div>
    <div class="popup" id="cookie-popup" style="display: none">
      <div class="popup-content">
        <div>
          <div class="popup-header">
            <img src="images/cookie-bite-icon.png" />
            <h1>Pliki cookies</h1>
          </div>

          <h2 class="popupText">
            Pliki cookies na naszej stronie pozwalają zapamiętać Twoje
            preferencje oraz usprawnić działanie strony. Więcej informacji na
            temat działania plików cookies możesz przeczytać w
            <a href="/privacypolicy" id="cp-link"> polityce prywatności</a>.
          </h2>
        </div>
        <div style="display: flex; gap: 20px">
          <button class="nav-btn" id="popup-btn1">Zaakceptuj wymagane</button>
          <button class="nav-btn" id="popup-btn2">Zaakceptuj wszystkie</button>
        </div>
      </div>
    </div>
    <div class="popup" id="update-popup" style="display: none">
      <div class="popup-content">
        <div>
          <div class="popup-header">
            <img src="images/database-file-icon.png" />
            <h1>Aktualizacja strony</h1>
          </div>

          <h2 class="popupText">
            Zmieniliśmy wygląd strony i zoptymalizowaliśmy ją pod kątem
            starszych urządzeń. Część opcji mogła zostać przeniesiona do stopki,
            na dół strony. W związku ze zmianą tymczasowo zostały usunięte style
            w tym tryb kontrastu dla osób niedowidzących.
          </h2>
        </div>
        <div style="display: flex; gap: 20px">
          <button
            class="nav-btn"
            id="popup-btn3"
            onclick="document.querySelector('#update-popup').style.display = 'none'; localStorage.setItem('update-popup01',1)"
          >
            OK
          </button>
        </div>
      </div>
    </div>
    <div id="overlay">
      <div class="progress-divider">
        <h3>Parafia Świętej Faustyny Dziewicy w Częstochowie</h3>
      </div>
      <br />
      <div
        class="progress-divider"
        id="unsupported"
        style="display: none; padding: 40px"
      >
        <h2>Za mało miejsca!</h2>
        <h5>
          Strona nie jest przystosowana do tak małych ekranów przez co mogą się
          pojawić liczne błędy lub/i strona może wyglądać źle<br />
          <button
            class="nav-btn"
            onclick="document.getElementById('overlay').style.display = 'none'"
          >
            Kontynuuj mimo to
          </button>
        </h5>
      </div>
      <div class="progress-divider" id="loading">
        <h1>Wczytywanie...</h1>
        <br />
        <div id="progress-border">
          <div id="progress-spacing">
            <div id="progress-container">
              <noscript>
                <h2>Wystąpił problem podczas ładowania strony!</h2>
                <br />
                <h5>
                  Nie można wyświetlić strony, ponieważ skrypty
                  <u>JavaScript zostały wyłączone</u>!
                </h5>
              </noscript>
              <div id="progress-bar"></div>
            </div>
          </div>
        </div>
      </div>
      <br />
      <div class="progress-divider">
        <h3>
          Copyright 2025 © Parafia Świętej Faustyny Dziewicy w Częstochowie
        </h3>
      </div>
    </div>
      <main>
        ${pagesMains[0]}
      </main>
    <footer>
      <p>
        Copyright 2025 © Parafia Świętej Faustyny Dziewicy w Częstochowie.
        Wszystkie prawa zastrzeżone!
      </p>
      <div id="footerDivider">
        <div class="footerSection">
          <h3>Parafia</h3>
          <a href="/service">Służba liturgiczna</a>
          <a href="/biblegroup">Grupa biblijna</a>
        </div>
        <div class="footerSection">
          Wersja 2025.02
        </div>
        <div class="footerSection">
          <h3>Informacje</h3>
          <a href="/privacypolicy">Polityka Prywatności</a>
          <a href="/acknowledgements">Podziękowania</a>
          <a href="/standards">Standardy ochrony dzieci</a>
        </div>
      </div>
    </footer>
  </body>
  <script src="js/main.js"></script>
  <script src="js/${pagesJS[0]}"></script>
</html>
  `);
});
app.get("/adminpanel", checkSafety, (req, res) => {
	res.sendFile(path.join(__dirname, "public", "adminpanel.html"));
});
app.get("/testing", checkSafety, (req, res) => {
	res.sendFile(path.join(__dirname, "public", "game.html"));
});
app.get("/:filename", checkSafety, (req, res, next) => {
	const { filename } = req.params;

	index = pages.findIndex((page) => page === filename);
	if (index == -1) {
		const ipAddress = req.ip; // Upewniamy się, że IP jest bezpieczne

		// Sprawdzamy, czy istnieje już wpis dla tego IP w bazie danych
		con.query(
			`SELECT ID, heat FROM blacklisted WHERE IP = ?`,
			[ipAddress],
			function (err, result, fields) {
				if (err) throw err;
				if (result.length === 0) {
					// Jeśli nie istnieje, tworzymy nowy wpis
					con.query(
						`INSERT INTO blacklisted(IP, heat) VALUES (?, 1)`,
						[ipAddress],
						function (err, result, fields) {
							if (err) throw err;
						}
					);
				} else {
					// Jeśli istnieje, zwiększamy wartość "heat" o 1
					const newHeat = result[0].heat + 1;
					con.query(
						`UPDATE blacklisted SET heat = ? WHERE IP = ?`,
						[newHeat, ipAddress],
						function (err, result, fields) {
							if (err) throw err;
						}
					);
				}
			}
		);
		return res.send(error_page("404", "Not Found"));
	}
	return res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Parafia Świętej Faustyny w Częstochowie</title>
    <link rel="icon" type="image/x-icon" href="images/favicon.ico" />
    <link rel="stylesheet" href="css/style.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <header>
      <div>
        <img class="bgimg" src="images/background-image.png" />
        <h1 id="mobile">
          Parafia<br />
          Św. Faustyny Dziewicy<br />
          w Częstochowie
          <div id="menuBtn">
            <div id="nav-icon1" onclick="hamburgerMenu()">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </h1>
        <h1 id="computer">Parafia Św. Faustyny Dziewicy w Częstochowie</h1>
      </div>
    </header>
    <div class="message-container" id="bigMenu">
      <button class="nav-btn" onclick="location.href='/'">Strona Główna</button>
      <button class="nav-btn" onclick="location.href='/announcements'">
        Ogłoszenia
      </button>
      <button class="nav-btn" onclick="location.href='/gallery'">
        Galeria
      </button>
      <button class="nav-btn" onclick="location.href='/schedule'">Harmonogram</button>
      <button class="nav-btn" onclick="location.href='/borders'">
        Teren parafii
      </button>
      <button class="nav-btn" onclick="location.href='/outhouse'">
        Szopka bożonarodzeniowa
      </button>
      <button class="nav-btn" onclick="location.href='/contact'">
        Kontakt
      </button>
    </div>
    <div class="popup" id="cookie-popup" style="display: none">
      <div class="popup-content">
        <div>
          <div class="popup-header">
            <img src="images/cookie-bite-icon.png" />
            <h1>Pliki cookies</h1>
          </div>

          <h2 class="popupText">
            Pliki cookies na naszej stronie pozwalają zapamiętać Twoje
            preferencje oraz usprawnić działanie strony. Więcej informacji na
            temat działania plików cookies możesz przeczytać w
            <a href="/privacypolicy" id="cp-link"> polityce prywatności</a>.
          </h2>
        </div>
        <div style="display: flex; gap: 20px">
          <button class="nav-btn" id="popup-btn1">Zaakceptuj wymagane</button>
          <button class="nav-btn" id="popup-btn2">Zaakceptuj wszystkie</button>
        </div>
      </div>
    </div>
    <div class="popup" id="update-popup" style="display: none">
      <div class="popup-content">
        <div>
          <div class="popup-header">
            <img src="images/database-file-icon.png" />
            <h1>Aktualizacja strony</h1>
          </div>

          <h2 class="popupText">
            Zmieniliśmy wygląd strony i zoptymalizowaliśmy ją pod kątem
            starszych urządzeń. Część opcji mogła zostać przeniesiona do stopki,
            na dół strony. W związku ze zmianą tymczasowo zostały usunięte style
            w tym tryb kontrastu dla osób niedowidzących.
          </h2>
        </div>
        <div style="display: flex; gap: 20px">
          <button
            class="nav-btn"
            id="popup-btn3"
            onclick="document.querySelector('#update-popup').style.display = 'none'; localStorage.setItem('update-popup01',1)"
          >
            OK
          </button>
        </div>
      </div>
    </div>
    <div id="overlay">
      <div class="progress-divider">
        <h3>Parafia Świętej Faustyny Dziewicy w Częstochowie</h3>
      </div>
      <br />
      <div
        class="progress-divider"
        id="unsupported"
        style="display: none; padding: 40px"
      >
        <h2>Za mało miejsca!</h2>
        <h5>
          Strona nie jest przystosowana do tak małych ekranów przez co mogą się
          pojawić liczne błędy lub/i strona może wyglądać źle<br />
          <button
            class="nav-btn"
            onclick="document.getElementById('overlay').style.display = 'none'"
          >
            Kontynuuj mimo to
          </button>
        </h5>
      </div>
      <div class="progress-divider" id="loading">
        <h1>Wczytywanie...</h1>
        <br />
        <div id="progress-border">
          <div id="progress-spacing">
            <div id="progress-container">
              <noscript>
                <h2>Wystąpił problem podczas ładowania strony!</h2>
                <br />
                <h5>
                  Nie można wyświetlić strony, ponieważ skrypty
                  <u>JavaScript zostały wyłączone</u>!
                </h5>
              </noscript>
              <div id="progress-bar"></div>
            </div>
          </div>
        </div>
      </div>
      <br />
      <div class="progress-divider">
        <h3>
          Copyright 2025 © Parafia Świętej Faustyny Dziewicy w Częstochowie
        </h3>
      </div>
    </div>
      <main>
        ${pagesMains[index]}
      </main>
      <footer>
      <p>
        Copyright 2024 © Parafia Świętej Faustyny Dziewicy w Częstochowie.
        Wszystkie prawa zastrzeżone!
      </p>
      <div id="footerDivider">
        <div class="footerSection">
          <h3>Parafia</h3>
          <a href="/service">Służba liturgiczna</a>
          <a href="/biblegroup">Grupa biblijna</a>
        </div>
        <div class="footerSection">
          Wersja 2025.02
        </div>
        <div class="footerSection">
          <h3>Informacje</h3>
          <a href="/privacypolicy">Polityka Prywatności</a>
          <a href="/acknowledgements">Podziękowania</a>
          <a href="/standards">Standardy ochrony dzieci</a>
        </div>
      </div>
    </footer>
  </body>
  <script src="js/main.js"></script>
  <script src="js/${pagesJS[index]}"></script>
</html>
  `);
});

app.use((req, res) => {
	const ipAddress = req.ip; // Upewniamy się, że IP jest bezpieczne

	// Sprawdzamy, czy istnieje już wpis dla tego IP w bazie danych
	con.query(
		`SELECT ID, heat FROM blacklisted WHERE IP = ?`,
		[ipAddress],
		function (err, result, fields) {
			if (err) throw err;
			if (result.length === 0) {
				// Jeśli nie istnieje, tworzymy nowy wpis
				con.query(
					`INSERT INTO blacklisted(IP, heat) VALUES (?, 1)`,
					[ipAddress],
					function (err, result, fields) {
						if (err) throw err;
						console.log("Dodano nowy wpis do bazy danych.");
					}
				);
			} else {
				// Jeśli istnieje, zwiększamy wartość "heat" o 1
				const newHeat = result[0].heat + 1;
				con.query(
					`UPDATE blacklisted SET heat = ? WHERE IP = ?`,
					[newHeat, ipAddress],
					function (err, result, fields) {
						if (err) throw err;
						console.log("Zaktualizowano liczbę odwiedzin dla tego IP.");
					}
				);
			}
		}
	);

	// Odsyłamy stronę 404, jeśli żądanie nie zostało obsłużone wcześniej
	res.status(404).send(error_page("404", "Not Found"));
});

app.listen(3000, () => console.log("API is running on port 3000..."));
module.exports = { con, token, safetytoken };
