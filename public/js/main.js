Boolean: opened = false;
const menu = document.getElementById("bigMenu");
function hamburgerMenu() {
	document.getElementById("nav-icon1").classList.toggle("open");
	if (opened) {
		menu.style.transform = "Translate(-100%,0%)";
		setTimeout(() => {
			menu.style.display = "none";
		}, 500);
	} else {
		menu.style.display = "flex";
		setTimeout(() => {
			menu.style.transform = "Translate(0%,0%)";
		}, 10);
	}
	opened = !opened;
}
if (screen.width <= 250) {
	document.getElementById("unsupported").style.display = "block";
	document.getElementById("loading").style.display = "none";
} else {
	document.addEventListener("DOMContentLoaded", () => {
		const img = document.getElementsByClassName("bgimg")[0];
		const overlay = document.getElementById("overlay");
		const progressBar = document.getElementById("progress-bar");
		progressBar.style.width = "100%";
		setTimeout(() => {
			if (img.complete) {
				overlay.style.display = "none";
			} else {
				img.addEventListener("load", function () {
					overlay.style.display = "none";
				});
				img.addEventListener("error", function () {
					alert("Coś poszło nie tak, spróbuj ponownie później.");
				});
			}
		}, 100);
	});
}
const cookies = localStorage.getItem("cookiesAccepted", 0);
if (!cookies && cookies == 1) {
	document.querySelector(".popup").style.display = "block";
	document.querySelector(".popup-content h1").innerText = "Pliki cookies";
	const btn2 = document.querySelector("#popup-btn1");
	btn2.addEventListener("click", () => {
		localStorage.setItem("cookiesAccepted", 2);
		document.querySelector(".popup").style.display = "none";
	});

	const btn3 = document.querySelector("#popup-btn2");
	btn3.addEventListener("click", () => {
		localStorage.setItem("cookiesAccepted", 3);
		document.querySelector(".popup").style.display = "none";
	});
}
window.addEventListener("blur", () => {
	document.title = "Czekamy na Ciebie...";
});
window.addEventListener("focus", () => {
	document.title = "Witamy z powrotem!";
	setTimeout(() => {
		document.title = "Parafia Świętej Faustyny w Częstochowie";
	}, 1000);
});
