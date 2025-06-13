function addAnnouncement() {
  return alert(
    "Połączenie z bazą danych zostało przerwane! Spróbuj ponownie później lub zaloguj się ponownie!"
  );
  const text = document.getElementById("announcementDescription");
  const title = document.getElementById("announcementTitle");
  const date = document.getElementById("announcementDate");
  const quote = document.getElementById("announcementQuote");
  const quoteColor = document.getElementById("quoteColor");
  const quoteSize = document.getElementById("quoteSize");
  if (!date.value.match(/^\d{2}\.\d{2}\.\d{4}$/))
    return alert("Niepoprawny format daty! Użyj: XX.XX.XXXX").then(() =>
      openAddAnnouncementPopup()
    );
  let _description = text.value;
  _description = _description.replaceAll(/\n/g, "<br>");
  let description =
    _description +
    `<br><${quoteSize.options[quoteSize.selectedIndex].value} style="color: ${
      quoteColor.options[quoteColor.selectedIndex].value
    }"> ${quote.value} </${quoteSize.options[quoteSize.selectedIndex].value}>`;
  const requestData = {
    title: description,
    description: title.value,
    date: date.value,
    authToken: token,
    rawText: _description,
    quote: quote.value,
    quoteColor: quoteColor.options[quoteColor.selectedIndex].value,
    quoteSize: quoteSize.options[quoteSize.selectedIndex].value,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  fetch(
    "https://swietafaustyna.pl/api/v3/announcements/postAnnouncement",
    requestOptions
  ).then((response) => {
    if (!response.ok) {
      serverError.style.display = "block";
      success.style.display = "none";
      panel.style.display = "none";
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionSafetyToken");
      localStorage.removeItem("sessionUsername");
      localStorage.removeItem("sessionPassword");
      localStorage.removeItem("sessionPermissionLevel");
      return;
    }
    return response.json();
  });
  success.style.display = "block";
}
function editAnnouncementS() {
  const text = document.getElementById("announcementDescription2");
  const title = document.getElementById("announcementTitle2");
  const date = document.getElementById("announcementDate2");
  const quote = document.getElementById("announcementQuote2");
  const quoteColor = document.getElementById("quoteColor2");
  const quoteSize = document.getElementById("quoteSize2");
  const id = list2.value;
  if (!id) {
    return alert("Wybierz ogłoszenie, które chcesz zedytować!").then(() =>
      openAddAnnouncementPopup()
    );
  }
  if (!date.value.match(/^\d{2}\.\d{2}\.\d{4}$/))
    return alert("Niepoprawny format daty! Użyj: XX.XX.XXXX").then(() =>
      openAddAnnouncementPopup()
    );
  let _description = text.value;
  _description = _description.replaceAll(/\n/g, "<br>");
  let description =
    _description +
    `<br><${quoteSize.options[quoteSize.selectedIndex].value} style="color: ${
      quoteColor.options[quoteColor.selectedIndex].value
    }"> ${quote.value} </${quoteSize.options[quoteSize.selectedIndex].value}>`;
  const requestData = {
    title: description,
    description: title.value,
    date: date.value,
    authToken: token,
    rawText: _description,
    quote: quote.value,
    quoteColor: quoteColor.options[quoteColor.selectedIndex].value,
    quoteSize: quoteSize.options[quoteSize.selectedIndex].value,
    id: id,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  fetch(
    "https://swietafaustyna.pl/api/v3/announcements/editAnnouncement",
    requestOptions
  ).then((response) => {
    if (!response.ok) {
      serverError.style.display = "block";
      success.style.display = "none";
      panel.style.display = "none";
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionSafetyToken");
      localStorage.removeItem("sessionUsername");
      localStorage.removeItem("sessionPassword");
      localStorage.removeItem("sessionPermissionLevel");
      return;
    }
    return response.json();
  });
  success.style.display = "block";
}
async function editAnnouncement() {
  document.querySelector("#editAnnouncementPopup").style.display = "block";
  fetch("https://swietafaustyna.pl/api/v3/announcements/getAnnouncements")
    .then(async (response) => {
      if (!response.ok) {
        console.error(err);
        serverError.style.display = "block";
        success.style.display = "none";
        panel.style.display = "none";
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("sessionSafetyToken");
        localStorage.removeItem("sessionUsername");
        localStorage.removeItem("sessionPassword");
        localStorage.removeItem("sessionPermissionLevel");
        return;
      }
      const result = await response.json();

      result.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.ID;
        opt.text = option.Announcement_description;

        list2.add(opt);
      });
    })
    .then(() => loadAnn2());
}
function deleteAnnouncemenets() {
  const requestData = {
    title: "Ogłoszenie zostało usunięte!",
    description: " ",
    date: "🗑️",
    authToken: token,
    rawText: " ",
    quote: " ",
    quoteColor: "red",
    quoteSize: "h5",
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  fetch(
    "https://swietafaustyna.pl/api/v3/announcements/postAnnouncement",
    requestOptions
  ).then((response) => {
    if (!response.ok) {
      console.error(err);
      serverError.style.display = "block";
      success.style.display = "none";
      panel.style.display = "none";
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionSafetyToken");
      localStorage.removeItem("sessionUsername");
      localStorage.removeItem("sessionPassword");
      localStorage.removeItem("sessionPermissionLevel");
      return;
    }
    return response.json();
  });
  success.style.display = "block";
}
const list = document.querySelector("#loadAnnouncement");
const list2 = document.querySelector("#loadAnnouncement2");
function openAddAnnouncementPopup() {
  const popup = document.getElementById("addAnnouncementPopup");
  popup.style.display = "block";
  fetch("https://swietafaustyna.pl/api/v3/announcements/getAnnouncements").then(
    async (response) => {
      if (!response.ok) {
        console.error(err);
        serverError.style.display = "block";
        success.style.display = "none";
        panel.style.display = "none";
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("sessionSafetyToken");
        localStorage.removeItem("sessionUsername");
        localStorage.removeItem("sessionPassword");
        localStorage.removeItem("sessionPermissionLevel");
        return;
      }
      const result = await response.json();

      result.forEach((option) => {
        const opt = document.createElement("option");
        opt.value = option.ID;
        opt.text = option.Announcement_description;

        list.add(opt);
      });
    }
  );
}
function loadAnn() {
  if (list.value == "new") {
    document.getElementById("announcementDescription").value = "";
    document.getElementById("announcementTitle").value = "";
    document.getElementById("announcementQuote").value = "";
    document.getElementById("quoteColor").value = "red";
    document.getElementById("quoteSize").value = "h4";
    document.getElementById("announcementDate").value = "";
    return;
  }
  fetch(
    `https://swietafaustyna.pl/api/v3/announcements/getAnnouncementRawData/${list.value}`
  ).then(async (response) => {
    if (!response.ok) {
      console.error(err);
      serverError.style.display = "block";
      success.style.display = "none";
      panel.style.display = "none";
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionSafetyToken");
      localStorage.removeItem("sessionUsername");
      localStorage.removeItem("sessionPassword");
      localStorage.removeItem("sessionPermissionLevel");
      return;
    }
    const data = await response.json();
    const text = document.getElementById("announcementDescription");
    const title = document.getElementById("announcementTitle");
    const quote = document.getElementById("announcementQuote");
    const quoteColor = document.getElementById("quoteColor");
    const quoteSize = document.getElementById("quoteSize");
    const date = document.getElementById("announcementDate");
    const _text = data.rawText.replaceAll("<br>", "\n");
    text.value = _text;
    title.value = data.description;
    quote.value = data.quote;
    date.value = data.date;
    for (let i = 0; i < quoteColor.options.length; i++) {
      if (quoteColor.options[i].value === data.quoteColor) {
        quoteColor.options[i].selected = true;
        break;
      }
    }
    for (let i = 0; i < quoteSize.options.length; i++) {
      if (quoteSize.options[i].value === data.quoteSize) {
        quoteSize.options[i].selected = true;
        break;
      }
    }
  });
}
function loadAnn2() {
  fetch(
    `https://swietafaustyna.pl/api/v3/announcements/getAnnouncementRawData/${list2.value}`
  ).then(async (response) => {
    if (!response.ok) {
      console.error(err);
      serverError.style.display = "block";
      success.style.display = "none";
      panel.style.display = "none";
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionSafetyToken");
      localStorage.removeItem("sessionUsername");
      localStorage.removeItem("sessionPassword");
      localStorage.removeItem("sessionPermissionLevel");
      return;
      return;
    }
    const data = await response.json();
    const text = document.getElementById("announcementDescription2");
    const title = document.getElementById("announcementTitle2");
    const quote = document.getElementById("announcementQuote2");
    const quoteColor = document.getElementById("quoteColor2");
    const quoteSize = document.getElementById("quoteSize2");
    const date = document.getElementById("announcementDate2");
    const _text = data.rawText.replaceAll("<br>", "\n");
    text.value = _text;
    title.value = data.description;
    quote.value = data.quote;
    date.value = data.date;
    for (let i = 0; i < quoteColor.options.length; i++) {
      if (quoteColor.options[i].value === data.quoteColor) {
        quoteColor.options[i].selected = true;
        break;
      }
    }
    for (let i = 0; i < quoteSize.options.length; i++) {
      if (quoteSize.options[i].value === data.quoteSize) {
        quoteSize.options[i].selected = true;
        break;
      }
    }
  });
}
function closeAddAnnouncementPopup() {
  const popup = document.getElementById("addAnnouncementPopup");
  popup.style.display = "none";
}
function closeBordersPopup() {
  document.getElementById("editBordersPopup").style.display = "none";
}
function setBorders() {
  const borders = document.getElementById("bordersField");

  const requestData = {
    borders: borders.value.replaceAll("\n", "<br>"),
    authToken: token,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  fetch(
    "https://swietafaustyna.pl/api/v3/borders/editBorders",
    requestOptions
  ).then((response) => {
    if (!response.ok) {
      serverError.style.display = "block";
      success.style.display = "none";
      panel.style.display = "none";
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionSafetyToken");
      localStorage.removeItem("sessionUsername");
      localStorage.removeItem("sessionPassword");
      localStorage.removeItem("sessionPermissionLevel");
      return;
    }
    return response.json();
  });
  success.style.display = "block";
}
async function editBorders() {
  try {
    const response = await fetch(
      "https://swietafaustyna.pl/api/v3/borders/getCurrentBorders"
    );
    if (!response.ok) {
      location.href = "adminpanel";
    }
    const data = await response.json();
    document.querySelector("#editBordersPopup").style.display = "block";
    document.querySelector("#bordersField").value = data.borders.replaceAll(
      "<br>",
      "\n"
    );
  } catch (err) {
    console.error(err);
    serverError.style.display = "block";
    success.style.display = "none";
    panel.style.display = "none";
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionSafetyToken");
    localStorage.removeItem("sessionUsername");
    localStorage.removeItem("sessionPassword");
    localStorage.removeItem("sessionPermissionLevel");
    return;
  }
}
function unlock() {
  const requestData = {
    authToken: safetyToken,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  fetch("https://swietafaustyna.pl/api/v3/safety/unlock", requestOptions).then(
    (response) => {
      if (!response.ok) {
        console.error(err);
        serverError.style.display = "block";
        success.style.display = "none";
        panel.style.display = "none";
        localStorage.removeItem("sessionToken");
        localStorage.removeItem("sessionSafetyToken");
        localStorage.removeItem("sessionUsername");
        localStorage.removeItem("sessionPassword");
        localStorage.removeItem("sessionPermissionLevel");
        return;
        return;
      }
      return response.json();
    }
  );
  success.style.display = "block";
}
function lock() {
  const requestData = {
    authToken: safetyToken,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  fetch(
    "https://swietafaustyna.pl/api/v3/safety/lockdown",
    requestOptions
  ).then((response) => {
    if (!response.ok) {
      console.error(err);
      serverError.style.display = "block";
      success.style.display = "none";
      panel.style.display = "none";
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionSafetyToken");
      localStorage.removeItem("sessionUsername");
      localStorage.removeItem("sessionPassword");
      localStorage.removeItem("sessionPermissionLevel");
      return;
    }
    return response.json();
  });
  success.style.display = "block";
}
async function authenticate() {
  username = document.getElementById("username").value;
  password = document.getElementById("password").value;
  const rData = {
    username: username,
    password: password,
  };
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rData),
  };
  try {
    const response = await fetch(
      "https://swietafaustyna.pl/api/v3/accounts/authenticate/",
      options
    );

    if (!response.ok) {
      location.href = "adminpanel";
    }

    const data = await response.json();
    accountType = data.accountPermissions;
    loggedAs.innerText = `${username}`;
    token = data.authToken;
    safetyToken = data.safetyToken;
    if (accountType == -1) {
      wrongPassword.style.display = "block";
      return;
    }
  } catch (error) {
    loginform.style.display = "none";
    serverError.style.display = "block";
    success.style.display = "none";
    panel.style.display = "none";
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionSafetyToken");
    localStorage.removeItem("sessionUsername");
    localStorage.removeItem("sessionPassword");
    localStorage.removeItem("sessionPermissionLevel");
    return;
  }
  loginform.style.display = "none";
  panel.style.display = "block";
  savePassword.style.display = "block";
  showData();
}
function accountInfo() {
  document.querySelector("#accountInfo").style.display = "block";
  document.querySelector("#usernameField").innerText = username || "Demo Mode";
  document.querySelector("#permissionField").innerText = `Poziom uprawnień: ${
    accountType || 0
  }/2`;
}
let token,
  safetyToken,
  username,
  password,
  accountType,
  pageCount,
  currentPage = 0,
  ipCount,
  currentIP = 0,
  ipsFilter = "total_requests";
const panel = document.querySelector("main");
const wrongPassword = document.querySelector("#wrongPassword");
const serverError = document.querySelector("#serverError");
const loginform = document.getElementById("login");
const loginbtn = document.getElementById("loginbtn");
const success = document.getElementById("success");
const loggedAs = document.querySelector("#account h2");
const insufficientPermissions = document.getElementById(
  "insufficientPermissions"
);
const pages = document.querySelector("#pagesContainer");
const ips = document.querySelector("#ipsContainer");
const savePassword = document.getElementById("savePassword");
document.querySelector("#wip").style.display = "none";
document.querySelector("#accountInfo").style.display = "none";
insufficientPermissions.style.display = "none";
panel.style.display = "none";
wrongPassword.style.display = "none";
serverError.style.display = "none";
success.style.display = "none";
savePassword.style.display = "none";
pages.style.display = "none";
ips.style.display = "none";

loginbtn.addEventListener("click", authenticate);
async function retriveSession() {
  const requestData = {
    authToken: token,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };

  try {
    const response = await fetch(
      "https://swietafaustyna.pl/api/v3/accounts/validate",
      requestOptions
    );

    if (!response.ok) {
      //! TODO
      alert("Wystąpił nieznany !");
      return;
    }

    const data = await response.json();
    if (!data.valid) {
      loginform.style.display = "none";
      serverError.style.display = "block";
      success.style.display = "none";
      panel.style.display = "none";
      localStorage.removeItem("sessionToken");
      localStorage.removeItem("sessionSafetyToken");
      localStorage.removeItem("sessionUsername");
      localStorage.removeItem("sessionPassword");
      localStorage.removeItem("sessionPermissionLevel");
    }
  } catch (error) {
    console.error(err);
    serverError.style.display = "block";
    success.style.display = "none";
    panel.style.display = "none";
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionSafetyToken");
    localStorage.removeItem("sessionUsername");
    localStorage.removeItem("sessionPassword");
    localStorage.removeItem("sessionPermissionLevel");
    return;
  }
}
async function displayPages(start, end) {
  const cont = document.querySelector("#pagesContent");
  document.querySelector("p#pageCount").innerText = `${
    start + 1
  } - ${end} / ${pageCount}`;
  cont.innerHTML = "";
  const requestData = {
    authToken: safetyToken,
    start: start,
    end: end,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  const response = await fetch(
    "https://swietafaustyna.pl/api/v3/userdata/pagevisits",
    requestOptions
  );

  if (!response.ok) {
    console.error(err);
    serverError.style.display = "block";
    success.style.display = "none";
    panel.style.display = "none";
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionSafetyToken");
    localStorage.removeItem("sessionUsername");
    localStorage.removeItem("sessionPassword");
    localStorage.removeItem("sessionPermissionLevel");
    return;
  }
  const data = await response.json();
  data.forEach((dat) => {
    const element = document.createElement("div");
    element.innerHTML = `<b>${dat.url}</b>: ${dat.v}`;
    element.className = "page-content";
    cont.appendChild(element);
  });
}
async function _pages() {
  pages.style.display = "block";
  const requestData = {
    authToken: safetyToken,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  const response = await fetch(
    "https://swietafaustyna.pl/api/v3/userdata/ips_count",
    requestOptions
  );

  if (!response.ok) {
    console.error(err);
    serverError.style.display = "block";
    success.style.display = "none";
    panel.style.display = "none";
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionSafetyToken");
    localStorage.removeItem("sessionUsername");
    localStorage.removeItem("sessionPassword");
    localStorage.removeItem("sessionPermissionLevel");
    return;
  }
  const data = await response.json();
  pageCount = data[0].cnt;
  displayPages(0, 30);
}
async function displayIPS(start, end) {
  currentIP = start;
  const cont = document.querySelector("#ipContent");
  document.querySelector("p#ipsCount").innerText = `${
    start + 1
  } - ${end} / ${ipCount}`;
  cont.innerHTML = "";
  const requestData = {
    authToken: safetyToken,
    start: start,
    end: end,
    order_by: ipsFilter,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  const response = await fetch(
    "https://swietafaustyna.pl/api/v3/userdata/ips",
    requestOptions
  );

  if (!response.ok) {
    console.error(err);
    serverError.style.display = "block";
    success.style.display = "none";
    panel.style.display = "none";
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionSafetyToken");
    localStorage.removeItem("sessionUsername");
    localStorage.removeItem("sessionPassword");
    localStorage.removeItem("sessionPermissionLevel");
    return;
  }
  const data = await response.json();
  data.forEach((dat) => {
    const element = document.createElement("div");
    element.innerHTML = `<div class="ip-content"><button class="submit-btn" style="background-color:red" onclick="const requestData = {authToken: safetyToken, ip: '${dat.IP}'}; const requestOptions = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestData), }; fetch( 'https://swietafaustyna.pl/api/v3/userdata/ban', requestOptions); success.style.display = 'block';">BAN</button>
    <div class="info-section">
      <div class="info-label">${dat.last_request_time}</div>
      <div class="ip-data">${dat.IP}</div>
      <div class="info-value">
        <div class="info-item">${dat.get_requests} | ${dat.post_requests} | ${dat.other_requests} (100)</div>
        <div class="info-item">${dat.most_used_browser} | ${dat.most_used_os} | ${dat.most_requested_url}</div>
      </div>
    </div>
  </div>`;
    element.className = "ips-content";
    cont.appendChild(element);
  });
}
async function _ips() {
  ips.style.display = "block";
  const requestData = {
    authToken: safetyToken,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };
  const response = await fetch(
    "https://swietafaustyna.pl/api/v3/userdata/ips_count",
    requestOptions
  );

  if (!response.ok) {
    console.error(err);
    serverError.style.display = "block";
    success.style.display = "none";
    panel.style.display = "none";
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("sessionSafetyToken");
    localStorage.removeItem("sessionUsername");
    localStorage.removeItem("sessionPassword");
    localStorage.removeItem("sessionPermissionLevel");
    return;
  }
  const data = await response.json();
  ipCount = data[0].cnt;
  displayIPS(0, 30);
}
if (localStorage.getItem("sessionToken")) {
  panel.style.display = "block";
  loginform.style.display = "none";
  token = localStorage.getItem("sessionToken");
  username = localStorage.getItem("sessionUsername");
  password = localStorage.getItem("sessionPassword");
  loggedAs.innerText = `${username}`;
  safetyToken = localStorage.getItem("sessionSafetyToken");
  accountType = localStorage.getItem("sessionPermissionLevel");
  showData();

  retriveSession();
} else {
  document.querySelector("#back").style.display = "none";
}
async function showData() {
  const requestData = {
    authToken: token,
  };
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestData),
  };

  const unique = document.querySelector("#unique");
  const uresponse = await fetch(
    "https://swietafaustyna.pl/api/v3/userdata/unique",
    requestOptions
  );
  if (!uresponse.ok) {
    unique.innerText = "NO PERMISSION";
  }
  const udata = await uresponse.json();
  unique.innerText = udata[0].r;

  const total = document.querySelector("#total");
  const tresponse = await fetch(
    "https://swietafaustyna.pl/api/v3/userdata/total",
    requestOptions
  );
  if (!tresponse.ok) {
    total.innerText = "NO PERMISSION";
  }
  const tdata = await tresponse.json();
  total.innerText = tdata[0].r;

  const bots = document.querySelector("#banned");
  const bresponse = await fetch(
    "https://swietafaustyna.pl/api/v3/userdata/bots",
    requestOptions
  );
  if (!bresponse.ok) {
    bots.innerText = "NO PERMISSION";
  }
  const bdata = await bresponse.json();
  bots.innerText = bdata[0].r;
}
//TODO
document.getElementById("safetySettingsProgressBar").style =
  "width: 64%; background-color: #b39500";
document.querySelector("#safetySettings").style.border = "3px #b39500 solid";
