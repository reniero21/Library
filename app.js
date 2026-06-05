const API = "https://openlibrary.org/search.json";
/* ================= LOGIN SYSTEM ================= */

const loginScreen = document.getElementById("loginScreen");
const loginBtn = document.getElementById("loginBtn");
const username = document.getElementById("username");
const password = document.getElementById("password");
const loginError = document.getElementById("loginError");

/* demo user */
const DEMO_USER = {
  username: "admin",
  password: "1234"
};

loginBtn.onclick = () => {

  const user = users.find(
    u => u.username === username.value &&
         u.password === password.value
  );

  if (user) {
    localStorage.setItem("loggedIn", "true");
    loginScreen.style.display = "none";
    loginError.textContent = "";

    learnUser(username.value); // AI suggestions
  } else {
    loginError.textContent = "Invalid username or password";
  }
};

/* login action */
loginBtn.onclick = () => {
  if(
    username.value === DEMO_USER.username &&
    password.value === DEMO_USER.password
  ){
    localStorage.setItem("loggedIn", "true");
    loginScreen.style.display = "none";
    loginError.textContent = "";
  } else {
    loginError.textContent = "Invalid username or password";
  }
};

/* logout function */
function logout(){
  localStorage.removeItem("loggedIn");
  location.reload();
}
/* ================= CREATE ACCOUNT SYSTEM ================= */

const registerScreen = document.getElementById("registerScreen");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const backToLogin = document.getElementById("backToLogin");
const createAccountBtn = document.getElementById("createAccountBtn");

const newUser = document.getElementById("newUser");
const newPass = document.getElementById("newPass");
const registerMsg = document.getElementById("registerMsg");

/* stored users */
let users = JSON.parse(localStorage.getItem("users")) || [
  { username: "admin", password: "1234" }
];

/* SHOW REGISTER */
showRegisterBtn.onclick = () => {
  registerScreen.style.display = "flex";
  loginScreen.style.display = "none";
};

/* BACK TO LOGIN */
backToLogin.onclick = () => {
  registerScreen.style.display = "none";
  loginScreen.style.display = "flex";
};

/* CREATE ACCOUNT */
createAccountBtn.onclick = () => {
  const usernameVal = newUser.value.trim();
  const passwordVal = newPass.value.trim();

  if (!usernameVal || !passwordVal) {
    registerMsg.textContent = "Please fill all fields";
    return;
  }

  const exists = users.find(u => u.username === usernameVal);

  if (exists) {
    registerMsg.textContent = "Username already exists";
    return;
  }

  users.push({
    username: usernameVal,
    password: passwordVal
  });

  localStorage.setItem("users", JSON.stringify(users));

  registerMsg.style.color = "#22c55e";
  registerMsg.textContent = "Account created successfully!";

  setTimeout(() => {
    registerScreen.style.display = "none";
    loginScreen.style.display = "flex";
    registerMsg.textContent = "";
  }, 1200);
};
/* ================= DOM ================= */
const DOM = {
  input: document.getElementById("searchInput"),
  btn: document.getElementById("searchBtn"),
  grid: document.getElementById("grid"),
  loader: document.getElementById("loader"),
  modal: document.getElementById("modal"),
  modalBody: document.getElementById("modalBody"),
  closeModal: document.getElementById("closeModal"),
  favBtn: document.getElementById("favBtn"),
  favPanel: document.getElementById("favPanel"),
  favList: document.getElementById("favList"),
  favCount: document.getElementById("favCount"),
  themeBtn: document.getElementById("themeBtn"),
  closeFavBtn: document.getElementById("closeFavBtn")
  
};

/* ================= STATE ================= */
let books = [];
let favs = JSON.parse(localStorage.getItem("favs")) || [];
let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];

/* ================= INIT ================= */
updateFavUI();
renderRecentSearches();
loadTheme();
loadTrending();

/* ================= SEARCH ================= */
async function search(q) {
  if (!q) return;

  saveRecentSearch(q);

  DOM.loader.classList.remove("hidden");

  try {
    const res = await fetch(`${API}?q=${encodeURIComponent(q)}&limit=20`);
    const data = await res.json();

    books = data.docs || [];
    renderBooks();

  } catch (err) {
    console.error("Search error:", err);
  }

  DOM.loader.classList.add("hidden");
}

/* ================= TRENDING BOOKS ================= */
async function loadTrending() {
  try {
    const res = await fetch(`${API}?q=best&limit=10`);
    const data = await res.json();

    const trendingBooks = data.docs || [];
    renderTrending(trendingBooks);

  } catch (err) {
    console.error("Trending error:", err);
  }
}

function renderTrending(list) {
  const trendingHTML = `
    <div class="trending glass" style="margin:20px;padding:15px;">
      <h3>🔥 Trending Books</h3>
      <div class="grid">
        ${list.map(b => {
          const cover = b.cover_i
            ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
            : "https://via.placeholder.com/200x300";

          return `
            <div class="card glass" onclick="openBook('${b.key}')">
              <img src="${cover}">
              <p>${b.title}</p>
              <small>${b.author_name?.[0] || "Unknown"}</small>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;

  DOM.grid.insertAdjacentHTML("beforebegin", trendingHTML);
}

/* ================= RECENT SEARCHES ================= */
function saveRecentSearch(q) {
  recentSearches = [q, ...recentSearches.filter(x => x !== q)].slice(0, 5);

  localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  renderRecentSearches();
}

function renderRecentSearches() {
  const containerId = "recentBox";
  let box = document.getElementById(containerId);

  if (!box) {
    box = document.createElement("div");
    box.id = containerId;
    box.className = "glass";
    box.style.margin = "10px 20px";
    box.style.padding = "10px";
    DOM.input.parentElement.appendChild(box);
  }

  if (recentSearches.length === 0) {
    box.innerHTML = "";
    return;
  }

  box.innerHTML = `
    <p style="opacity:0.7;margin-bottom:8px;">🕘 Recent Searches</p>
    ${recentSearches.map(q => `
      <button onclick="quickSearch('${q}')"
        style="margin:4px;padding:6px 10px;border-radius:20px;border:none;cursor:pointer;">
        ${q}
      </button>
    `).join("")}
  `;
}

/* ================= RENDER BOOKS ================= */
function renderBooks() {
  DOM.grid.innerHTML = books.map(b => {

    const cover = b.cover_i
      ? `https://covers.openlibrary.org/b/id/${b.cover_i}-M.jpg`
      : "https://via.placeholder.com/200x300";

    const bookObj = {
      key: b.key,
      title: b.title || "No Title",
      author: b.author_name?.[0] || "Unknown",
      cover
    };

    return `
      <div class="card glass" onclick="openBook('${b.key}')">
        <img src="${cover}">
        <p>${bookObj.title}</p>
        <small>${bookObj.author}</small>

        <button onclick='event.stopPropagation();toggleFav(${JSON.stringify(bookObj)})'>
          ⭐ Favorite
        </button>
      </div>
    `;
  }).join("");
}
/* ================= AI LOGIN SUGGESTIONS ================= */

const suggestBox = document.getElementById("suggestBox");
const loginHint = document.getElementById("loginHint");

/* store "AI learned usernames" */
let knownUsers = JSON.parse(localStorage.getItem("knownUsers")) || [
  "admin",
  "user",
  "student"
];

/* update suggestions while typing */
username.addEventListener("input", () => {
  const value = username.value.toLowerCase();

  if (!value) {
    suggestBox.innerHTML = "";
    loginHint.textContent = "Try: admin or student";
    return;
  }

  const matches = knownUsers.filter(u =>
    u.toLowerCase().startsWith(value)
  );

  if (matches.length === 0) {
    suggestBox.innerHTML = "";
    loginHint.textContent = "No matches found — AI learning new pattern...";
    return;
  }

  suggestBox.innerHTML = matches.map(u => `
    <div class="suggest-item" onclick="selectUser('${u}')">
      👤 ${u}
    </div>
  `).join("");

  loginHint.textContent = "AI suggestion based on previous logins";
});

/* click suggestion */
function selectUser(name){
  username.value = name;
  suggestBox.innerHTML = "";
}

/* learn user after login success */
function learnUser(name){
  if(!knownUsers.includes(name)){
    knownUsers.push(name);
    localStorage.setItem("knownUsers", JSON.stringify(knownUsers));
  }
}

/* ================= MODAL ================= */
async function openBook(key) {
  try {
    const res = await fetch(`https://openlibrary.org${key}.json`);
    const data = await res.json();

    DOM.modalBody.innerHTML = `
      <h2>${data.title}</h2>
      <p>${data.description?.value || data.description || "No description available."}</p>
    `;

    DOM.modal.classList.remove("hidden");

  } catch {
    DOM.modalBody.innerHTML = "<p>Failed to load book details.</p>";
  }
}

/* ================= FAVORITES ================= */
function toggleFav(book) {
  const exists = favs.some(f => f.key === book.key);

  if (exists) {
    favs = favs.filter(f => f.key !== book.key);
  } else {
    favs.unshift(book);
  }

  favs = [...new Map(favs.map(b => [b.key, b])).values()];

  saveFavs();
  updateFavUI();
}

function removeFav(key) {
  favs = favs.filter(f => f.key !== key);
  saveFavs();
  updateFavUI();
}

function saveFavs() {
  localStorage.setItem("favs", JSON.stringify(favs));
}

function updateFavUI() {
  DOM.favCount.innerText = favs.length;
  renderFavs();
}

function renderFavs() {
  if (favs.length === 0) {
    DOM.favList.innerHTML = "<p>No favorites yet ❤️</p>";
    return;
  }

  DOM.favList.innerHTML = favs.map(f => `
    <div class="fav-item glass">
      <img src="${f.cover}" style="width:40px;height:60px;border-radius:6px;object-fit:cover;">

      <div style="flex:1;margin-left:10px;">
        <strong>${f.title}</strong><br>
        <small>${f.author}</small>
      </div>

      <button onclick="removeFav('${f.key}')">❌</button>
    </div>
  `).join("");
}

/* ================= QUICK SEARCH ================= */
function quickSearch(q) {
  DOM.input.value = q;
  search(q);
}

/* ================= EVENTS ================= */
DOM.btn.onclick = () => search(DOM.input.value);

DOM.closeModal.onclick = () =>
  DOM.modal.classList.add("hidden");

DOM.favBtn.onclick = () =>
  DOM.favPanel.classList.toggle("hidden");

if (DOM.closeFavBtn) {
  DOM.closeFavBtn.onclick = () =>
    DOM.favPanel.classList.add("hidden");
}

/* ================= THEME ================= */
DOM.themeBtn.onclick = () => {
  const isLight = document.body.classList.toggle("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
};

function loadTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light") document.body.classList.add("light");
}

/* ================= OUTSIDE CLICK CLOSE ================= */
document.addEventListener("click", (e) => {
  if (e.target === DOM.favPanel) {
    DOM.favPanel.classList.add("hidden");
  }
});
checkLogin();

if(
  username.value === DEMO_USER.username &&
  password.value === DEMO_USER.password
){
  localStorage.setItem("loggedIn", "true");
  loginScreen.style.display = "none";
  loginError.textContent = "";

  learnUser(username.value); // 👈 ADD THIS
}
