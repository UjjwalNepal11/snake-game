let animationFrame = 0;
let foodPulsePhase = 0;
let gridPulsePhase = 0;

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const levelElement = document.getElementById("level");
const speedElement = document.getElementById("speed");
const finalScoreElement = document.getElementById("finalScore");
const finalLevelElement = document.getElementById("finalLevel");
const finalFoodsElement = document.getElementById("finalFoods");
const newHighScoreElement = document.getElementById("newHighScore");
const gameOverScreen = document.getElementById("gameOverScreen");
const pauseScreen = document.getElementById("pauseScreen");
const startScreen = document.getElementById("startScreen");
const countdownScreen = document.getElementById("countdownScreen");
const restartBtn = document.getElementById("restartBtn");
const startBtn = document.getElementById("startBtn");

const settingsBtn = document.getElementById("settingsBtn");
const settingsOverlay = document.getElementById("settingsOverlay");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const difficultySelect = document.getElementById("difficultySelect");
const difficultyInfo = document.getElementById("difficultyInfo");
const masterSoundCheck = document.getElementById("masterSoundCheck");
const resetHighScoreBtn = document.getElementById("resetHighScoreBtn");
const resetConfirm = document.getElementById("resetConfirm");
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");

const mobilePauseBtn = document.getElementById("mobilePauseBtn");

function updateSettingsButtonVisibility() {
  if (!gameStarted || isGameOver || isPaused) {
    settingsBtn.classList.remove("hidden");
  } else {
    settingsBtn.classList.add("hidden");
  }

  if (mobilePauseBtn) {
    if (gameStarted && !isGameOver && !isPaused) {
      mobilePauseBtn.classList.remove("hidden");
    } else {
      mobilePauseBtn.classList.add("hidden");
    }
  }
}

const CANVAS_SIZE = 400;
const GRID_SIZE = 20;
const GRID_COUNT = CANVAS_SIZE / GRID_SIZE;

let cellSize = GRID_SIZE;

const difficultySettings = {
  easy: {
    initialSpeed: 200,
    speedMultiplier: 0.98,
    name: "Easy",
    speedName: "200ms",
  },
  medium: {
    initialSpeed: 150,
    speedMultiplier: 0.94,
    name: "Medium",
    speedName: "150ms",
  },
  hard: {
    initialSpeed: 100,
    speedMultiplier: 0.9,
    name: "Hard",
    speedName: "100ms",
  },
  expert: {
    initialSpeed: 70,
    speedMultiplier: 0.85,
    name: "Expert",
    speedName: "70ms",
  },
};

let snake = [];
let food = { x: 0, y: 0, type: "normal" };
let specialFood = { x: 0, y: 0, type: "none", active: false };
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let highScore = 0;
let level = 1;
let foodsEaten = 0;
let gameLoop = null;
let isGameOver = false;
let isPaused = false;
let gameStarted = false;
let gameSpeed = 150;
let initialSpeed = 150;
let countdownInterval = null;
let isCountingDown = false;

let volume = 0.7;

let activePowerUp = null;
let powerUpTimeout = null;
let consecutiveFoodsWithoutHit = 0;

let stats = {
  gamesPlayed: 0,
  totalFoods: 0,
  bestScore: 0,
  maxLevel: 1,
};

let achievements = {
  firstFood: false,
  score100: false,
  score500: false,
  level5: false,
  goldenFood: false,
  noHit: false,
};

let settings = {
  difficulty: "medium",
  soundEnabled: true,
};

function openSettings() {
  if (gameStarted && !isGameOver && !isPaused) return;

  syncUIWithSettings();

  settingsOverlay.classList.remove("hidden");

  setTimeout(() => {
    const settingsContent = document.querySelector(".settings-content");
    if (settingsContent) {
      settingsContent.scrollTop = 0;
    }
    settingsOverlay.scrollTop = 0;
  }, 10);
}

function closeSettings() {
  settingsOverlay.classList.add("hidden");
}

function saveSettingsToLocalStorage() {
  localStorage.setItem("snakeGameSettings", JSON.stringify(settings));
  localStorage.setItem("snakeGameVolume", volume);
}
function updateDifficultyInfo() {
  const diffSettings = difficultySettings[difficultySelect.value];
  difficultyInfo.textContent = `Speed: ${diffSettings.speedName} | Speed Multiplier: ${diffSettings.speedMultiplier}`;
}

function saveSettings() {
  try {
    settings.difficulty = difficultySelect.value;
    settings.soundEnabled = masterSoundCheck.checked;
    volume = volumeSlider.value / 100;
    volumeValue.textContent = Math.round(volume * 100) + "%";

    const diffSettings = difficultySettings[settings.difficulty];
    initialSpeed = diffSettings.initialSpeed;

    if (!gameStarted) {
      gameSpeed = initialSpeed;
    }

    saveSettingsToLocalStorage();

    closeSettings();
    updateSpeedDisplay();
  } catch (e) {
    console.error("Error saving settings:", e);
    closeSettings();
  }
}

function resetHighScore() {
  highScore = 0;
  highScoreElement.textContent = 0;
  localStorage.setItem("snakeGameHighScore", 0);
  resetConfirm.classList.remove("hidden");
  setTimeout(() => resetConfirm.classList.add("hidden"), 2000);
}

settingsBtn.addEventListener("click", openSettings);
closeSettingsBtn.addEventListener("click", closeSettings);
saveSettingsBtn.addEventListener("click", saveSettings);
difficultySelect.addEventListener("change", function () {
  updateDifficultyInfo();
});
masterSoundCheck.addEventListener("change", function () {
  settings.soundEnabled = this.checked;
});
resetHighScoreBtn.addEventListener("click", resetHighScore);
volumeSlider.addEventListener("input", function () {
  volumeValue.textContent = this.value + "%";
  volume = this.value / 100;
});

function syncUIWithSettings() {
  difficultySelect.value = settings.difficulty;
  masterSoundCheck.checked = settings.soundEnabled;
  volumeSlider.value = volume * 100;
  volumeValue.textContent = Math.round(volume * 100) + "%";
  updateDifficultyInfo();
}

function initGame() {
  highScoreElement.textContent = highScore;

  const startX = Math.floor(GRID_COUNT / 2);
  const startY = Math.floor(GRID_COUNT / 2);

  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];

  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };

  score = 0;
  level = 1;
  foodsEaten = 0;
  consecutiveFoodsWithoutHit = 0;
  activePowerUp = null;

  if (powerUpTimeout) {
    clearTimeout(powerUpTimeout);
    powerUpTimeout = null;
  }

  scoreElement.textContent = score;
  levelElement.textContent = level;

  isGameOver = false;
  isPaused = false;
  gameStarted = true;

  const diffSettings = difficultySettings[settings.difficulty];
  initialSpeed = diffSettings.initialSpeed;
  gameSpeed = initialSpeed;

  updateSpeedDisplay();

  gameOverScreen.classList.add("hidden");
  pauseScreen.classList.add("hidden");
  startScreen.classList.add("hidden");
  countdownScreen.classList.add("hidden");

  generateFood();
  generateSpecialFood();
  startGameLoop();
  updateSettingsButtonVisibility();

  stats.gamesPlayed++;
  saveStats();
}

function startCountdown() {
  if (isCountingDown) return;
  isCountingDown = true;

  preloadAudio();

  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }

  drawInitialPreview();

  startScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  countdownScreen.classList.remove("hidden");

  settingsBtn.classList.add("hidden");

  let count = 3;
  const countdownNumber = countdownScreen.querySelector(".countdown-number");
  countdownNumber.textContent = count;
  countdownNumber.style.animation = "none";
  countdownNumber.offsetHeight;
  countdownNumber.style.animation = "countdownPop 1s ease-out";

  countdownInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownNumber.textContent = count;
      countdownNumber.style.animation = "none";
      countdownNumber.offsetHeight;
      countdownNumber.style.animation = "countdownPop 1s ease-out";
    } else if (count === 0) {
      countdownNumber.textContent = "GO";
      countdownNumber.style.color = "#00ff88";
      countdownNumber.style.animation = "none";
      countdownNumber.offsetHeight;
      countdownNumber.style.animation = "countdownPop 1s ease-out";
    } else {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdownScreen.classList.add("hidden");
      isCountingDown = false;
      initGame();
    }
  }, 1000);
}

function startGameLoop() {
  if (gameLoop) clearInterval(gameLoop);
  gameLoop = setInterval(update, gameSpeed);
}

document.addEventListener("keydown", handleKeyPress);

if (mobilePauseBtn) {
  mobilePauseBtn.addEventListener("click", () => {
    if (gameStarted && !isGameOver) {
      togglePause();
    }
  });
}

const mobileResumeBtn = document.getElementById("mobileResumeBtn");
if (mobileResumeBtn) {
  mobileResumeBtn.addEventListener("click", () => {
    if (gameStarted && !isGameOver && isPaused) {
      togglePause();
    }
  });
}

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let touchMoveX = 0;
let touchMoveY = 0;
let lastTouchX = 0;
let lastTouchY = 0;
let lastTouchTime = 0;
let touchVelocityX = 0;
let touchVelocityY = 0;
let isTouching = false;

const MIN_SWIPE_DISTANCE = 50; 
const VELOCITY_THRESHOLD = 0.5; 
const FAST_SWIPE_THRESHOLD = 100; 

const canvasContainer = document.querySelector(".canvas-container");

if (canvasContainer) {
 
  canvasContainer.addEventListener(
    "touchstart",
    function (e) {
      
      if (e.target.tagName !== "BUTTON") {
        e.preventDefault();
      }

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      touchMoveX = touch.clientX;
      touchMoveY = touch.clientY;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      lastTouchTime = Date.now();
      touchVelocityX = 0;
      touchVelocityY = 0;
      isTouching = true;
    },
    { passive: false },
  );
  canvasContainer.addEventListener(
    "touchmove",
    function (e) {
      if (!isTouching) return;

      e.preventDefault();

      const touch = e.touches[0];
      const currentTime = Date.now();
      const timeDelta = currentTime - lastTouchTime;

      if (timeDelta > 0) {
        touchVelocityX = (touch.clientX - lastTouchX) / timeDelta;
        touchVelocityY = (touch.clientY - lastTouchY) / timeDelta;
      }

      touchMoveX = touch.clientX;
      touchMoveY = touch.clientY;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      lastTouchTime = currentTime;
    },
    { passive: false },
  );

  canvasContainer.addEventListener(
    "touchend",
    function (e) {
      if (!isTouching) return;
      isTouching = false;

      const touch = e.changedTouches[0];
      const diffX = touch.clientX - touchStartX;
      const diffY = touch.clientY - touchStartY;

      const distance = Math.sqrt(diffX * diffX + diffY * diffY);

      if (distance < MIN_SWIPE_DISTANCE) return;

      const isFastSwipe =
        distance >= FAST_SWIPE_THRESHOLD ||
        Math.abs(touchVelocityX) > VELOCITY_THRESHOLD ||
        Math.abs(touchVelocityY) > VELOCITY_THRESHOLD;

      const absX = Math.abs(diffX);
      const absY = Math.abs(diffY);

      let swipeDirection = "";

      if (absX > absY) {
        swipeDirection = diffX > 0 ? "right" : "left";
      } else {
       
        swipeDirection = diffY > 0 ? "down" : "up";
      }

      handleMobileInput(swipeDirection, isFastSwipe);
    },
    { passive: false },
  );

  canvasContainer.addEventListener(
    "touchcancel",
    function (e) {
      isTouching = false;
      touchVelocityX = 0;
      touchVelocityY = 0;
    },
    { passive: false },
  );
}

function handleMobileInput(dir, isFastSwipe = false) {
  if (isCountingDown) return;

  if (!gameStarted && !isGameOver) {
    startCountdown();
    return;
  }

  if (!gameStarted || isGameOver || isPaused) return;

  const currentDir = getDirectionFromKey(dir);
  if (currentDir) {
   
    if (isFastSwipe || (direction.x === 0 && direction.y === 0)) {
      direction = { ...currentDir };
      nextDirection = { ...currentDir };
    } else {
     
      if (!isOppositeDirection(currentDir, direction)) {
        nextDirection = currentDir;
      }
    }
  }
}

function handleKeyPress(event) {
  if (isCountingDown) return;

  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      " ",
      "w",
      "a",
      "s",
      "d",
      "W",
      "A",
      "S",
      "D",
    ].includes(event.key)
  ) {
    event.preventDefault();
  }

  if (event.key === "Enter" && isGameOver) {
    startCountdown();
    return;
  }
  if (event.key === "Enter" && !gameStarted) {
    startCountdown();
    return;
  }
  if (event.key === " " && !isGameOver && gameStarted) {
    togglePause();
    return;
  }
  if (
    !gameStarted &&
    !isGameOver &&
    (event.key.startsWith("Arrow") || "wasdWASD".includes(event.key))
  ) {
    startCountdown();
    return;
  }

  if (!gameStarted || isGameOver || isPaused) return;

  const currentDir = getDirectionFromKey(event.key);
  if (currentDir) {
    if (direction.x === 0 && direction.y === 0) {
      direction = { ...currentDir };
      nextDirection = { ...currentDir };
    } else {
      if (!isOppositeDirection(currentDir, direction)) {
        nextDirection = currentDir;
      }
    }
  }
}

function getDirectionFromKey(key) {
  const keyMap = {
    ArrowUp: { x: 0, y: -1 },
    w: { x: 0, y: -1 },
    W: { x: 0, y: -1 },
    up: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    s: { x: 0, y: 1 },
    S: { x: 0, y: 1 },
    down: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    a: { x: -1, y: 0 },
    A: { x: -1, y: 0 },
    left: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    d: { x: 1, y: 0 },
    D: { x: 1, y: 0 },
    right: { x: 1, y: 0 },
  };
  return keyMap[key] || null;
}

function isOppositeDirection(dir1, dir2) {
  return dir1.x === -dir2.x && dir1.y === -dir2.y;
}

function togglePause() {
  isPaused = !isPaused;
  if (isPaused) {
    pauseScreen.classList.remove("hidden");
    clearInterval(gameLoop);
  } else {
    pauseScreen.classList.add("hidden");
    gameLoop = setInterval(update, gameSpeed);
  }
  updateSettingsButtonVisibility();
}

function update() {
  direction = { ...nextDirection };

  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  if (checkWallCollision(newHead)) {
    endGame();
    return;
  }
  if (checkSelfCollision(newHead)) {
    endGame();
    return;
  }

  snake.unshift(newHead);

  let foodEaten = false;
  let specialFoodEaten = false;

  if (checkFoodCollision(newHead)) {
    foodEaten = true;
    consecutiveFoodsWithoutHit++;
  }

  if (
    specialFood.active &&
    newHead.x === specialFood.x &&
    newHead.y === specialFood.y
  ) {
    specialFoodEaten = true;
    activateSpecialFood(specialFood.type);
  }

  if (foodEaten || specialFoodEaten) {
    foodsEaten++;
    consecutiveFoodsWithoutHit++;

    let points = 10 * level;
    if (activePowerUp === "double-points") {
      points *= 2;
    }
    if (specialFoodEaten && specialFood.type === "golden") {
      points += 50;
    }
    score += points;
    scoreElement.textContent = score;

    playEatSound();
    createParticles(
      newHead.x * GRID_SIZE + GRID_SIZE / 2,
      newHead.y * GRID_SIZE + GRID_SIZE / 2,
    );

    canvas.classList.add("flash");
    setTimeout(() => canvas.classList.remove("flash"), 150);

    if (score > highScore) {
      highScore = score;
      highScoreElement.textContent = highScore;
      localStorage.setItem("snakeGameHighScore", highScore);
    }

    const newLevel = Math.floor(score / 100) + 1;
    if (newLevel > level) {
      level = newLevel;
      levelElement.textContent = level;
      showLevelUpNotification();
      showToast(`Level ${level} reached!`, false);
    }

    if (!activePowerUp || activePowerUp !== "frozen") {
      gameSpeed = Math.max(35, Math.floor(gameSpeed * 0.94));
    }
    clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);

    updateSpeedDisplay();
    animateScoreUpdate();
    generateFood();
    if (specialFoodEaten) {
      specialFood.active = false;
    }
    generateSpecialFood();

    if (specialFoodEaten && specialFood.type === "golden") {
      if (!achievements.goldenFood) {
        achievements.goldenFood = true;
        showToast("Achievement Unlocked: Lucky Find!", true);
      }
    }
    checkAchievements();

    stats.totalFoods++;
    if (score > stats.bestScore) stats.bestScore = score;
    if (level > stats.maxLevel) stats.maxLevel = level;
    saveStats();
    updateStatsDisplay();
  } else {
    snake.pop();
  }

  draw();
}

function updateSpeedDisplay() {
  const diffSettings = difficultySettings[settings.difficulty];
  const speedToUse = gameSpeed;
  const baseSpeed = 200;
  const speedMultiplier = (baseSpeed / speedToUse).toFixed(1);
  speedElement.textContent = speedMultiplier + "x";
}

function showToast(message, isAchievement = false) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = "toast" + (isAchievement ? " achievement" : "");
  toast.innerHTML = `
    <span class="toast-icon">${isAchievement ? "🏆" : "⭐"}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hiding");
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

function showLevelUpNotification() {
  const container = document.querySelector(".canvas-container");
  if (!container) return;

  const notification = document.createElement("div");
  notification.className = "level-up-notification";
  notification.textContent = `Level ${level}!`;

  container.appendChild(notification);

  setTimeout(() => notification.remove(), 1000);
}

function animateScoreUpdate() {
  const scoreBox = document.querySelector(".score-box");
  if (scoreBox) {
    scoreBox.classList.add("score-updated");
    setTimeout(() => scoreBox.classList.remove("score-updated"), 300);
  }
}

function checkWallCollision(head) {
  return (
    head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT
  );
}

function checkSelfCollision(head) {
  for (let i = 1; i < snake.length; i++) {
    if (head.x === snake[i].x && head.y === snake[i].y) return true;
  }
  return false;
}

function checkFoodCollision(head) {
  return head.x === food.x && head.y === food.y;
}

function generateFood() {
  let newFood;
  let isOnSnake = true;

  while (isOnSnake) {
    newFood = {
      x: Math.floor(Math.random() * GRID_COUNT),
      y: Math.floor(Math.random() * GRID_COUNT),
      type: "normal",
    };
    isOnSnake = false;
    for (let segment of snake) {
      if (segment.x === newFood.x && segment.y === newFood.y) {
        isOnSnake = true;
        break;
      }
    }
  }
  food = newFood;
}

function generateSpecialFood() {
  if (Math.random() < 0.2 && !specialFood.active) {
    let newSpecialFood;
    let isOnSnake = true;
    const types = ["golden", "freeze"];
    const randomType = types[Math.floor(Math.random() * types.length)];

    while (isOnSnake) {
      newSpecialFood = {
        x: Math.floor(Math.random() * GRID_COUNT),
        y: Math.floor(Math.random() * GRID_COUNT),
        type: randomType,
      };
      isOnSnake = false;

      for (let segment of snake) {
        if (segment.x === newSpecialFood.x && segment.y === newSpecialFood.y) {
          isOnSnake = true;
          break;
        }
      }
      if (newSpecialFood.x === food.x && newSpecialFood.y === food.y) {
        isOnSnake = true;
      }
    }
    specialFood = { ...newSpecialFood, active: true };
  }
}

function activateSpecialFood(type) {
  if (type === "golden") {
    score += 50;
    scoreElement.textContent = score;
    if (score > highScore) {
      highScore = score;
      highScoreElement.textContent = highScore;
      localStorage.setItem("snakeGameHighScore", highScore);
    }
    achievements.goldenFood = true;
    saveAchievements();
  } else if (type === "freeze") {
    activePowerUp = "frozen";
    gameSpeed = Math.min(300, gameSpeed + 50);
    clearInterval(gameLoop);
    gameLoop = setInterval(update, gameSpeed);
    updateSpeedDisplay();
  }

  if (powerUpTimeout) clearTimeout(powerUpTimeout);
  powerUpTimeout = setTimeout(() => {
    if (activePowerUp === "frozen") {
      activePowerUp = null;
      gameSpeed = Math.max(35, Math.floor(gameSpeed - 50));
      clearInterval(gameLoop);
      gameLoop = setInterval(update, gameSpeed);
      updateSpeedDisplay();
    }
  }, 5000);
}

function draw() {
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  drawGrid();
  drawSpecialFood();
  drawFood();
  drawSnake();
}

function drawGrid() {
  gridPulsePhase = (gridPulsePhase + 0.02) % (Math.PI * 2);
  const pulseIntensity = 0.03 + Math.sin(gridPulsePhase) * 0.02;

  ctx.strokeStyle = `rgba(0, 229, 255, ${pulseIntensity})`;
  ctx.lineWidth = 1;

  for (let i = 0; i <= GRID_COUNT; i++) {
    ctx.beginPath();
    ctx.moveTo(i * GRID_SIZE, 0);
    ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * GRID_SIZE);
    ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
    ctx.stroke();
  }
}

function drawFood() {
  const x = food.x * GRID_SIZE;
  const y = food.y * GRID_SIZE;

  foodPulsePhase = (foodPulsePhase + 0.1) % (Math.PI * 2);
  const pulse = Math.sin(foodPulsePhase) * 0.3 + 1;
  const glowIntensity = 10 + Math.sin(foodPulsePhase) * 8;

  ctx.shadowColor = "#ff4757";
  ctx.shadowBlur = glowIntensity;
  ctx.fillStyle = "#ff4757";

  const size = (GRID_SIZE / 2 - 2) * pulse;
  ctx.beginPath();
  ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSpecialFood() {
  if (!specialFood.active) return;

  const x = specialFood.x * GRID_SIZE;
  const y = specialFood.y * GRID_SIZE;

  const pulse = Math.sin(foodPulsePhase * 1.5) * 0.2 + 1;

  if (specialFood.type === "golden") {
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 20 + Math.sin(foodPulsePhase * 2) * 10;
    ctx.fillStyle = "#ffd700";
  } else if (specialFood.type === "freeze") {
    ctx.shadowColor = "#00ffff";
    ctx.shadowBlur = 20 + Math.sin(foodPulsePhase * 2) * 10;
    ctx.fillStyle = "#00ffff";
  }

  const size = (GRID_SIZE / 2 - 2) * pulse;
  ctx.beginPath();
  ctx.arc(x + GRID_SIZE / 2, y + GRID_SIZE / 2, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSnake() {
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  gradient.addColorStop(0, "#2d5a27");
  gradient.addColorStop(0.3, "#4a8c3f");
  gradient.addColorStop(0.5, "#5ba34d");
  gradient.addColorStop(0.7, "#4a8c3f");
  gradient.addColorStop(1, "#2d5a27");

  if (snake.length > 1) {
    ctx.strokeStyle = gradient;
    ctx.lineWidth = GRID_SIZE - 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "#1a3a15";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(
      snake[0].x * GRID_SIZE + GRID_SIZE / 2,
      snake[0].y * GRID_SIZE + GRID_SIZE / 2,
    );

    for (let i = 1; i < snake.length; i++) {
      const prev = snake[i - 1];
      const curr = snake[i];

      const prevX = prev.x * GRID_SIZE + GRID_SIZE / 2;
      const prevY = prev.y * GRID_SIZE + GRID_SIZE / 2;
      const currX = curr.x * GRID_SIZE + GRID_SIZE / 2;
      const currY = curr.y * GRID_SIZE + GRID_SIZE / 2;

      const midX = (prevX + currX) / 2;
      const midY = (prevY + currY) / 2;

      if (i === 1) {
        ctx.lineTo(midX, midY);
      } else {
        ctx.quadraticCurveTo(prevX, prevY, midX, midY);
      }
    }

    const last = snake[snake.length - 1];
    ctx.lineTo(
      last.x * GRID_SIZE + GRID_SIZE / 2,
      last.y * GRID_SIZE + GRID_SIZE / 2,
    );

    ctx.stroke();

    ctx.shadowBlur = 0;
    for (let i = 1; i < snake.length - 1; i++) {
      const segment = snake[i];
      const segX = segment.x * GRID_SIZE + GRID_SIZE / 2;
      const segY = segment.y * GRID_SIZE + GRID_SIZE / 2;

      const scalePattern =
        Math.sin(i * 0.8 + animationFrame * 0.02) * 0.3 + 0.5;
      ctx.fillStyle = `rgba(30, 60, 25, ${scalePattern})`;
      ctx.beginPath();
      ctx.arc(segX, segY, GRID_SIZE / 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const head = snake[0];
  const headX = head.x * GRID_SIZE;
  const headY = head.y * GRID_SIZE;

  const breathe = Math.sin(animationFrame * 0.1) * 0.05 + 1;
  const headSize = (GRID_SIZE - 2) * breathe;

  ctx.shadowColor = "#1a3a15";
  ctx.shadowBlur = 8 + Math.sin(animationFrame * 0.15) * 3;

  const headGradient = ctx.createRadialGradient(
    headX + GRID_SIZE / 2,
    headY + GRID_SIZE / 2,
    0,
    headX + GRID_SIZE / 2,
    headY + GRID_SIZE / 2,
    headSize,
  );
  headGradient.addColorStop(0, "#6abf4f");
  headGradient.addColorStop(0.6, "#4a8c3f");
  headGradient.addColorStop(1, "#2d5a27");

  ctx.fillStyle = headGradient;
  ctx.beginPath();
  ctx.arc(
    headX + GRID_SIZE / 2,
    headY + GRID_SIZE / 2,
    headSize / 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.fillStyle = "#2d5a27";
  ctx.shadowBlur = 0;

  drawEyes(headX, headY);

  animationFrame++;
}

function drawEyes(headX, headY) {
  const eyeSize = 3;
  const eyeOffset = 5;
  let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

  if (direction.x === 1) {
    leftEyeX = headX + GRID_SIZE - eyeOffset - 2;
    leftEyeY = headY + eyeOffset;
    rightEyeX = headX + GRID_SIZE - eyeOffset - 2;
    rightEyeY = headY + GRID_SIZE - eyeOffset - 2;
  } else if (direction.x === -1) {
    leftEyeX = headX + eyeOffset;
    leftEyeY = headY + eyeOffset;
    rightEyeX = headX + eyeOffset;
    rightEyeY = headY + GRID_SIZE - eyeOffset - 2;
  } else if (direction.y === -1) {
    leftEyeX = headX + eyeOffset;
    leftEyeY = headY + eyeOffset;
    rightEyeX = headX + GRID_SIZE - eyeOffset - 2;
    rightEyeY = headY + eyeOffset;
  } else {
    leftEyeX = headX + eyeOffset;
    leftEyeY = headY + GRID_SIZE - eyeOffset - 2;
    rightEyeX = headX + GRID_SIZE - eyeOffset - 2;
    rightEyeY = headY + GRID_SIZE - eyeOffset - 2;
  }

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(leftEyeX, leftEyeY, eyeSize / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(rightEyeX, rightEyeY, eyeSize / 2, 0, Math.PI * 2);
  ctx.fill();
}

function endGame() {
  isGameOver = true;
  gameStarted = false;
  clearInterval(gameLoop);

  createDeathExplosion();

  const container = document.querySelector(".canvas-container");
  container.classList.add("shake-intense");
  setTimeout(() => container.classList.remove("shake-intense"), 500);

  canvas.style.filter = "brightness(0.3) sepia(1) hue-rotate(-50deg)";
  setTimeout(() => {
    canvas.style.filter = "";
  }, 200);

  finalScoreElement.textContent = score;
  finalLevelElement.textContent = level;
  finalFoodsElement.textContent = foodsEaten;

  if (score >= highScore && score > 0) {
    newHighScoreElement.classList.remove("hidden");
  } else {
    newHighScoreElement.classList.add("hidden");
  }

  gameOverScreen.classList.remove("hidden");

  setTimeout(() => {
    drawInitialPreview();
  }, 300);

  updateSettingsButtonVisibility();

  saveStats();
}

function createDeathExplosion() {
  const container = document.querySelector(".canvas-container");

  snake.forEach((segment, index) => {
    const x = segment.x * GRID_SIZE + GRID_SIZE / 2;
    const y = segment.y * GRID_SIZE + GRID_SIZE / 2;

    const particleCount = 3 + Math.floor(Math.random() * 3);

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "death-particle";

      const size = Math.random() * 8 + 4;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 60 + 30;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      const color =
        index === 0
          ? "#00e5ff"
          : `rgba(0, 229, 255, ${Math.max(0.3, 1 - index * 0.05)})`;

      particle.style.width = size + "px";
      particle.style.height = size + "px";
      particle.style.background = color;
      particle.style.left = x - size / 2 + "px";
      particle.style.top = y - size / 2 + "px";
      particle.style.boxShadow = `0 0 ${size}px ${color}`;
      particle.style.setProperty("--tx", tx + "px");
      particle.style.setProperty("--ty", ty + "px");

      particle.style.animationDelay = index * 0.05 + "s";

      container.appendChild(particle);

      setTimeout(
        () => {
          particle.remove();
        },
        1000 + index * 50,
      );
    }
  });
}

function drawInitialPreview() {
  const centerX = Math.floor(GRID_COUNT / 2);
  const centerY = Math.floor(GRID_COUNT / 2);

  const previewSnake = [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];

  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  drawGrid();
  drawFoodForPreview();

  const gradient = ctx.createLinearGradient(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  gradient.addColorStop(0, "#2d5a27");
  gradient.addColorStop(0.5, "#4a8c3f");
  gradient.addColorStop(1, "#2d5a27");

  if (previewSnake.length > 1) {
    ctx.strokeStyle = gradient;
    ctx.lineWidth = GRID_SIZE - 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "#1a3a15";
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(
      previewSnake[0].x * GRID_SIZE + GRID_SIZE / 2,
      previewSnake[0].y * GRID_SIZE + GRID_SIZE / 2,
    );

    for (let i = 1; i < previewSnake.length; i++) {
      const prev = previewSnake[i - 1];
      const curr = previewSnake[i];

      const prevX = prev.x * GRID_SIZE + GRID_SIZE / 2;
      const prevY = prev.y * GRID_SIZE + GRID_SIZE / 2;
      const currX = curr.x * GRID_SIZE + GRID_SIZE / 2;
      const currY = curr.y * GRID_SIZE + GRID_SIZE / 2;

      const midX = (prevX + currX) / 2;
      const midY = (prevY + currY) / 2;

      if (i === 1) {
        ctx.lineTo(midX, midY);
      } else {
        ctx.quadraticCurveTo(prevX, prevY, midX, midY);
      }
    }

    const last = previewSnake[previewSnake.length - 1];
    ctx.lineTo(
      last.x * GRID_SIZE + GRID_SIZE / 2,
      last.y * GRID_SIZE + GRID_SIZE / 2,
    );

    ctx.stroke();
  }

  const head = previewSnake[0];
  const headX = head.x * GRID_SIZE;
  const headY = head.y * GRID_SIZE;

  const headGradient = ctx.createRadialGradient(
    headX + GRID_SIZE / 2,
    headY + GRID_SIZE / 2,
    0,
    headX + GRID_SIZE / 2,
    headY + GRID_SIZE / 2,
    GRID_SIZE,
  );
  headGradient.addColorStop(0, "#6abf4f");
  headGradient.addColorStop(1, "#2d5a27");

  ctx.fillStyle = headGradient;
  ctx.shadowColor = "#1a3a15";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(
    headX + GRID_SIZE / 2,
    headY + GRID_SIZE / 2,
    (GRID_SIZE - 2) / 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawFoodForPreview() {
  let foodX, foodY;
  const centerX = Math.floor(GRID_COUNT / 2);
  const centerY = Math.floor(GRID_COUNT / 2);

  do {
    foodX = Math.floor(Math.random() * GRID_COUNT);
    foodY = Math.floor(Math.random() * GRID_COUNT);
  } while (
    (foodX === centerX && foodY === centerY) ||
    (foodX === centerX - 1 && foodY === centerY) ||
    (foodX === centerX - 2 && foodY === centerY)
  );

  const x = foodX * GRID_SIZE;
  const y = foodY * GRID_SIZE;

  ctx.shadowColor = "#ff4444";
  ctx.shadowBlur = 15;
  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.arc(
    x + GRID_SIZE / 2,
    y + GRID_SIZE / 2,
    GRID_SIZE / 2 - 2,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.shadowBlur = 0;
}

restartBtn.addEventListener("click", function () {
  if (!isCountingDown) startCountdown();
});

let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playEatSound() {
  if (!settings.soundEnabled) return;

  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.frequency.value = 800;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3 * volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.1);
}

function preloadAudio() {
  const ctx = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();
}

function createParticles(x, y) {
  const container = document.querySelector(".canvas-container");
  const particleCount = 8;

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";

    const size = Math.random() * 6 + 4;
    const angle = (Math.PI * 2 * i) / particleCount;
    const distance = Math.random() * 30 + 20;

    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.background = "#00ff88";
    particle.style.left = x - size / 2 + "px";
    particle.style.top = y - size / 2 + "px";
    particle.style.boxShadow = `0 0 ${size}px #00ff88`;

    container.appendChild(particle);

    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;

    particle.animate(
      [
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 },
      ],
      {
        duration: 600,
        easing: "ease-out",
      },
    ).onfinish = () => particle.remove();
  }
}

function loadAchievements() {
  const saved = localStorage.getItem("snakeGameAchievements");
  if (saved) {
    try {
      achievements = JSON.parse(saved);
    } catch (e) {
      achievements = {
        firstFood: false,
        score100: false,
        score500: false,
        level5: false,
        goldenFood: false,
        noHit: false,
      };
    }
  }
  updateAchievementsDisplay();
}

function saveAchievements() {
  localStorage.setItem("snakeGameAchievements", JSON.stringify(achievements));
  updateAchievementsDisplay();
}

function checkAchievements() {
  if (!achievements.firstFood && foodsEaten >= 1) {
    achievements.firstFood = true;
    showToast("Achievement Unlocked: First Bite!", true);
  }

  if (!achievements.score100 && score >= 100) {
    achievements.score100 = true;
    showToast("Achievement Unlocked: Century!", true);
  }

  if (!achievements.score500 && score >= 500) {
    achievements.score500 = true;
    showToast("Achievement Unlocked: High Scorer!", true);
  }

  if (!achievements.level5 && level >= 5) {
    achievements.level5 = true;
    showToast("Achievement Unlocked: Rising Star!", true);
  }

  if (!achievements.noHit && consecutiveFoodsWithoutHit >= 10) {
    achievements.noHit = true;
    showToast("Achievement Unlocked: Perfect Run!", true);
  }

  saveAchievements();
}

function updateAchievementsDisplay() {
  if (achievements.firstFood)
    document.getElementById("ach-first-food").classList.add("unlocked");
  if (achievements.score100)
    document.getElementById("ach-score-100").classList.add("unlocked");
  if (achievements.score500)
    document.getElementById("ach-score-500").classList.add("unlocked");
  if (achievements.level5)
    document.getElementById("ach-level-5").classList.add("unlocked");
  if (achievements.goldenFood)
    document.getElementById("ach-golden-food").classList.add("unlocked");
  if (achievements.noHit)
    document.getElementById("ach-no-hit").classList.add("unlocked");
}

function loadStats() {
  const saved = localStorage.getItem("snakeGameStats");
  if (saved) {
    try {
      stats = JSON.parse(saved);
    } catch (e) {
      stats = { gamesPlayed: 0, totalFoods: 0, bestScore: 0, maxLevel: 1 };
    }
  }
  updateStatsDisplay();
}

function saveStats() {
  localStorage.setItem("snakeGameStats", JSON.stringify(stats));
}

function updateStatsDisplay() {
  document.getElementById("statGamesPlayed").textContent = stats.gamesPlayed;
  document.getElementById("statTotalFoods").textContent = stats.totalFoods;
  document.getElementById("statBestScore").textContent = stats.bestScore;
  document.getElementById("statMaxLevel").textContent = stats.maxLevel;
}

function startGame() {
  if (isCountingDown) return;
  startCountdown();
}

startBtn.addEventListener("click", startGame);

function handleResize() {
  const container = document.querySelector(".canvas-container");
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  const borderWidth = 6;
  const availableSize = Math.min(containerWidth, containerHeight) - borderWidth;

  cellSize = Math.floor(availableSize / GRID_COUNT);

  cellSize = Math.max(cellSize, 8);

  const dpr = window.devicePixelRatio || 1;
  canvas.width = CANVAS_SIZE * dpr;
  canvas.height = CANVAS_SIZE * dpr;
  canvas.style.width = cellSize * GRID_COUNT + "px";
  canvas.style.height = cellSize * GRID_COUNT + "px";

  ctx.scale(dpr, dpr);

  if (!gameStarted || isGameOver) {
    draw();
  }
}

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(handleResize, 100);
});

window.addEventListener("orientationchange", () => {
  setTimeout(handleResize, 100);
});

function initializeGame() {
  const savedHighScore = localStorage.getItem("snakeGameHighScore");
  if (savedHighScore) {
    highScore = parseInt(savedHighScore) || 0;
    highScoreElement.textContent = highScore;
  }

  const savedVolume = localStorage.getItem("snakeGameVolume");
  if (savedVolume) {
    const parsedVolume = parseFloat(savedVolume);
    if (!isNaN(parsedVolume)) {
      volume = parsedVolume;
    }
  }

  const savedSettings = localStorage.getItem("snakeGameSettings");
  if (savedSettings) {
    try {
      const parsedSettings = JSON.parse(savedSettings);
      if (parsedSettings) {
        if (
          parsedSettings.difficulty &&
          difficultySettings[parsedSettings.difficulty]
        ) {
          settings.difficulty = parsedSettings.difficulty;
        }
        if (typeof parsedSettings.soundEnabled === "boolean") {
          settings.soundEnabled = parsedSettings.soundEnabled;
        }
      }
    } catch (e) {
      console.error("Error loading settings:", e);
    }
  } else {
    saveSettingsToLocalStorage();
  }

  difficultySelect.value = settings.difficulty;
  masterSoundCheck.checked = settings.soundEnabled;
  volumeSlider.value = volume * 100;
  volumeValue.textContent = Math.round(volume * 100) + "%";
  updateDifficultyInfo();

  syncUIWithSettings();

  const diffSettings = difficultySettings[settings.difficulty];
  initialSpeed = diffSettings.initialSpeed;
  gameSpeed = diffSettings.initialSpeed;

  updateSpeedDisplay();

  loadStats();
  loadAchievements();

  handleResize();

  const startX = Math.floor(GRID_COUNT / 2);
  const startY = Math.floor(GRID_COUNT / 2);
  snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];
  generateFood();
  draw();

  updateSettingsButtonVisibility();
  updateStatsDisplay();
  updateAchievementsDisplay();
}

document.addEventListener("DOMContentLoaded", function () {
  initializeGame();
});
