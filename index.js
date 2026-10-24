// ============================================================
// Config
// ============================================================
const HANDS = { sten: "Sten", saks: "Saks", papir: "Papir" };
const HAND_KEYS = Object.keys(HANDS);
const BEATS = { sten: "saks", saks: "papir", papir: "sten" }; // nøgle slår værdi

const DEALS = [
  { title: "Gratis Frappe", desc: "Vælg mellem alle smagsvarianter", code: "FRAPPE1" },
  { title: "En tur til Island", desc: "Med hele familien 😎", code: "ISLAND24" },
];
const BDAY_DEAL = { title: "Gratis XL Frappe", desc: "Fødselsdagsgave – hent den i din lokale McDonalds", code: "BDAYFRAPPE" };
const ALL_DEALS = [...DEALS, BDAY_DEAL];

// Sandsynligheder: sejr, uafgjort – resten er tab
const WIN_CHANCE = 0.65;
const DRAW_CHANCE = 0.2;

const COUNTDOWN = ["PAPIR", "SAKS", "STEN", "VIS!"];
const TICK_MS = 650;
const RESULT_DELAY_MS = 450;

const CONFETTI = {
  count: 28,
  colors: ["#DA291C", "#FFC72C", "#ddd"],
};

// ============================================================
// Ikoner
// ============================================================
const HAND_PATHS = {
  sten: ["M7 11v5a5 5 0 0 0 10 0v-5", "M7 11V8a2 2 0 0 1 4 0", "M9 8V6a2 2 0 0 1 4 0v2", "M13 8V7a2 2 0 0 1 4 0v4", "M7 11h10"],
  saks: ["M8 12 5 4", "M11 12 14 4", "M8 12v4a4 4 0 0 0 8 0v-2", "M16 14v-2a2 2 0 0 0-4 0"],
  papir: ["M6 11V6a1.5 1.5 0 0 1 3 0v4", "M9 10V4a1.5 1.5 0 0 1 3 0v6", "M12 10V5a1.5 1.5 0 0 1 3 0v6", "M15 11V7a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4 14a1.6 1.6 0 0 1 2.5-2L8 13.5"],
};

const BURGER_SVG = `
  <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke-linecap="round">
    <path d="M4 9a8 5 0 0 1 16 0z" fill="#F5A623" stroke="#D98A0F" stroke-width="1.5"/>
    <path d="M3 12h18" stroke="#7B4B1E" stroke-width="3"/>
    <path d="M4 14c2 1.5 4-1.5 6 0s4-1.5 6 0 3-1 4 0" stroke="#4C9A2A" stroke-width="1.8"/>
    <path d="M4 17a8 3.5 0 0 0 16 0z" fill="#F5A623" stroke="#D98A0F" stroke-width="1.5"/>
  </svg>`;

const handIcon = (hand, size = 64) => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="#FFC72C"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    ${HAND_PATHS[hand].map((d) => `<path d="${d}"/>`).join("")}
  </svg>`;

// ============================================================
// Små hjælpere
// ============================================================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function restartAnimation(el) {
  el.style.animation = "none";
  void el.offsetWidth; // tvinger reflow
  el.style.animation = "";
}

function setHtml(ids, html) {
  ids.forEach((id) => ($(id).innerHTML = html));
}

// ============================================================
// Spil-logik (ingen DOM)
// ============================================================
function pickHouseHand(player) {
  const r = Math.random();
  if (r < WIN_CHANCE) return BEATS[player]; // spilleren slår denne
  if (r < WIN_CHANCE + DRAW_CHANCE) return player;
  return HAND_KEYS.find((h) => BEATS[h] === player); // slår spilleren
}

function getOutcome(player, house) {
  if (player === house) return "draw";
  return BEATS[player] === house ? "win" : "lose";
}

// ============================================================
// Views (returnerer HTML)
// ============================================================
const lower = (hand) => HANDS[hand].toLowerCase();

const RESULT_VIEWS = {
  draw: ({ player }) => `
    <h1>Uafgjort! 🤝</h1>
    <p>I valgte begge ${lower(player)}. Prøv igen!</p>`,

  lose: ({ house }) => `
    <h1>Øv, du tabte 😢</h1>
    <p>Huset valgte ${lower(house)}. Prøv igen!</p>`,

  win: ({ deal }) => {
    return `
      <h1 class="pop">Du vandt! 🎉</h1>
      <div class="deal">
        <h2>${deal.title}</h2>
        <p>${deal.desc}</p>
        <button class="code" data-copy="${deal.code}">${deal.code}</button>
        <p>Tryk for at kopiere · Vis koden i kassen</p>
        ${addButton(deal.code)}
      </div>`;
  },
};

const addButton = (code) => isSaved(code)
  ? `<button class="btn add-btn" disabled>Tilføjet ✓</button>`
  : `<button class="btn yellow-btn add-btn" data-add="${code}">Tilføj til MyDeals</button>`;

const handButton = (hand, i) => `
  <button class="hand-btn" style="animation-delay:${i * 0.12}s"
          aria-label="${HANDS[hand]}" data-play="${hand}">
    ${handIcon(hand, 52)}
  </button>`;

// ============================================================
// Skærme & effekter
// ============================================================
function show(screenId) {
  $$(".screen").forEach((s) => s.classList.toggle("hidden", s.id !== screenId));
  $$(".nav button").forEach((b) => b.classList.toggle("active", b.dataset.go === screenId));
  if (screenId === "deals") renderDeals();
}

// ============================================================
// MyDeals
// ============================================================
const STORAGE_KEY = "mydeals";
let savedCodes = [];
try { savedCodes = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch {}

const isSaved = (code) => savedCodes.includes(code);

function saveDeal(code) {
  if (isSaved(code)) return;
  savedCodes.push(code);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedCodes)); } catch {}
  updateDealCount();
}

function updateDealCount() {
  $("#deal-count").textContent = savedCodes.length || "";
}

function renderDeals() {
  const deals = savedCodes.map((c) => ALL_DEALS.find((d) => d.code === c)).filter(Boolean);
  $("#deals-list").innerHTML = deals.length
    ? deals.map((d) => `
      <div class="deal">
        <h2>${d.title}</h2>
        <p>${d.desc}</p>
        <button class="code" data-copy="${d.code}">${d.code}</button>
      </div>`).join("")
    : `<p>Ingen deals endnu. Vind en i Sten, saks, papir eller tilføj en fra forsiden.</p>`;
}

function addConfetti(container) {
  for (let i = 0; i < CONFETTI.count; i++) {
    const width = 7 + ((i * 7) % 8);
    const piece = document.createElement("span");
    piece.className = "confetto";
    Object.assign(piece.style, {
      left: `${(i * 37 + 4) % 100}%`,
      width: `${width}px`,
      height: `${width / 2.4}px`,
      background: CONFETTI.colors[i % CONFETTI.colors.length],
      animationDuration: `${2 + ((i * 13) % 15) / 10}s`,
      animationDelay: `${((i * 29) % 100) / 50}s`,
    });
    container.prepend(piece);
  }
}

async function runCountdown() {
  const counter = $("#count");
  for (const word of COUNTDOWN) {
    counter.textContent = word;
    restartAnimation(counter);
    await sleep(TICK_MS);
  }
  await sleep(RESULT_DELAY_MS);
}

async function play(player) {
  const house = pickHouseHand(player);
  const outcome = getOutcome(player, house);
  const deal = pickRandom(DEALS);

  setHtml(["#p1", "#p2"], handIcon(player, 72));
  setHtml(["#h1", "#h2"], handIcon(house, 72));
  $("#msg").innerHTML = RESULT_VIEWS[outcome]({ player, house, deal });

  show("shaking");
  await runCountdown();
  show("result");
}

// ============================================================
// Klik-handlers (data-attributter i HTML → funktion her)
// ============================================================
const ACTIONS = {
  go: (screenId) => show(screenId),
  play: (hand) => play(hand),
  add: (code, el) => {
    saveDeal(code);
    el.textContent = "Tilføjet ✓";
    el.disabled = true;
    el.classList.remove("yellow-btn");
  },
  copy: async (code, el) => {
    await navigator.clipboard.writeText(code);
    el.textContent = "KOPIERET ✓";
  },
};

document.addEventListener("click", (e) => {
  for (const [name, handler] of Object.entries(ACTIONS)) {
    const el = e.target.closest(`[data-${name}]`);
    if (el) return handler(el.dataset[name], el);
  }
});

// ============================================================
// Init
// ============================================================
$$("[data-icon=burger]").forEach((el) => el.insertAdjacentHTML("afterbegin", BURGER_SVG));
$$("[data-hand]").forEach((el) => (el.innerHTML = handIcon(el.dataset.hand)));
$$(".confetti").forEach(addConfetti);
updateDealCount();
if (isSaved(BDAY_DEAL.code)) {
  const b = $("[data-add=BDAYFRAPPE]");
  b.textContent = "Tilføjet ✓"; b.disabled = true; b.classList.remove("yellow-btn");
}
$("#hands").innerHTML = HAND_KEYS.map(handButton).join("");