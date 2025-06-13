const loadingContainer = document.getElementById("loadingContainer");
const rateLimit = document.getElementById("rateLimitContainer");
const error = document.getElementById("errorContainer");
const eventList = document.getElementById("eventList");
const eventContainer = document.getElementById("eventsContainer");
rateLimit.style.display = "none";
error.style.display = "none";
async function fetchAndAppendImage(imageSrc, messageContainer) {
  if (imageSrc.endsWith("data.json")) return;
  try {
    const response = await fetch(`/api/v3/events/getImage/${imageSrc}`);
    if (response.ok) {
      const blob = await response.blob();
      const imgElement = document.createElement("img");
      pictureList.push(imgElement);
      imgElement.className = "eventimg";
      imgElement.src = URL.createObjectURL(blob);
      messageContainer.appendChild(imgElement);
    } else {
      location.href = "/gallery";
    }
  } catch (error) {
    location.href = "/gallery";
  }
}
async function displayEventTitles(data) {
  data.events
    .sort((a, b) => {
      return a.eventTitle.localeCompare(b.eventTitle);
    })
    .forEach((element) => {
      const eventTitle = document.createElement("div");

      eventTitle.className = "event-title";
      eventTitle.innerHTML = `<button class='nav-btn'">${element.eventTitle.slice(
        1
      )}</button>`;
      eventTitle.addEventListener("click", () => {
        eventList.style.display = "none";
        eventContainer.style.display = "block";
        fetchAndDisplayImages(element.eventPictures, eventContainer);
        //? Powrót
        const button = document.createElement("button");
        button.className = "nav-btn";
        eventList.appendChild(button);
        button.innerHTML = `Powrót`;
        eventContainer.appendChild(button);
        button.addEventListener("click", () => {
          eventList.style.display = "flex";
          eventContainer.innerHTML = "";
          eventContainer.style.display = "none";
        });
        //? Poprzedni obraz
        i = 0;
        const pp_button = document.createElement("button");
        pp_button.className = "nav-btn";
        eventList.appendChild(pp_button);
        pp_button.innerHTML = `<-`;
        eventContainer.appendChild(pp_button);
        pp_button.addEventListener("click", () => {
          if (i - 1 >= 0) {
            i--;
            setPicutre();
          } else {
            i = pictureList.length - 1;
            setPicutre();
          }
        });
        //? Następny obraz
        const np_button = document.createElement("button");
        np_button.className = "nav-btn";
        eventList.appendChild(np_button);
        np_button.innerHTML = `->`;
        eventContainer.appendChild(np_button);
        np_button.addEventListener("click", () => {
          if (i + 1 < pictureList.length) {
            i++;
            setPicutre();
          } else {
            i = 0;
            setPicutre();
          }
        });
      });
      eventList.appendChild(eventTitle);
    });
}

async function fetchAndDisplayImages(eventPictures, messageContainer) {
  messageContainer.querySelectorAll(".eventimg").forEach((img) => {
    img.remove();
  });
  //? Wyczyść listę, aby nie było w niej poprzednich obrazów
  pictureList = [];
  let i = 0;
  const overlay = document.getElementById("overlay");
  const progressBar = document.getElementById("progress-bar");
  progressBar.style.transition = "0.1s";
  overlay.style.display = "flex";
  for (const imageSrc of eventPictures.filter(
    (fileName) => fileName !== "data.json"
  )) {
    progressBar.style.width = `${(100 * i) / (eventPictures.length - 1)}%`;
    document.querySelector("#loading h1").innerText = `Wczytywanie obrazu ${
      i + 1
    }/${eventPictures.length}`;
    i++;
    await fetchAndAppendImage(imageSrc, messageContainer);
    setPicutre();
  }
  overlay.style.display = "none";
}
async function fetchEvents() {
  try {
    const response = await fetch(
      "https://swietafaustyna.pl/api/v3/events/getEventList"
    );
    if (!response.ok) {
      loadingContainer.style.display = "none";
      rateLimit.style.display = "block";
      return;
    }

    const data = await response.json();

    displayEventTitles(data);

    const eventImages = document.querySelectorAll(".eventimg");
    eventImages.forEach((img) => {
      img.addEventListener("click", () => {
        fetchAndAppendImage(img.dataset.src, img.parentElement);
      });
    });
  } catch (err) {
    console.error(err);
    loadingContainer.style.display = "none";
    error.style.display = "block";
  }
  loadingContainer.style.display = "none";
}
eventContainer.style.display = "none";
document.addEventListener("DOMContentLoaded", () => {
  fetchEvents();
});

let pictureList = [];
let i = 0;
function setPicutre() {
  pictureList.forEach((picture) => {
    picture.style.display = "none";
  });
  pictureList[i].style.display = "block";
}
