const OUTCOME_DEFINITIONS = [
  {
    code: "H1B",
    full: "H-1B Specialty Occupation Visa",
    message: "Congratulations on being selected.",
  },
  {
    code: "RFE",
    full: "Request For Evidence",
    message: "Additional evidence needed.",
  },
  {
    code: "PEN",
    full: "Pending Review Notice",
    message: "Your case is currently under review.",
  },
  {
    code: "QUE",
    full: "Queue Placement Confirmation",
    message: "You are now 42,763rd in the national queue.",
  },
  {
    code: "CAP",
    full: "Annual Cap Reached Notification",
    message: "Quota reached. Try again next fiscal year.",
  },
  {
    code: "LOS",
    full: "Lottery Outcome: System Loss",
    message: "A system error occurred.",
  },
  {
    code: "NOT",
    full: "Not Selected for Further Processing",
    message: "Your H-1B registration was not chosen for this fiscal year.",
  },
  {
    code: "DEN",
    full: "Denial of Petition",
    message: "USCIS reviewed the case and did not approve the H-1B petition.",
  },
  {
    code: "EXP",
    full: "Expired Case Status",
    message: "The petition is no longer active.",
  },
  {
    code: "REJ",
    full: "Rejection Due to Formal Error",
    message: "The petition was rejected because of a mistake or missing information.",
  },
  {
    code: "OUT",
    full: "Out-of-Cap Notification",
    message: "The petition is not subject to the H-1B cap.",
  },
  {
    code: "FAI",
    full: "Failure of Random Allocation",
    message: "The petition was not selected in the H-1B lottery.",
  },
  {
    code: "RNG",
    full: "Random Number Generator",
    message: "USCIS assigned a random number for processing.",
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
const spinHint = document.getElementById("spin-hint");
const reels = [...document.querySelectorAll(".reel")];
const glyphs = reels.map((reel) => reel.querySelector(".glyph"));

const baseSpinDuration = 2200;
const reelDelay = 450;
const tickInterval = 80;

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
  statusOutput.textContent = "Rolling...";

  // Hide the spin hint when spinning starts
  if (spinHint) {
    spinHint.classList.add("hidden");
  }

  const reelOffsets = [0, 800, 1800];
  reels.forEach((reel, index) => {
    reel.classList.add("is-spinning");
    setGlyph(index, randomChar());
    intervalHandles[index] = setInterval(() => {
      setGlyph(index, randomChar());
    }, tickInterval);

    const offset = reelOffsets[index] ?? reelOffsets[reelOffsets.length - 1];
    const stopAfter =
      baseSpinDuration + offset + Math.random() * reelDelay;
    setTimeout(() => stopReel(index), stopAfter);
  });
}

function stopReel(index) {
  if (intervalHandles[index]) {
    clearInterval(intervalHandles[index]);
    intervalHandles[index] = null;
  }
  const reel = reels[index];
  if (reel) {
    reel.classList.add("has-glow");
    reel.classList.remove("is-spinning");
  }
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
    window.location.href = "./result.html";
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
