const SYMBOL_DEFINITIONS = [
  { emoji: "🍒", label: "樱桃", background: "#D32F2F" },
  { emoji: "🍋", label: "柠檬", background: "#FBC02D", textColor: "#3E2723" },
  { emoji: "🍇", label: "葡萄", background: "#673AB7" },
  { emoji: "🍉", label: "西瓜", background: "#00897B" },
  { emoji: "⭐", label: "星星", background: "#FFD54F", textColor: "#5D4037" },
  { emoji: "🔔", label: "铃铛", background: "#FF7043" },
  { emoji: "💎", label: "宝石", background: "#00ACC1" },
  { emoji: "7️⃣", label: "幸运 7", background: "#C2185B" },
  { emoji: "🍀", label: "四叶草", background: "#43A047" },
  { emoji: "💰", label: "钱袋", background: "#6D4C41" },
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
    alt: `${definition.label}符号`,
  };
}

const SYMBOL_IMAGES = SYMBOL_DEFINITIONS.map(createSymbolImage);

const spinButton = document.getElementById("spin-button");
const statusOutput = document.getElementById("status");
const reels = [...document.querySelectorAll(".reel")];

const baseSpinDuration = 2200; // 最短持续时间（毫秒）
const reelDelay = 450; // 各转轮停下的延迟
const tickInterval = 80; // 图片切换间隔

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
  statusOutput.textContent = "祝你好运！";
  intervalHandles = [];

  reels.forEach((reel) => reel.classList.add("is-spinning"));

  reels.forEach((reel, i) => {
    // 初始随机图片
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

  // 当最后一个转轮停止时，复位状态
  const allStopped = reels.every((r) => !r.classList.contains("is-spinning"));
  if (allStopped) {
    isSpinning = false;
    statusOutput.textContent = "再次按空格或点击按钮继续！";
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

// 首次加载时预置一组符号，避免空白
reels.forEach((reel) => applyImage(reel, chooseRandomImage()));
