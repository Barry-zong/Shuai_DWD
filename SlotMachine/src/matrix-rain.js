// Matrix Rain Effect using H1B outcome codes
(function() {
  const canvas = document.getElementById('matrix-rain');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // H1B outcome codes from the slot machine
  const codes = ['H1B', 'RFE', 'PEN', 'QUE', 'CAP', 'LOS', 'NOT', 'DEN', 'EXP', 'REJ', 'OUT', 'FAI', 'RNG'];

  const fontSize = 16;
  const columns = Math.floor(canvas.width / fontSize);

  const drops = [];
  const columnCodes = [];
  const columnCharIndex = [];
  const columnSpeeds = [];
  for (let i = 0; i < columns; i++) {
    drops[i] = Math.random() * -100; // Start at random heights
    columnCodes[i] = codes[Math.floor(Math.random() * codes.length)];
    columnCharIndex[i] = 0;
    columnSpeeds[i] = 0.55 + Math.random() * 0.35; // Slight variation per column
  }

  function draw() {
    // Semi-transparent black to create fade effect
    ctx.fillStyle = 'rgba(37, 60, 97, 0.16)'; // Slightly stronger fade to prevent heavy overlap
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Matrix rain color - light blue/cyan to match theme
    ctx.fillStyle = '#7ab3ff';
    ctx.font = fontSize + 'px "JetBrains Mono", monospace';

    for (let i = 0; i < drops.length; i++) {
      const code = columnCodes[i];
      const text = code.charAt(columnCharIndex[i] % code.length);

      ctx.fillText(text, i * fontSize, drops[i] * fontSize);

      // Reset drop to top when it reaches bottom
      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
        columnCodes[i] = codes[Math.floor(Math.random() * codes.length)];
        columnCharIndex[i] = 0;
        columnSpeeds[i] = 0.55 + Math.random() * 0.35;
      }

      drops[i] += columnSpeeds[i];
      columnCharIndex[i] += columnSpeeds[i];
    }
  }

  // Animate at ~30 FPS for smooth performance
  setInterval(draw, 33);
})();
