const SYMBOL_DEFINITIONS = [
  { emoji: "🍒", label: "Cherry", background: "#D32F2F" },
  { emoji: "🍋", label: "Lemon", background: "#FBC02D", textColor: "#3E2723" },
  { emoji: "🍇", label: "Grapes", background: "#673AB7" },
  { emoji: "🍉", label: "Watermelon", background: "#00897B" },
  { emoji: "⭐", label: "Star", background: "#FFD54F", textColor: "#5D4037" },
  { emoji: "🔔", label: "Bell", background: "#FF7043" },
  { emoji: "💎", label: "Gem", background: "#00ACC1" },
  { emoji: "7️⃣", label: "Lucky Seven", background: "#C2185B" },
  { emoji: "🍀", label: "Clover", background: "#43A047" },
  { emoji: "💰", label: "Jackpot", background: "#6D4C41" },
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
const reels = [...document.querySelectorAll(".reel")];

const baseSpinDuration = 2200; // Minimum spin duration in milliseconds
const reelDelay = 450; // Delay between reels stopping
const tickInterval = 80; // Interval for symbol updates

let isSpinning = false;
let intervalHandles = [];

function chooseRandomImage() {
  const index = Math.floor(Math.random() * SYMBOL_IMAGES.length);
  return SYMBOL_IMAGES[index];
}

function applyImage(reel, image) {
  const img = reel.querySelector("img");
  img.src = image.src;
  img.alt = image.alt;
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
    statusOutput.textContent = "Press space or click the button to play again!";
  }
}

function handleKeydown(event) {
  if (event.code === "Space") {
    event.preventDefault();
    startSpin();
  }
}

spinButton.addEventListener("click", startSpin);
window.addEventListener("keydown", handleKeydown);

// Preload each reel with a symbol so they are never empty
reels.forEach((reel) => applyImage(reel, chooseRandomImage()));
