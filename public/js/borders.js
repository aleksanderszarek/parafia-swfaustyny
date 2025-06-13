const loadingContainer = document.getElementById("loadingContainer");
const rateLimit = document.getElementById("rateLimitContainer");
rateLimit.style.display = "none";

async function getAnnouncement() {
  try {
    const response = await fetch(
      "https://swietafaustyna.pl/api/v3/borders/getCurrentBorders"
    );
    if (!response.ok) {
      loadingContainer.style.display = "none";
      rateLimit.style.display = "block";
      return;
    }
    const data = await response.json();
    const bordersContainer = document.getElementById("bordersContainer");
    if (bordersContainer) {
      bordersContainer.innerHTML = `
        <h2>Teren naszej parafii</h2>
        <br />
        ${data.borders.replaceAll("<br>", "<br><hr>")}
        `;
    } else {
      loadingContainer.style.display = "none";
      // location.href = "https://swietafaustyna.pl/borders";
    }
  } catch (err) {
    loadingContainer.style.display = "none";
    // location.href = "https://swietafaustyna.pl/borders";
  }
  loadingContainer.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  getAnnouncement();
});
