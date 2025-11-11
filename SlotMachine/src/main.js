const SYMBOL_DEFINITIONS = [
  { emoji: "A", label: "Cherry", background: "#D32F2F" },
  { emoji: "B", label: "Lemon", background: "#FBC02D", textColor: "#3E2723" },
  { emoji: "C", label: "Grapes", background: "#673AB7" },
  { emoji: "D", label: "Watermelon", background: "#00897B" },
  { emoji: "E", label: "Star", background: "#FFD54F", textColor: "#5D4037" },
  { emoji: "F", label: "Bell", background: "#FF7043" },
  { emoji: "G", label: "Gem", background: "#00ACC1" },
  { emoji: "H", label: "Lucky Seven", background: "#C2185B" },
  { emoji: "I", label: "Clover", background: "#43A047" },
  { emoji: "J", label: "Jackpot", background: "#6D4C41" },
];

const SYMBOL_SIZE = 144;
const SYMBOL_FONT = "72px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";


function createSymbolImage(definition, index) {
  const canvas = document.createElement("canvas");
  canvas.width = SYMBOL_SIZE;
  canvas.height = SYMBOL_SIZE;

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = definition.background;
  ctx.fillRect(0, 0, SYMBOL_SIZE, SYMBOL_SIZE);

  ctx.font = SYMBOL_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = definition.textColor || "#FFFFFF";
  ctx.fillText(definition.emoji, SYMBOL_SIZE / 2, SYMBOL_SIZE / 2 + 4);

  return {
    src: canvas.toDataURL("image/png"),
    index,
    alt: `${definition.label} symbol`,
  };
}

const SYMBOL_IMAGES = SYMBOL_DEFINITIONS.map(createSymbolImage);

const spinButton = document.getElementById("spin-button");
const statusOutput = document.getElementById("status");
const coinHint = document.getElementById("coin-hint");
const reels = [...document.querySelectorAll(".reel")];

const baseSpinDuration = 2200; // Minimum spin duration in milliseconds
const reelDelay = 450; // Delay between reels stopping
const tickInterval = 80; // Interval for symbol updates

// detect different states
let canCoin = true;
let isSpinning = false;
let canSpin = true; // spin is no longer gated by coin
let intervalHandles = [];

function chooseRandomImage() {
  const index = Math.floor(Math.random() * SYMBOL_IMAGES.length);
  return SYMBOL_IMAGES[index];
}

function applyImage(reel, image) {
  const img = reel.querySelector("img");
  img.src = image.src;
  img.alt = image.alt;
  try { img.dataset.index = String(image.index); } catch (_) {}
}

function startSpin() {
  if (isSpinning) {
    return;
  }
  isSpinning = true;
  statusOutput.textContent = "Good luck!";
  intervalHandles = [];

  reels.forEach((reel) => reel.classList.add("is-spinning"));

  reels.forEach((reel, i) => {
    // Seed with a random symbol immediately
    applyImage(reel, chooseRandomImage());

    const handle = setInterval(() => {
      applyImage(reel, chooseRandomImage());
    }, tickInterval);

    intervalHandles.push(handle);

    const stopAfter =
      baseSpinDuration + i * reelDelay + Math.random() * reelDelay;

    setTimeout(() => stopReel(i), stopAfter);
  });
}

function stopReel(reelIndex) {
  const handle = intervalHandles[reelIndex];
  clearInterval(handle);

  const reel = reels[reelIndex];
  reel.classList.remove("is-spinning");
  applyImage(reel, chooseRandomImage());

  // When the final reel stops, reset the state
  const allStopped = reels.every((r) => !r.classList.contains("is-spinning"));
  if (allStopped) {
    isSpinning = false;
    // Collect final symbols
    const finals = reels.map((r) => {
      const im = r.querySelector('img');
      return {
        index: parseInt(im?.dataset?.index || '-1', 10),
        label: (im?.alt || '').replace(/\s*symbol$/i, '')
      };
    });
    const win = finals.length === 3 && finals[0].index === finals[1].index && finals[1].index === finals[2].index && finals[0].index >= 0;
    try {
      localStorage.setItem('lastSpin', JSON.stringify({
        symbols: finals.map(f => f.index),
        labels: finals.map(f => f.label),
        win,
        ts: Date.now()
      }));
    } catch (_) {}
    statusOutput.textContent = win ? "Jackpot!" : "Done";
    // Navigate to result page after a short pause
    setTimeout(() => { try { window.location.href = '/result.html'; } catch(_) { window.location.href = './result.html'; } }, 600);
  }
}

function handleKeydown(event) {
  if (event.code === "Space") {
    event.preventDefault();
    startSpin();
  }
}

if (spinButton) spinButton.addEventListener("click", startSpin);
window.addEventListener("keydown", handleKeydown);

// Preload each reel with a symbol so they are never empty
reels.forEach((reel) => applyImage(reel, chooseRandomImage()));

// =============================
// Raspberry Pi button integration
// =============================
// Configurable endpoints (default to same host, port 5000)
const PI_WS_URL = (window.PI_WS_URL || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PI_WS_URL))
  || `ws://${location.hostname}:5000/ws`;
const PI_HTTP_BASE = (window.PI_HTTP_BASE || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PI_HTTP_BASE))
  || `http://${location.hostname}:5000`;

let piWS;
let lastPiPressed = false; // for edge detection

function handlePiState(state) {
  if (!state) return;

  // Handle coin pulse: keep hint but no longer gate spinning
  if (typeof state.coin === 'boolean' && state.coin && canCoin) {
    if (coinHint) coinHint.textContent = "Coin detected";
    canCoin = false; // basic debounce for hint
  }

  // Handle button press with rising edge: not pressed -> pressed
  if (typeof state.pressed === 'boolean') {
    if (state.pressed && !lastPiPressed) {
      startSpin();
    }
    lastPiPressed = !!state.pressed;
  }
}

function connectPiWS() {
  try {
    piWS = new WebSocket(PI_WS_URL);
    piWS.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        handlePiState(data);
      } catch (_) {}
    };
    piWS.onclose = () => {
      // Reconnect after short delay
      setTimeout(connectPiWS, 1000);
    };
  } catch (_) {
    // Retry later if constructor throws
    setTimeout(connectPiWS, 2000);
  }
}

async function pollPi() {
  // Fallback polling; requires CORS if cross-origin
  try {
    const resp = await fetch(`${PI_HTTP_BASE}/api/state`, { cache: 'no-cache' });
    if (!resp.ok) return;
    const data = await resp.json();
    handlePiState(data);
  } catch (_) {
    // Ignore errors (e.g., CORS or offline)
  }
}

// Start WS and a light polling fallback
connectPiWS();
setInterval(pollPi, 1000);
