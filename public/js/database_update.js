/*<div class="popup" style="display: none">
      <div class="popup-content">
        <h1>Placeholder</h1>
        <h2 id="popupText">Placeholder</h2>
        <button
          class="nav-btn"
          onclick="document.getElementsByClassName('popup')[0].style.display = 'none'"
        >
          Zamknij
        </button>
      </div>
    </div>*/

document.querySelector(".popup").style.display = "block";
document.querySelector(".popup-content h1").innerText =
  "Aktualizacja bazy danych";
document.querySelector("#popupText").innerHTML =
  "Trwa aktualizacja bazy danych, oznacza to że zawartość tej strony jest tymczasowo niedostępna. Możesz nadal przeglądać statyczne strony, które nie wymagają dostępu do bazy danych.<br>Za utrudnienia przepraszamy!";
