// © Ashok-777
// GitHub: https://github.com/Ashok-777
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreBoard = document.getElementById('scoreBoard');
const overlay = document.getElementById('overlay');
const worldSelectionScreen = document.getElementById('worldSelectionScreen');
const startScreen = document.getElementById('startScreen');
const countdownScreen = document.getElementById('countdownScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreText = document.getElementById('finalScoreText');
const achievementBox = document.getElementById('achievementBox');

const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const exitBtn = document.getElementById('exitBtn');
const worldButtons = document.querySelectorAll('#worldSelect button');

// Game states
let selectedWorld = 1;
let score = 0;
let bestScore = 0;
let running = false;
let paused = false;
let achievementsUnlocked = new Set();
let countdownValue = 3;
let countdownInterval = null;

// Achievements config (score thresholds)
const achievements = [
  {score: 5, text: 'Rising Shadow - Score 5!'},
  {score: 10, text: 'Bounce Master - Score 10!'},
  {score: 20, text: 'Shadow Legend - Score 20!'}
];

// Ball and paddle initial properties
const paddle = {
  width: 120,
  height: 15,
  x: (canvas.width - 120) / 2,
  y: canvas.height - 40,
  speed: 10,
  color: '#d4cfff',
  glowColor: 'rgba(212, 207, 255, 0.8)'
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: 15,
  speedX: 5, // medium speed start
  speedY: 4,
  baseSpeedX: 5,
  baseSpeedY: 4,
  color: '#aabbff',
  glowColor: 'rgba(170, 187, 255, 0.6)'
};

// Background glow circles for world 1 & 2
let glowCircles = [];

// Color pulse state for world 3
let pulseColor = {r: 170, g: 187, b: 255};

// Controls
const keys = {};

// Utils
function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Initialize glow circles (world 1 & 2)
function initGlowCircles(colorBase) {
  glowCircles = [];
  const count = 7;
  for (let i = 0; i < count; i++) {
    glowCircles.push({
      x: randomRange(50, canvas.width - 50),
      y: randomRange(50, canvas.height - 150),
      radius: randomRange(20, 60),
      pulseOffset: Math.random() * 4,
      colorBase: colorBase
    });
  }
}

// Draw background based on selected world & time
function drawBackground(time) {
  if (selectedWorld === 3) {
    // Color pulse world: background changes color on ball hit (pulseColor)
    const grad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 1.5
    );
    grad.addColorStop(0, `rgba(${pulseColor.r}, ${pulseColor.g}, ${pulseColor.b}, 1)`);
    grad.addColorStop(1, `rgba(0, 0, 0, 1)`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    // Classic shadow or Gold World: dark gradient + glowing circles

    // Base dark gradient
    const grad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2
    );
    grad.addColorStop(0, selectedWorld === 2 ? '#4a4400' : '#12122b'); // goldish for world 2
    grad.addColorStop(1, '#000010');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw glowing circles with pulse
    glowCircles.forEach(c => {
      const pulse = Math.sin(time / 500 + c.pulseOffset) * 10 + 25;
      const radius = c.radius + pulse;

      const glowColor = selectedWorld === 2
        ? `rgba(255, 215, 0, 0.15)` // gold world glow
        : `rgba(120, 120, 255, 0.15)`; // classic glow

      const baseColor = selectedWorld === 2 ? '#ffdd55' : '#aabbff';

      // Outer glow
      let gradient = ctx.createRadialGradient(c.x, c.y, radius * 0.2, c.x, c.y, radius);
      gradient.addColorStop(0, `${baseColor}aa`);
      gradient.addColorStop(1, `${glowColor}`);

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}

// Draw paddle
function drawPaddle() {
  // Paddle glow
  ctx.shadowColor = paddle.glowColor;
  ctx.shadowBlur = 15;

  ctx.fillStyle = paddle.color;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

  // Reset shadow for other drawing
  ctx.shadowBlur = 0;
}

// Draw ball
function drawBall() {
  ctx.shadowColor = ball.glowColor;
  ctx.shadowBlur = 20;

  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

// Draw score and level display updates
function updateScoreBoard() {
  scoreBoard.textContent = `Score: ${score} | Best: ${bestScore}`;
  document.getElementById('levelDisplay').textContent = 
    selectedWorld === 1 ? 'Shadow Bounce' :
    selectedWorld === 2 ? 'Gold World' : 'Color Pulse';
}

// Reset ball and paddle position
function resetPositions() {
  paddle.x = (canvas.width - paddle.width) / 2;
  paddle.y = canvas.height - 40;

  ball.x = canvas.width / 2;
  ball.y = canvas.height / 2;

  // Randomize ball direction and speed
  ball.speedX = (Math.random() < 0.5 ? -1 : 1) * ball.baseSpeedX;
  ball.speedY = -ball.baseSpeedY;

  if (selectedWorld === 2) {
    // Slightly faster in Gold World
    ball.speedX *= 1.2;
    ball.speedY *= 1.2;
  }
}

// Handle achievements unlocking
function checkAchievements() {
  achievements.forEach(a => {
    if (score >= a.score && !achievementsUnlocked.has(a.text)) {
      achievementsUnlocked.add(a.text);
      showAchievement(a.text);
    }
  });
}

// Show achievement popup
function showAchievement(text) {
  achievementBox.textContent = text;
  achievementBox.style.opacity = 1;
  achievementBox.style.pointerEvents = 'auto';

  setTimeout(() => {
    achievementBox.style.opacity = 0;
    achievementBox.style.pointerEvents = 'none';
  }, 3000);
}

// Game Over handling
function gameOver() {
  running = false;
  overlay.style.display = 'flex';
  worldSelectionScreen.style.display = 'none';
  startScreen.style.display = 'none';
  countdownScreen.style.display = 'none';
  gameOverScreen.style.display = 'flex';
  finalScoreText.textContent = `Your score: ${score}`;

  if (score > bestScore) {
    bestScore = score;
  }
  updateScoreBoard();
}

// Game loop variables
let lastTime = 0;

// Game loop function
function gameLoop(time = 0) {
  if (!running || paused) {
    lastTime = time;
    requestAnimationFrame(gameLoop);
    return;
  }

  const deltaTime = time - lastTime;
  lastTime = time;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw background with current time for pulse effect
  drawBackground(time);

  // Move paddle
  if (keys['ArrowLeft'] || keys['a']) {
    paddle.x -= paddle.speed;
  }
  if (keys['ArrowRight'] || keys['d']) {
    paddle.x += paddle.speed;
  }

  // Keep paddle inside canvas
  if (paddle.x < 0) paddle.x = 0;
  if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

  // Move ball
  ball.x += ball.speedX;
  ball.y += ball.speedY;

  // Ball collision with walls
  if (ball.x - ball.radius < 0) {
    ball.x = ball.radius;
    ball.speedX *= -1;
  }
  if (ball.x + ball.radius > canvas.width) {
    ball.x = canvas.width - ball.radius;
    ball.speedX *= -1;
  }
  if (ball.y - ball.radius < 0) {
    ball.y = ball.radius;
    ball.speedY *= -1;
  }

  // Ball collision with paddle
  if (
    ball.y + ball.radius > paddle.y &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width &&
    ball.speedY > 0
  ) {
    ball.y = paddle.y - ball.radius;
    ball.speedY *= -1;

    // Increase score
    score++;

    // Increase speed slightly for challenge
    if (selectedWorld !== 3) {
      ball.speedX *= 1.05;
      ball.speedY *= 1.05;
    } else {
      // In color pulse world, pulse ball color randomly
      pulseColor = {
        r: Math.floor(randomRange(100, 255)),
        g: Math.floor(randomRange(100, 255)),
        b: Math.floor(randomRange(100, 255)),
      };
      ball.color = `rgb(${pulseColor.r}, ${pulseColor.g}, ${pulseColor.b})`;
      ball.glowColor = `rgba(${pulseColor.r}, ${pulseColor.g}, ${pulseColor.b}, 0.8)`;
    }

    updateScoreBoard();
    checkAchievements();
  }

  // Ball falls below paddle = game over
  if (ball.y - ball.radius > canvas.height) {
    gameOver();
    return;
  }

  drawPaddle();
  drawBall();

  requestAnimationFrame(gameLoop);
}

// Start countdown before starting game
function startCountdown() {
  countdownValue = 3;
  countdownScreen.textContent = countdownValue;
  countdownScreen.style.display = 'block';
  startScreen.style.display = 'none';

  countdownInterval = setInterval(() => {
    countdownValue--;
    if (countdownValue > 0) {
      countdownScreen.textContent = countdownValue;
    } else {
      clearInterval(countdownInterval);
      countdownScreen.style.display = 'none';
      startGame();
    }
  }, 1000);
}

// Start the actual game
function startGame() {
  resetPositions();
  score = 0;
  achievementsUnlocked.clear();
  updateScoreBoard();
  running = true;
  paused = false;
  overlay.style.display = 'none';
  gameOverScreen.style.display = 'none';

  if (selectedWorld === 1) {
    initGlowCircles('#aabbff');
  } else if (selectedWorld === 2) {
    initGlowCircles('#ffdd55');
  }

  requestAnimationFrame(gameLoop);
}

// Pause toggle
function togglePause() {
  if (!running) return;
  paused = !paused;
  if (paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#bbb';
    ctx.font = '48px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Paused', canvas.width / 2, canvas.height / 2);
  } else {
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }
}

// Event listeners

// World selection
worldButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedWorld = parseInt(btn.getAttribute('data-world'));
    worldSelectionScreen.style.display = 'none';
    startScreen.style.display = 'block';
  });
});

// Start button
startBtn.addEventListener('click', () => {
  startCountdown();
});

// Retry button
retryBtn.addEventListener('click', () => {
  gameOverScreen.style.display = 'none';
  startScreen.style.display = 'block';
});

// Exit button (go back to world select)
exitBtn.addEventListener('click', () => {
  gameOverScreen.style.display = 'none';
  overlay.style.display = 'flex';
  worldSelectionScreen.style.display = 'block';
  startScreen.style.display = 'none';
});

// Keyboard controls
window.addEventListener('keydown', e => {
  if (e.repeat) return;

  keys[e.key] = true;

  if (e.key.toLowerCase() === 'p') {
    togglePause();
  }
});
window.addEventListener('keyup', e => {
  keys[e.key] = false;
});

// On page load, show world selection screen
window.onload = () => {
  overlay.style.display = 'flex';
  worldSelectionScreen.style.display = 'flex';
  startScreen.style.display = 'none';
  countdownScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';

  updateScoreBoard();
};
// © Ashok-777
// GitHub: https://github.com/Ashok-777
