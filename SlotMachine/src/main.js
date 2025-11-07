import "./style.css";

const IMAGE_DIR = "./images/";
const IMAGE_FILES = [
  "icon01.png",
  "icon02.png",
  "icon03.png",
  "icon04.png",
  "icon05.png",
  "icon06.png",
  "icon07.png",
  "icon08.png",
  "icon09.png",
  "icon10.png"
];

// 若文件名不同，按实际 PNG 名称修改上面的数组即可。
const imagePaths = IMAGE_FILES.map((file) => `${IMAGE_DIR}${file}`);

const spinButton = document.getElementById("spin-button");
const statusOutput = document.getElementById("status");
const reels = [...document.querySelectorAll(".reel")];

const baseSpinDuration = 2200; // 最短持续时间（毫秒）
const reelDelay = 450; // 各转轮停下的延迟
const tickInterval = 80; // 图片切换间隔

let isSpinning = false;
let intervalHandles = [];

function chooseRandomImage() {
  const index = Math.floor(Math.random() * imagePaths.length);
  return { src: imagePaths[index], index };
}

function applyImage(reel, image) {
  const img = reel.querySelector("img");
  img.src = image.src;
  img.alt = `符号 ${image.index + 1}`;
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
