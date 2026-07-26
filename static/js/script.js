// ==========================================================
// Rock Paper Scissors — Battle Arena
// Frontend logic only — calls the existing /play endpoint,
// never touches app.py / game_logic.py / the API contract.
// ==========================================================

const TOTAL_ROUNDS = 5;

let currentRound = 0;
let playerScore = 0;
let computerScore = 0;
let roundInProgress = false;

const STATS_KEY = "rpsStats";
const WINS_PER_LEVEL = 5;
let stats = { wins: 0, streak: 0 };


 const SOUND_FILES = {
  click: "/static/sounds/click.wav",
  win: "/static/sounds/win.wav",
  lose: "/static/sounds/lose.wav",
  draw: "/static/sounds/click.wav",     
  victory: "/static/sounds/victory.wav",
  defeat: "/static/sounds/lose.wav",    
};


const sounds = {};
Object.keys(SOUND_FILES).forEach((key) => {
  const audio = new Audio(SOUND_FILES[key]);
  audio.preload = "auto";
  sounds[key] = audio;
});

function playSound(name) {
  const audio = sounds[name];
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {
    // Missing file or browser blocked autoplay before first click — fail silently
  });
}

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) stats = JSON.parse(raw);
  } catch (e) {
    // localStorage unavailable (e.g. private browsing) — stay in-memory only
  }
}

function saveStats() {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {}
}

function updateStatCards() {
  const winsEl = document.getElementById("statWins");
  const streakEl = document.getElementById("statStreak");
  const levelEl = document.getElementById("statLevel");
  if (winsEl) winsEl.textContent = stats.wins;
  if (streakEl) streakEl.textContent = stats.streak;
  if (levelEl) levelEl.textContent = Math.floor(stats.wins / WINS_PER_LEVEL) + 1;
}

function registerMatchResult(outcome) {
  if (outcome === "win") {
    stats.wins++;
    stats.streak++;
  } else {
    stats.streak = 0;
  }
  saveStats();
  updateStatCards();
}

document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  updateStatCards();
  initParticles();
  initGameParticles();
  initPlayButton();
  initChoiceButtons();
  initPopupButtons();
  resetGameState();
});

/* ---------------------------------------------------------
   Ambient particles (landing page)
   --------------------------------------------------------- */

function initParticles() {
  const container = document.getElementById("particles");
  if (!container) return;
  spawnParticleStream(container, 26);
}

/* ---------------------------------------------------------
   Ambient particles (game screen)
   --------------------------------------------------------- */

function initGameParticles() {
  const container = document.getElementById("gameParticles");
  if (!container) return;
  spawnParticleStream(container, 18);
}

function spawnParticleStream(container, maxParticles) {
  function spawnOne() {
    const p = document.createElement("div");
    p.className = "particle";
    const size = randomBetween(4, 12);
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${randomBetween(0, 100)}%`;
    const duration = randomBetween(7, 16);
    p.style.animationDuration = `${duration}s`;
    p.style.animationDelay = `${randomBetween(0, 4)}s`;
    if (Math.random() > 0.5) {
      p.style.background = "radial-gradient(circle at 30% 30%, #fff, #ff8a3d 60%, transparent 70%)";
      p.style.boxShadow = "0 0 12px 4px rgba(255, 138, 61, 0.5)";
    }
    container.appendChild(p);
    setTimeout(() => p.remove(), duration * 1000 + 4000);
  }
  for (let i = 0; i < maxParticles; i++) {
    setTimeout(spawnOne, randomBetween(0, 4000));
  }
  setInterval(() => {
    if (container.childElementCount < maxParticles) spawnOne();
  }, 650);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/* ---------------------------------------------------------
   PLAY button — landing page -> game screen
   --------------------------------------------------------- */

function initPlayButton() {
  const btn = document.getElementById("playBtn");
  if (!btn) return;

  const landingPage = document.querySelector(".arena");
  const gameScreen = document.getElementById("gameScreen");

  btn.addEventListener("click", () => {
    btn.classList.add("play-btn--pressed");
    playSound("click");
    setTimeout(() => btn.classList.remove("play-btn--pressed"), 180);

    landingPage.style.display = "none";
    gameScreen.style.display = "flex"; // matches #gameScreen's flex layout so it stays centered
    resetGameState();
  });
}

/* ---------------------------------------------------------
   Game state
   --------------------------------------------------------- */

function resetGameState() {
  currentRound = 0;
  playerScore = 0;
  computerScore = 0;
  roundInProgress = false;

  updateRoundText();
  updateScoreText();

  const resultEl = document.getElementById("resultText");
  if (resultEl) resultEl.textContent = "";

  const playerHandEl = document.getElementById("playerHand");
  const computerHandEl = document.getElementById("computerHand");
  if (playerHandEl) playerHandEl.src = "/static/images/hands/rock-hand.svg";
  if (computerHandEl) computerHandEl.src = "/static/images/hands/rock-hand.svg";

  const modal = document.getElementById("gameOverModal");
  if (modal) {
    modal.hidden = true;
    modal.classList.remove("modal--win", "modal--lose", "modal--draw");
  }

  const confetti = document.getElementById("confettiContainer");
  if (confetti) confetti.innerHTML = "";

  setChoiceButtonsEnabled(true);
}

function updateRoundText() {
  const el = document.getElementById("roundText");
  if (!el) return;
  const displayRound = Math.min(currentRound + 1, TOTAL_ROUNDS);
  el.textContent = `Round ${displayRound} / ${TOTAL_ROUNDS}`;
}

function updateScoreText() {
  const el = document.getElementById("scoreText");
  if (!el) return;
  el.textContent = `You ${playerScore} — ${computerScore} Computer`;
}

function setChoiceButtonsEnabled(enabled) {
  ["rockBtn", "paperBtn", "scissorsBtn"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) btn.disabled = !enabled;
  });
}

/* ---------------------------------------------------------
   Choice buttons -> existing /play endpoint
   --------------------------------------------------------- */

function initChoiceButtons() {
  const rockBtn = document.getElementById("rockBtn");
  const paperBtn = document.getElementById("paperBtn");
  const scissorsBtn = document.getElementById("scissorsBtn");

  if (rockBtn) rockBtn.addEventListener("click", () => playGame("rock"));
  if (paperBtn) paperBtn.addEventListener("click", () => playGame("paper"));
  if (scissorsBtn) scissorsBtn.addEventListener("click", () => playGame("scissors"));
}

function playGame(playerMove) {
  if (roundInProgress || currentRound >= TOTAL_ROUNDS) return;
  playSound("click");  
  roundInProgress = true;
  setChoiceButtonsEnabled(false);

  const playerHandEl = document.getElementById("playerHand");
  const computerHandEl = document.getElementById("computerHand");
  const resultEl = document.getElementById("resultText");

  if (resultEl) resultEl.textContent = "";
  playerHandEl.classList.add("hand-shaking");
  computerHandEl.classList.add("hand-shaking");

  fetch("/play", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ move: playerMove }),
  })
    .then((response) => response.json())
    .then((data) => {
      // Same API response your backend already returns:
      // { player, computer, winner: "Player" | "Computer" | "Draw" }
      setTimeout(() => revealRound(data, playerHandEl, computerHandEl, resultEl), 550);
    })
    .catch((err) => {
      console.error("Error contacting /play:", err);
      playerHandEl.classList.remove("hand-shaking");
      computerHandEl.classList.remove("hand-shaking");
      roundInProgress = false;
      setChoiceButtonsEnabled(true);
    });
}

function revealRound(data, playerHandEl, computerHandEl, resultEl) {
  playerHandEl.classList.remove("hand-shaking");
  computerHandEl.classList.remove("hand-shaking");

  playerHandEl.src = `/static/images/hands/${data.player}-hand.svg`;
  computerHandEl.src = `/static/images/hands/${data.computer}-hand.svg`;

  playerHandEl.classList.add("hand-reveal");
  computerHandEl.classList.add("hand-reveal");
  setTimeout(() => {
    playerHandEl.classList.remove("hand-reveal");
    computerHandEl.classList.remove("hand-reveal");
  }, 520);

  let resultLabel = "Draw!";
  if (data.winner === "Player") {
    playerScore++;
    resultLabel = "You Win This Round!";
    playSound("win");  

    playerHandEl.classList.add("hand-winner-glow");
    setTimeout(() => playerHandEl.classList.remove("hand-winner-glow"), 900);
  } else if (data.winner === "Computer") {
    computerScore++;
    resultLabel = "Computer Wins This Round!";
    playSound("lose");

    computerHandEl.classList.add("hand-winner-glow");
    setTimeout(() => computerHandEl.classList.remove("hand-winner-glow"), 900);
  }

  if (resultEl) resultEl.textContent = resultLabel;

  currentRound++;
  updateScoreText();

  if (currentRound >= TOTAL_ROUNDS) {
    setTimeout(showGameOver, 900);
  } else {
    playSound("draw"); 
    updateRoundText();
    setTimeout(() => {
      roundInProgress = false;
      setChoiceButtonsEnabled(true);
    }, 300);
  }
}

/* ---------------------------------------------------------
   End-of-match popup
   --------------------------------------------------------- */

function showGameOver() {
  const modal = document.getElementById("gameOverModal");
  const titleEl = document.getElementById("gameOverTitle");
  if (!modal || !titleEl) return;

  let outcome = "draw";
  if (playerScore > computerScore) outcome = "win";
  else if (computerScore > playerScore) outcome = "lose";

  registerMatchResult(outcome); 

  modal.classList.remove("modal--win", "modal--lose", "modal--draw");

  if (outcome === "win") {
    playSound("victory");
    modal.classList.add("modal--win");
    titleEl.textContent = "YOU WIN!";
    spawnConfetti();
  } else if (outcome === "lose") {
    playSound("defeat");
    modal.classList.add("modal--lose");
    titleEl.textContent = "COMPUTER WINS";
  } else {
    playSound("draw");
    modal.classList.add("modal--draw");
    titleEl.textContent = "DRAW";
  }

  modal.hidden = false;
}

function initPopupButtons() {
  const playAgainBtn = document.getElementById("playAgainBtn");
  const backHomeBtn = document.getElementById("backHomeBtn");

  if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
      const modal = document.getElementById("gameOverModal");
      if (modal) modal.hidden = true;
      resetGameState();
    });
  }

  if (backHomeBtn) {
    backHomeBtn.addEventListener("click", () => {
      const modal = document.getElementById("gameOverModal");
      if (modal) modal.hidden = true;

      const gameScreen = document.getElementById("gameScreen");
      const landingPage = document.querySelector(".arena");
      if (gameScreen) gameScreen.style.display = "none";
      if (landingPage) landingPage.style.display = "flex";

      resetGameState();
    });
  }
}

function spawnConfetti() {
  const container = document.getElementById("confettiContainer");
  if (!container) return;
  container.innerHTML = "";

  const colors = ["#ffd166", "#ff8a3d", "#c084fc", "#ff5c5c", "#fdf6ff"];

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${randomBetween(2, 3.5)}s`;
    piece.style.animationDelay = `${randomBetween(0, 0.6)}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    container.appendChild(piece);
  }

  setTimeout(() => {
    container.innerHTML = "";
  }, 4200);
}