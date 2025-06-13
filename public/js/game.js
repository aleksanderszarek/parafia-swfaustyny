let player = "";
let roundCount = 0;
let timerInterval;
const topics = [
  "Sporty",
  "Inside Joki",
  "Modzieżowe słowa",
  "Jedzenie",
  "Kolory",
  "Memy",
  "Filmy i Seriale",
  "Muzyka",
  "Zwierzęta",
  "Kraje",
  "Gry wideo",
  "Gry planszowe",
  "Technologia",
  "Natura",
  "Wynalazki",
  "Superbohaterowie",
  "Święta i Okazje",
  "Części w komputerze",
  "Sztuka",
  "Powiedzenia",
  "Psy",
];
let p1l = [];
let p2l = [];
function randomizeTopic() {
  alert(
    "Twoim tematem jest: " + topics[Math.floor(Math.random() * topics.length)]
  );
}
async function startGame(role) {
  //! Set player role (player 1 or 2)
  player = role;

  //! Upload player data (nick and color)
  const requestData = {
    nick: localStorage.getItem("username") || "Default User",
    color: localStorage.getItem("color") || "white",
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };

  // Wysłanie nicku gracza na odpowiedni endpoint
  const url =
    player == 1
      ? "https://swietafaustyna.pl/api/v3/borders/player1-nick"
      : "https://swietafaustyna.pl/api/v3/borders/player2-nick";

  await fetch(url, requestOptions);

  //! Wyświetl nick gracza w grze
  document.querySelector("#usernameDisplay").innerText =
    localStorage.getItem("username") || "Default User";

  // Czekaj na przeciwnika
  await waitForOpponentNickname();

  // Po otrzymaniu nicku przeciwnika wylosuj temat i rozpocznij nową rundę
  randomizeTopic();
  startNewRound();
}
async function waitForOpponentNickname() {
  // Ustawienie odpowiedniego endpointu w zależności od gracza
  const opponentNickUrl =
    player == 1
      ? "https://swietafaustyna.pl/api/v3/borders/player2-nick-req"
      : "https://swietafaustyna.pl/api/v3/borders/player1-nick-req";
  document.querySelector("#game_menu").style.display = "none";
  document.querySelector("#pairing").style.display = "flex";
  let time = 30;
  while (true) {
    document.querySelector("#timer2").innerText = time;
    try {
      // Pobranie danych o nicku przeciwnika
      const response = await fetch(opponentNickUrl);
      const result = await response.json();

      if (result.nick !== "no") {
        document.querySelector("#pairing").style.display = "none";
        // Wyświetl nick i kolor przeciwnika
        document.querySelector(
          "#opponentDisplay"
        ).innerHTML = `<p style="color:${result.color}">${result.nick}</p>`;
        break; // Przerywa pętlę po odnalezieniu nicku
      }
      // Oczekiwanie 1 sekundy przed ponownym sprawdzeniem
      if (time > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        time--;
      } else {
        document.querySelector("#game_menu").style.display = "flex";
        document.querySelector("#pairing").style.display = "none";
        alert("Nie można połączyć z przeciwnikiem, spróbuj ponownie później!");
      }
    } catch (error) {
      if (time > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        time--;
      } else {
        document.querySelector("#game_menu").style.display = "flex";
        document.querySelector("#pairing").style.display = "none";
        alert("Nie można połączyć z przeciwnikiem, spróbuj ponownie później!");
      }
    }
  }
}

function startNewRound() {
  document.querySelector("#game_lose").style.display = "none";
  document.querySelector("#game_win").style.display = "none";
  document.querySelector("#game_start").style.display = "none";
  document.querySelector("#during_game").style.display = "flex";

  roundCount++;
  if (roundCount > 10) {
    document.querySelector("#game_lose").style.display = "flex";
    document.querySelector("#during_game").style.display = "none";
    return;
  }

  document.querySelector("#roundCount").innerText = String(roundCount) + "/10";
  document.querySelector("#input").value = "";

  let timer = 30;
  document.querySelector("#timer").innerText = String(timer);

  // Clear any previous timer intervals
  if (timerInterval) clearInterval(timerInterval);

  // Start a new timer countdown
  timerInterval = setInterval(() => {
    timer--;
    document.querySelector("#timer").innerText = String(timer);
    if (timer === 0) {
      clearInterval(timerInterval);
      document.querySelector("#game_lose").style.display = "flex";
      document.querySelector("#during_game").style.display = "none";
    }
  }, 1000);
}

function send() {
  if (document.querySelector("#input").value == "") return;
  for (let i = 0; i < p1l.length; i++)
    if (
      document.querySelector("#input").value.toLowerCase() ==
      p1l[i].toLowerCase()
    )
      return;
  for (let i = 0; i < p2l.length; i++)
    if (
      document.querySelector("#input").value.toLowerCase() ==
      p2l[i].toLowerCase()
    )
      return;
  const requestData = {
    text: document.querySelector("#input").value,
  };

  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };

  if (player == 1) {
    fetch(
      "https://swietafaustyna.pl/api/v3/borders/player1-submit",
      requestOptions
    ).then(() => {
      document.querySelector("#during_game").style.display = "none";
      pollForAnswer(1);
    });
  } else {
    fetch(
      "https://swietafaustyna.pl/api/v3/borders/player2-submit",
      requestOptions
    ).then(() => {
      document.querySelector("#during_game").style.display = "none";
      pollForAnswer(2);
    });
  }
}

function pollForAnswer(player) {
  const url =
    player === 1
      ? "https://swietafaustyna.pl/api/v3/borders/player2-req"
      : "https://swietafaustyna.pl/api/v3/borders/player1-req";

  fetch(url).then(async (response) => {
    const result = await response.json();
    if (result.text !== "no") {
      p1l.push(result.text);
      p2l.push(document.querySelector("#input").value);
      document.querySelector("#p2l").innerText = String(p2l).replaceAll(
        ",",
        ", "
      );
      document.querySelector("#p1l").innerText = String(p1l).replaceAll(
        ",",
        ", "
      );
      if (
        result.text.toLowerCase() ===
        document.querySelector("#input").value.toLowerCase()
      ) {
        document.querySelector("#game_win").style.display = "flex";
        document.querySelector("#during_game").style.display = "none";
        if (!localStorage.getItem("coins")) localStorage.setItem("coins", 0);
        localStorage.setItem(
          "money",
          parseInt(localStorage.getItem("coins")) + 15 - roundCount
        );
      } else {
        startNewRound();
      }
    } else {
      setTimeout(() => pollForAnswer(player), 1000); // Retry after 1 second
    }
  });
}
if (localStorage.getItem("username")) {
  document.querySelector("#login").style.display = "none";
  document.querySelector("#game_menu").style.display = "flex";
}
function saveUsername() {
  localStorage.setItem("username", document.querySelector("#name_input").value);
  document.querySelector("#login").style.display = "none";
  document.querySelector("#game_menu").style.display = "flex";
}
document.querySelector("#bal").innerText = `Sklep | Balans: $${
  localStorage.getItem("coins") || 0
}`;
