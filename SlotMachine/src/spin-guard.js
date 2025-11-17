(() => {
  const isSpinPage = /(?:^|\/)spin\.html?$/i.test(window.location.pathname);
  if (isSpinPage) return;

  const toast = document.createElement("div");
  toast.className = "spin-guard-toast";
  toast.textContent = "It's not time to spin yet.";
  document.body.appendChild(toast);

  const style = document.createElement("style");
  style.textContent = `
    .spin-guard-toast {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%) scale(0.95);
      padding: 1rem 1.8rem;
      background: rgba(220, 30, 50, 0.9);
      color: #fff;
      font-weight: 700;
      font-size: clamp(1rem, 3vw, 1.35rem);
      text-align: center;
      border-radius: 18px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.25s ease, transform 0.25s ease;
      z-index: 99999;
      letter-spacing: 0.05em;
    }
    .spin-guard-toast.is-visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  `;
  document.head.appendChild(style);

  let hideTimer = null;
  function showToast() {
    clearTimeout(hideTimer);
    toast.classList.add("is-visible");
    hideTimer = setTimeout(() => toast.classList.remove("is-visible"), 2000);
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      showToast();
    }
  });
})();
