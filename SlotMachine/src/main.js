const OUTCOME_DEFINITIONS = [
  {
    code: "H1B",
    full: "H-1B Specialty Occupation Visa",
    // 恭喜，你被系统认可了。
    message: "Congratulations. You have been validated.",
  },
  {
    code: "RFE",
    full: "Request For Evidence",
    // 请补交你存在的证明。
    message: "Please provide additional evidence of your existence.",
  },
  {
    code: "PEN",
    full: "Pending Review Notice",
    // 你的命运正由未知参数审查。
    message: "Your fate is currently under review by unseen parameters.",
  },
  {
    code: "QUE",
    full: "Queue Placement Confirmation",
    // 你现在排在全国第42,763位。
    message: "You are now 42,763rd in the national queue.",
  },
  {
    code: "CAP",
    full: "Annual Cap Reached Notification",
    // 名额已满，祝你明年好运。
    message: "Quota reached. Better luck next fiscal year.",
  },
  {
    code: "LOS",
    full: "Lottery Outcome: System Loss",
    // 系统运行成功，你没中签。
    message: "System executed successfully. You didn't.",
  },
  {
    code: "NOT",
    full: "Not Selected for Further Processing",
    // 感谢参与你组织的不确定性。
    message: "Thank you for participating in structured uncertainty.",
  },
  {
    code: "DEN",
    full: "Denial of Petition",
    // 很遗憾，运气仍然是稀缺资源。
    message: "We regret to inform you that luck remains a scarce resource.",
  },
  {
    code: "EXP",
    full: "Expired Case Status",
    // 等待期间，你的状态已过期。
    message: "Your status has expired while you were waiting.",
  },
  {
    code: "REJ",
    full: "Rejection Due to Formal Error",
    // 你的梦想不符合规定格式。
    message: "Your dream did not meet the required format.",
  },
  {
    code: "OUT",
    full: "Out-of-Cap Notification",
    // 感谢参与，请退出系统。
    message: "Thank you for playing. Please exit the system.",
  },
  {
    code: "FAI",
    full: "Failure of Random Allocation",
    // 失败已成功处理。
    message: "Failure successfully processed.",
  },
  {
    code: "RNG",
    full: "Random Number Generator",
    // 算法已经发话。
    message: "The algorithm has spoken.",
  },
];

const H1B_CODE = "H1B";
const H1B_OUTCOME =
  OUTCOME_DEFINITIONS.find((entry) => entry.code === H1B_CODE) ||
  OUTCOME_DEFINITIONS[0];
const OTHER_OUTCOMES = OUTCOME_DEFINITIONS.filter(
  (entry) => entry.code !== H1B_CODE
);
const AVAILABLE_CHARS = Array.from(
  new Set(OUTCOME_DEFINITIONS.flatMap((item) => item.code.split("")))
);

const DEFAULT_GLYPH = "$";

const spinButton = document.getElementById("spin-button");
const statusOutput = document.getElementById("status");
const coinHint = document.getElementById("coin-hint");
const reels = [...document.querySelectorAll(".reel")];
const glyphs = reels.map((reel) => reel.querySelector(".glyph"));

const baseSpinDuration = 2200;
const reelDelay = 450;
const tickInterval = 80;

let canCoin = true;
let isSpinning = false;
let spinLocked = false;
let intervalHandles = new Array(reels.length).fill(null);
let selectedOutcome = null;
let finalChars = [];

function syncSpinLockState() {
  try {
    spinLocked = localStorage.getItem("spinLocked") === "1";
  } catch (_) {
    spinLocked = false;
  }
  if (spinButton) spinButton.disabled = spinLocked;
  if (spinLocked && statusOutput) {
    statusOutput.textContent = "Spin locked";
  }
}

function randomChar() {
  return AVAILABLE_CHARS[Math.floor(Math.random() * AVAILABLE_CHARS.length)];
}

function setGlyph(reelIndex, char) {
  const glyph = glyphs[reelIndex];
  if (!glyph) return;
  glyph.textContent = char;
  glyph.dataset.char = char;
  reels[reelIndex]?.setAttribute("aria-label", char);
}

function prepareFinalChars(code) {
  const chars = code.split("");
  while (chars.length < reels.length) {
    chars.push(chars[chars.length - 1] || "-");
  }
  return chars;
}

function startSpin() {
  if (isSpinning || spinLocked) return;
  const chance = calculateWinningChance();
  try {
    localStorage.setItem("spinWinChance", String(chance));
  } catch (_) {}
  console.log(
    `[LuckySlot] spin chance => ${(chance * 100).toFixed(1)}% (coins: ${getCoinCount()})`
  );
  const shouldWin = Math.random() < chance;
  if (shouldWin) {
    selectedOutcome = H1B_OUTCOME;
  } else {
    selectedOutcome = chooseRandomOutcome(OTHER_OUTCOMES);
  }
  if (!selectedOutcome) {
    selectedOutcome = H1B_OUTCOME;
  }
  finalChars = prepareFinalChars(selectedOutcome.code);
  isSpinning = true;
  statusOutput.textContent = "Rolling…";

  reels.forEach((reel, index) => {
    reel.classList.add("is-spinning");
    setGlyph(index, randomChar());
    intervalHandles[index] = setInterval(() => {
      setGlyph(index, randomChar());
    }, tickInterval);

    const stopAfter =
      baseSpinDuration + index * reelDelay + Math.random() * reelDelay;
    setTimeout(() => stopReel(index), stopAfter);
  });
}

function stopReel(index) {
  if (intervalHandles[index]) {
    clearInterval(intervalHandles[index]);
    intervalHandles[index] = null;
  }
  reels[index].classList.remove("is-spinning");
  setGlyph(index, finalChars[index] || "-");

  if (intervalHandles.every((handle) => handle === null)) {
    finalizeSpin();
  }
}

function finalizeSpin() {
  isSpinning = false;
  if (!selectedOutcome) return;
  statusOutput.textContent = selectedOutcome.code;

  try {
    localStorage.setItem("spinLocked", "1");
    localStorage.setItem(
      "lastSpin",
      JSON.stringify({
        code: selectedOutcome.code,
        full: selectedOutcome.full,
        message: selectedOutcome.message,
        ts: Date.now(),
      })
    );
  } catch (_) {}
  syncSpinLockState();

  setTimeout(() => {
    try {
      window.location.href = "/result.html";
    } catch (_) {
      window.location.href = "./result.html";
    }
  }, 900);
}

function handleKeydown(event) {
  if (event.code === "Space") {
    event.preventDefault();
    startSpin();
  }
}

if (spinButton) spinButton.addEventListener("click", startSpin);
window.addEventListener("keydown", handleKeydown);

reels.forEach((_, index) => setGlyph(index, DEFAULT_GLYPH));
syncSpinLockState();

const PI_WS_URL =
  window.PI_WS_URL ||
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_PI_WS_URL) ||
  `ws://${location.hostname}:5000/ws`;
const PI_HTTP_BASE =
  window.PI_HTTP_BASE ||
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_PI_HTTP_BASE) ||
  `http://${location.hostname}:5000`;

let piWS;
let lastPiPressed = false;

function handlePiState(state) {
  if (!state) return;

  if (typeof state.coin === "boolean" && state.coin && canCoin) {
    if (coinHint) coinHint.textContent = "Coin detected";
    canCoin = false;
  }

  if (typeof state.pressed === "boolean") {
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
      setTimeout(connectPiWS, 1000);
    };
  } catch (_) {
    setTimeout(connectPiWS, 2000);
  }
}

async function pollPi() {
  try {
    const resp = await fetch(`${PI_HTTP_BASE}/api/state`, {
      cache: "no-cache",
    });
    if (!resp.ok) return;
    const data = await resp.json();
    handlePiState(data);
  } catch (_) {}
}

connectPiWS();
setInterval(pollPi, 1000);

function getPlayerInfo() {
  try {
    return JSON.parse(localStorage.getItem("playerInfo") || "{}") || {};
  } catch (_) {
    return {};
  }
}

function getCoinCount() {
  try {
    const raw = parseInt(localStorage.getItem("premiumCoins") || "0", 10);
    return Number.isFinite(raw) ? Math.max(0, raw) : 0;
  } catch (_) {
    return 0;
  }
}

function chooseRandomOutcome(pool = OUTCOME_DEFINITIONS) {
  const source = pool.length > 0 ? pool : OUTCOME_DEFINITIONS;
  return source[Math.floor(Math.random() * source.length)] || H1B_OUTCOME;
}

function calculateWinningChance() {
  const baseProbability = 15;
  const educationBonusMap = {
    "Below Kindergarten": -40,
    "Elementary School": -20,
    "Middle School": -15,
    "High School": -10,
    "Bachelor's": 0,
    "Master's": 3,
    "PhD": 5,
    "Above PhD": 6,
  };
  const salaryBonusMap = {
    L1: -2,
    L2: 1,
    L3: 3,
    L4: 7,
    L5: 10,
  };
  const fieldBonusMap = {
    STEM: 5,
    Finance: 4,
    Design: 2,
    Research: 2,
    Other: 0,
  };

  const info = getPlayerInfo();
  const coins = getCoinCount();

  if (coins >= 5) {
    return 0.99;
  }

  const eduBonus = educationBonusMap[info.educationLevel] || 0;
  const salBonus = salaryBonusMap[info.wageLevel] || 0;
  const fieldBonus = fieldBonusMap[info.occupationCategory] || 0;
  const coinBonus = Math.max(0, coins) * 1.5;

  let total = baseProbability + eduBonus + salBonus + fieldBonus + coinBonus;
  total = Math.min(90, Math.max(0, total));

  return total / 100;
}
