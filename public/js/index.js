const loadingContainer = document.getElementById("loadingContainer");
const rateLimit = document.getElementById("rateLimitContainer");
rateLimit.style.display = "none";

async function getAnnouncement() {
  try {
    const response = await fetch(
      "https://swietafaustyna.pl/api/v3/announcements/getCurrentAnnouncement"
    );
    if (!response.ok) {
      loadingContainer.style.display = "none";
      rateLimit.style.display = "block";
      return;
    }
    const data = await response.json();

    // Assuming all arrays (title, description, and date) have the same length
    for (let i = 0; i < data.title.length; i++) {
      const announcementContainer = document.createElement("div");
      document.querySelector("main").appendChild(announcementContainer);
      announcementContainer.className = "message-container";
      announcementContainer.id = "announcementContainer";

      if (announcementContainer) {
        announcementContainer.innerHTML = `
          <h4>${data.description[i]}</h4>
          <h2 class="announcement-title">${data.date[i]}</h2>
          <p class="announcement-content">${data.title[i]}</p>
        `;
      } else {
        loadingContainer.style.display = "none";
      }
    }
  } catch (err) {
    console.error("Fetch error:", err);
    loadingContainer.style.display = "none";
  }

  loadingContainer.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  getAnnouncement();
});
