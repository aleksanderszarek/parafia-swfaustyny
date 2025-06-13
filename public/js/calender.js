const date = new Date();
const day = date.getDate();
const month = date.getMonth() + 1;
const year = date.getFullYear();
const title = document.getElementById("title");
try {
  if (month === 11) {
    document.getElementById(`o${day}`).setAttribute("id", "today");
    title.textContent = `Do adwentu zostało ${33 - day} dni!`;
  } else if (day < 3) {
    document.getElementById(`n${day}`).setAttribute("id", "today");
    title.textContent = `Do adwentu zostało ${3 - day} dni!`;
  } else {
    document.getElementById(`n${day}`).setAttribute("id", "today");
    if (day < 24) {
      title.textContent = `Do Bożego Narodzenia zostało ${24 - day} dni!`;
    } else if (day === 24) {
      title.textContent = `Dziś Wigilia Bożego Narodzenia, wesołych świąt!`;
    } else {
      title.textContent = `Wesołych Świąt Bożego Narodzenia!`;
    }
  }
} catch (error) {
  location.href = "/christmas_end";
}
