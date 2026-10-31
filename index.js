
// ============================================================
// Config
// ============================================================
const HANDS = {
  sten: "Sten",
  saks: "Saks",
  papir: "Papir"
};

const HAND_KEYS = Object.keys(HANDS);

const BEATS = {
  sten: "saks",
  saks: "papir",
  papir: "sten"
};

const DEALS = [
  {
    title: "Gratis Cheeseburger",
    desc: "En klassisk cheeseburger fra McDonald's",
    code: "CHEESE1",
    image: "https://s7d1.scene7.com/is/image/mcdonalds/mcdonalds_cheeseburger:1-3-product-tile-desktop?wid=829&hei=515&dpr=off"
  },
  {
    title: "Gratis Pommes Frites",
    desc: "Få en portion pommes frites på huset",
    code: "POMMES1",
    image: "https://s7d1.scene7.com/is/image/mcdonalds/LARGE%20FRIES%20ALC-1:product-header-desktop?wid=1894&hei=1040&dpr=off"
  },
  {
    title: "Gratis McFlurry",
    desc: "Vælg mellem dine favoritvarianter",
    code: "MCFLURRY1",
    image: "https://s7d1.scene7.com/is/image/mcdonalds/MCFLURRY%20DAIM%20ALC:product-header-desktop?wid=1894&hei=1040&dpr=off"
  },
  {
    title: "En tur til Island",
    desc: "Fly + Hotel",
    code: "ISLAND1",
    image: "https://www.sorensrejser.dk/upload/images/destinationer/island/island.jpg"
  }
];

const BDAY_DEAL = {
  title: "Gratis XL Frappe",
  desc: "Fødselsdagsgave – hent den i din lokale McDonalds",
  code: "BDAYFRAPPE"
};

const ALL_DEALS = [...DEALS];

// Sandsynligheder: sejr, uafgjort – resten er tab
const WIN_CHANCE = 0.65;
const DRAW_CHANCE = 0.2;

const COUNTDOWN = ["PAPIR", "SAKS", "STEN", "VIS!"];
const TICK_MS = 650;
const RESULT_DELAY_MS = 450;

const CONFETTI = {
  count: 28,
  colors: ["#DA291C", "#FFC72C", "#ddd"]
};


// ============================================================
// Ikoner
// ============================================================
const HAND_PATHS = {
  sten: [
    "✊"
  ],
  saks: [
    "✌️"
  ],
  papir: [
    "✋"
  ]
};

const BURGER_SVG = `
  <svg width="90" height="90" viewBox="0 0 24 24" fill="none" stroke-linecap="round">
    <path d="M4 9a8 5 0 0 1 16 0z" fill="#F5A623" stroke="#D98A0F" stroke-width="1.5"/>
    <path d="M3 12h18" stroke="#7B4B1E" stroke-width="3"/>
    <path d="M4 14c2 1.5 4-1.5 6 0s4-1.5 6 0 3-1 4 0" stroke="#4C9A2A" stroke-width="1.8"/>
    <path d="M4 17a8 3.5 0 0 0 16 0z" fill="#F5A623" stroke="#D98A0F" stroke-width="1.5"/>
  </svg>
`;

const handIcon = (hand, size = 64) => `
  <span style="
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: ${size}px;
    line-height: 1;
  ">
    ${HAND_PATHS[hand][0]}
  </span>
`;


// ============================================================
// Små hjælpere
// ============================================================
const $ = selector => document.querySelector(selector);
const $$ = selector => document.querySelectorAll(selector);

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

function restartAnimation(el) {
  el.style.animation = "none";
  void el.offsetWidth;
  el.style.animation = "";
}

function setHtml(ids, html) {
  ids.forEach(id => {
    const el = $(id);
    if (el) el.innerHTML = html;
  });
}


// ============================================================
// Spil-logik
// ============================================================
function pickHouseHand(player) {
  const r = Math.random();

  if (r < WIN_CHANCE) {
    return BEATS[player];
  }

  if (r < WIN_CHANCE + DRAW_CHANCE) {
    return player;
  }

  return HAND_KEYS.find(h => BEATS[h] === player);
}

function getOutcome(player, house) {
  if (player === house) return "draw";

  return BEATS[player] === house
    ? "win"
    : "lose";
}


// ============================================================
// MyDeals
// ============================================================
const STORAGE_KEY = "mydeals";

let savedCodes = [];

try {
  savedCodes = JSON.parse(
    localStorage.getItem(STORAGE_KEY)
  ) || [];
} catch {
  savedCodes = [];
}

const isSaved = code => savedCodes.includes(code);

function saveDeal(code) {
  if (isSaved(code)) return;

  savedCodes.push(code);

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(savedCodes)
    );
  } catch {}

  updateDealCount();
}

function updateDealCount() {
  const counter = $("#deal-count");

  if (counter) {
    counter.textContent = savedCodes.length || "";
  }
}

function renderDeals() {
  const list = $("#deals-list");

  if (!list) return;

  const deals = savedCodes
    .map(code => ALL_DEALS.find(d => d.code === code))
    .filter(Boolean);

  list.innerHTML = deals.length
    ? deals.map(deal => `
        <div class="deal">
          <h2>${deal.title}</h2>
          <p>${deal.desc}</p>
          <button class="code" data-copy="${deal.code}">
            ${deal.code}
          </button>
        </div>
      `).join("")
    : `
        <p>
          Ingen deals endnu. Vind en i Sten, saks, papir
          eller tilføj en fra forsiden.
        </p>
      `;
}


// ============================================================
// Deal buttons
// ============================================================
// Only Island can be added
const addButtonFromWin = (code) => {
  if (isSaved(code)) {
    return `
      <button class="btn add-btn" disabled>
        ${isTripToIsland(code) ? "Tilføjet til MyDeals." : "Udsolgt :("}
      </button>
    `;
  }

  return `
    <button class="btn yellow-btn add-btn" data-add="${code}">
      Tilføj til MyDeals
    </button>
  `;
};

const isTripToIsland = (code) => code === "ISLAND1";

// ============================================================
// Result views
// ============================================================
const lower = hand => HANDS[hand].toLowerCase();

const RESULT_VIEWS = {
  draw: ({ player }) => `
    <h1>Uafgjort! 🤝</h1>
    <p>I valgte begge ${lower(player)}. Prøv igen!</p>
  `,

  lose: ({ house }) => `
    <h1>Øv, du tabte 😢</h1>
    <p>Huset valgte ${lower(house)}. Prøv igen!</p>
  `,

  win: () => `
    <h1 class="pop">Du vandt! 🎉</h1>
    <p>Vælg en af dine deals:</p>

<div class="deals-list">
  ${ALL_DEALS.map(deal => `
    <div class="deal">
      <div class="offer">
        <img src="${deal.image}" alt="${deal.title}">
      </div>

      <h2>${deal.title}</h2>
      <p>${deal.desc}</p>

      ${addButtonFromWin(deal.code)}
    </div>
  `).join("")}
</div>
  `
};


// ============================================================
// Hand buttons
// ============================================================
const handButton = (hand, i) => `
  <button class="hand-btn"
          style="animation-delay:${i * 0.12}s"
          aria-label="${HANDS[hand]}"
          data-play="${hand}">
    ${handIcon(hand, 52)}
  </button>
`;


// ============================================================
// Skærme & effekter
// ============================================================
function show(screenId) {
  $$(".screen").forEach(screen => {
    screen.classList.toggle(
      "hidden",
      screen.id !== screenId
    );
  });

  $$(".nav button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.go === screenId
    );
  });

  if (screenId === "deals") {
    renderDeals();
  }
}


// ============================================================
// Confetti
// ============================================================
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
      animationDelay: `${((i * 29) % 100) / 50}s`
    });

    container.prepend(piece);
  }
}


// ============================================================
// Countdown
// ============================================================
async function runCountdown() {
  const counter = $("#count");

  if (!counter) return;

  for (const word of COUNTDOWN) {
    counter.textContent = word;
    restartAnimation(counter);
    await sleep(TICK_MS);
  }

  await sleep(RESULT_DELAY_MS);
}


// ============================================================
// Play
// ============================================================
async function play(player) {
  const house = pickHouseHand(player);
  const outcome = getOutcome(player, house);

  const message = $("#msg");

  setHtml(["#p1", "#p2"], handIcon("sten", 72));
  setHtml(["#h1", "#h2"], handIcon("sten", 72));

  show("shaking");

  ["#p1", "#p2", "#h1", "#h2"].forEach(selector => {
    $(selector)?.classList.add("shake");
  });

  await new Promise(resolve => setTimeout(resolve, 1350));

  ["#p1", "#p2", "#h1", "#h2"].forEach(selector => {
    $(selector)?.classList.remove("shake");
  });

  setHtml(["#p1", "#p2"], handIcon(player, 72));
  setHtml(["#h1", "#h2"], handIcon(house, 72));

  if (message) {
    message.innerHTML = RESULT_VIEWS[outcome]({
      player,
      house
    });
  }

  show("result");
}


// ============================================================
// Click handlers
// ============================================================
const ACTIONS = {
  go: screenId => show(screenId),

  play: hand => play(hand),

  add: (code, el) => {
    saveDeal(code);

    if (isTripToIsland(code)) {
      el.textContent = "Tilføjet til MyDeals.";
    } else {
      el.textContent = "Udsolgt :(";
    }

    el.disabled = true;
    el.classList.remove("yellow-btn");
},

  copy: async (code, el) => {
    try {
      await navigator.clipboard.writeText(code);
      el.textContent = "KOPIERET ✓";
    } catch {
      el.textContent = "KUNNE IKKE KOPIERE";
    }
  }
};


// ============================================================
// Global click handler
// ============================================================
document.addEventListener("click", e => {
  for (const [name, handler] of Object.entries(ACTIONS)) {
    const el = e.target.closest(`[data-${name}]`);

    if (el) {
      return handler(el.dataset[name], el);
    }
  }
});


// ============================================================
// Init
// ============================================================
$$("[data-icon=burger]").forEach(el => {
  el.insertAdjacentHTML("afterbegin", BURGER_SVG);
});

$$("[data-hand]").forEach(el => {
  el.innerHTML = handIcon(el.dataset.hand);
});

$$(".confetti").forEach(addConfetti);

updateDealCount();

$("#hands").innerHTML = HAND_KEYS
  .map(handButton)
  .join("");
