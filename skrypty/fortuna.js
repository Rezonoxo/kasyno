// 1. Konfiguracja gry
const config = {
  minBet: 10,
  startingBalance: 0, // Dajmy graczowi trochę na start
};

// 2. Dźwięki
const sounds = {
  spin: new Audio('dzwieki/spin.mp3'),
  win: new Audio('dzwieki/win.mp3'),
  jackpot: new Audio('dzwieki/jackpot.mp3')
};

function playSound(type) {
  if (!state.soundEnabled) return;
  if (sounds[type]) {
    sounds[type].currentTime = 0;
    sounds[type].play();
  }
}

// 3. Stan gry
const state = {
  balance: parseInt(localStorage.getItem("balance")) || config.startingBalance,
  bet: parseInt(localStorage.getItem("lastBet")) || config.minBet, // Domyślna stawka to minBet
  isSpinning: false,
  soundEnabled: localStorage.getItem("wheelSoundEnabled") !== "false",
  stats: {
    totalSpins: parseInt(localStorage.getItem("wheelTotalSpins")) || 0,
    totalWins: parseInt(localStorage.getItem("wheelTotalWins")) || 0,
    highestWin: parseInt(localStorage.getItem("wheelHighestWin")) || 0,
    totalAdded: parseInt(localStorage.getItem("wheelTotalAdded")) || 0
  }
};

// 4. Elementy DOM
const elements = {
  spinButton: document.getElementById('spinButton'),
  betInput: document.getElementById('betInput'),
  balanceDisplay: document.getElementById('balance'),
  resultDisplay: document.getElementById('result'),
  lastWinDisplay: document.getElementById('lastWin'),
  totalSpinsDisplay: document.getElementById('totalSpins'),
  totalWinsDisplay: document.getElementById('totalWins'),
  highestWinDisplay: document.getElementById('highestWin'),
  totalAddedDisplay: document.getElementById('totalAdded'),
  multiplierDisplay: document.getElementById('multiplierValue'),
  soundButton: document.getElementById('soundButton'),
  resetButton: document.getElementById('resetButton'),
  multiplierSlider: document.getElementById('multiplierSlider'),
  selectedMultiplier: document.getElementById('selectedMultiplier'),
  multiplierStrip: document.getElementById('multiplierStrip')
};

// Lista mnożników na pasku (możesz zmienić według uznania)
const MULTIPLIERS = [0, 0.5, 1, 2, 5, 10, 0, 1, 2, 0.5, 10, 0, 2, 1, 5, 0.5, 10, 0, 1, 2];

const strip = document.getElementById('multiplierStrip');
let isAnimating = false;

function renderMultiplierStrip() {
  strip.innerHTML = '';
  MULTIPLIERS.forEach(mult => {
    const el = document.createElement('div');
    el.className = 'multiplier-strip-item';
    el.textContent = mult + 'x';
    strip.appendChild(el);
  });
}

// Nowa funkcja: obsługa gry na podstawie wybranego mnożnika
function spinWheel() {
  if (state.isSpinning || isAnimating || state.balance < state.bet) {
    if (state.balance < state.bet) {
      elements.resultDisplay.textContent = `Za mało środków!`;
    }
    return;
  }
  state.isSpinning = true;
  isAnimating = true;
  elements.spinButton.disabled = true;
  state.balance -= state.bet;
  state.stats.totalSpins++;
  playSound('spin');
  saveToLocalStorage();
  updateUI();

  // Animacja przesuwania paska
  const itemWidth = 80; // px, musi być zgodne z CSS
  const visibleCount = 7; // ile mnożników widać naraz
  const indicatorIndex = Math.floor(visibleCount / 2);
  const minIndex = indicatorIndex;
  const maxIndex = MULTIPLIERS.length - indicatorIndex - 1;
  const stopIndex = Math.floor(Math.random() * (maxIndex - minIndex + 1)) + minIndex;
  const totalShift = stopIndex - indicatorIndex;
  const duration = 2500 + Math.random() * 500; // ms

  strip.style.transition = `transform ${duration}ms cubic-bezier(0.23, 1, 0.32, 1)`;
  strip.style.transform = `translateX(-${totalShift * itemWidth}px)`;

  setTimeout(() => {
    strip.style.transition = '';
    isAnimating = false;
    const multiplier = MULTIPLIERS[stopIndex];
    let winAmount = 0;
    if (multiplier > 0) {
      winAmount = Math.floor(state.bet * multiplier);
      state.balance += winAmount;
      state.stats.totalWins++;
      if (winAmount > state.stats.highestWin) state.stats.highestWin = winAmount;
      elements.resultDisplay.textContent = `Wygrałeś ${winAmount.toLocaleString()} PLN! (x${multiplier})`;
      elements.lastWinDisplay.textContent = `Ostatnia wygrana: ${winAmount.toLocaleString()} PLN`;
      playSound(multiplier >= 10 ? 'jackpot' : 'win');
    } else {
      elements.resultDisplay.textContent = `Niestety, nic nie wygrałeś! (x0)`;
    }
    state.isSpinning = false;
    elements.spinButton.disabled = false;
    saveToLocalStorage();
    updateUI();
    // Reset pasek po chwili
    setTimeout(() => {
      strip.style.transition = '';
      strip.style.transform = 'translateX(0)';
    }, 1200);
  }, duration);
}

// Crash game logic
const crashElements = {
  startButton: document.getElementById('startButton'),
  cashoutButton: document.getElementById('cashoutButton'),
  crashMultiplier: document.getElementById('crashMultiplier'),
  betInput: document.getElementById('betInput'),
  result: document.getElementById('result'),
  balance: document.getElementById('balance'),
  totalGames: document.getElementById('totalGames'),
  totalWins: document.getElementById('totalWins'),
  highestWin: document.getElementById('highestWin'),
  totalAdded: document.getElementById('totalAdded'),
};

const crashCountdown = document.getElementById('crashCountdown');
const crashPayout = document.getElementById('crashPayout');

let crashState = {
  running: false,
  crashed: false,
  multiplier: 1.0,
  interval: null,
  crashAt: 0,
  bet: 50,
  balance: parseInt(localStorage.getItem('crash_balance')) || 1000,
  totalGames: parseInt(localStorage.getItem('crash_totalGames')) || 0,
  totalWins: parseInt(localStorage.getItem('crash_totalWins')) || 0,
  highestWin: parseInt(localStorage.getItem('crash_highestWin')) || 0,
  totalAdded: parseInt(localStorage.getItem('crash_totalAdded')) || 0,
};

let crashAnimationFrame = null;

function updateCrashUI() {
  crashElements.crashMultiplier.textContent = crashState.multiplier.toFixed(2) + 'x';
  crashElements.betInput.value = crashState.bet;
  // GLOBALNE SALDO
  let globalBalance = parseInt(localStorage.getItem('balance')) || 0;
  crashElements.balance.textContent = globalBalance.toLocaleString();
  crashElements.totalGames.textContent = crashState.totalGames;
  crashElements.totalWins.textContent = crashState.totalWins;
  crashElements.highestWin.textContent = crashState.highestWin + ' PLN';
  crashElements.totalAdded.textContent = crashState.totalAdded + ' PLN';
}

function saveCrashState() {
  localStorage.setItem('crash_balance', crashState.balance);
  localStorage.setItem('crash_totalGames', crashState.totalGames);
  localStorage.setItem('crash_totalWins', crashState.totalWins);
  localStorage.setItem('crash_highestWin', crashState.highestWin);
  localStorage.setItem('crash_totalAdded', crashState.totalAdded);
}

function resetCrashGame() {
  crashState.balance = 1000;
  crashState.totalGames = 0;
  crashState.totalWins = 0;
  crashState.highestWin = 0;
  crashState.totalAdded = 0;
  saveCrashState();
  updateCrashUI();
}

function changeBet(amount) {
  if (crashState.running) return;
  let newBet = crashState.bet + amount;
  if (newBet < 1) newBet = 1;
  if (newBet > crashState.balance) newBet = crashState.balance;
  crashState.bet = newBet;
  updateCrashUI();
}

crashElements.betInput.addEventListener('input', (e) => {
  let val = parseInt(e.target.value);
  if (isNaN(val) || val < 1) val = 1;
  if (val > crashState.balance) val = crashState.balance;
  crashState.bet = val;
  updateCrashUI();
});

crashElements.startButton.addEventListener('click', () => {
  if (crashState.running || crashState.bet > crashState.balance) return;
  crashElements.startButton.disabled = true;
  crashElements.cashoutButton.disabled = true;
  crashCountdown.textContent = '';
  let countdown = 3;
  function doCountdown() {
    if (countdown > 0) {
      crashCountdown.textContent = countdown + '...';
      countdown--;
      setTimeout(doCountdown, 700);
    } else {
      crashCountdown.textContent = 'GO!';
      setTimeout(() => {
        crashCountdown.textContent = '';
        startCrashGame();
      }, 600);
    }
  }
  doCountdown();
});

function startCrashGame() {
  crashState.running = true;
  crashState.crashed = false;
  crashState.multiplier = 0.00;
  crashElements.result.textContent = '';
  crashElements.startButton.disabled = true;
  crashElements.cashoutButton.disabled = false;
  // GLOBALNE SALDO
  let globalBalance = parseInt(localStorage.getItem('balance')) || 0;
  globalBalance -= crashState.bet;
  localStorage.setItem('balance', globalBalance);
  crashState.totalGames++;
  updateCrashUI();
  updateCrashPayout();
  // Losuj crash (exp losowanie, min 1.2x, max 100x)
  const r = Math.random();
  crashState.crashAt = Math.max(1.2, Math.floor((-1 / Math.log(1 - r)) * 2 * 100) / 100);
  let startTimestamp = null;
  const speed = 0.00025;
  function animateCrashMultiplier(ts) {
    if (!crashState.running || crashState.crashed) return;
    if (!startTimestamp) startTimestamp = ts;
    const elapsed = ts - startTimestamp;
    crashState.multiplier = Math.max(0, (elapsed) * speed);
    updateCrashUI();
    updateCrashPayout();
    if (crashState.multiplier >= crashState.crashAt) {
      crashCrash();
      return;
    }
    crashAnimationFrame = requestAnimationFrame(animateCrashMultiplier);
  }
  crashAnimationFrame = requestAnimationFrame(animateCrashMultiplier);
}

function updateCrashPayout() {
  if (crashState.running && !crashState.crashed) {
    const payout = Math.floor(crashState.bet * crashState.multiplier);
    crashPayout.textContent = payout + ' PLN';
  } else {
    crashPayout.textContent = '0 PLN';
  }
}

crashElements.cashoutButton.addEventListener('click', () => {
  if (!crashState.running || crashState.crashed) return;
  crashCashout();
});

function crashCrash() {
  crashState.crashed = true;
  if (crashAnimationFrame) cancelAnimationFrame(crashAnimationFrame);
  crashElements.result.textContent = 'CRASH! x' + crashState.multiplier.toFixed(2);
  crashElements.result.className = 'result lose';
  crashElements.startButton.disabled = false;
  crashElements.cashoutButton.disabled = true;
  crashState.running = false;
  updateCrashUI();
  updateCrashPayout();
}

function crashCashout() {
  if (crashAnimationFrame) cancelAnimationFrame(crashAnimationFrame);
  const win = Math.floor(crashState.bet * crashState.multiplier);
  // GLOBALNE SALDO
  let globalBalance = parseInt(localStorage.getItem('balance')) || 0;
  globalBalance += win;
  localStorage.setItem('balance', globalBalance);
  crashState.totalWins++;
  if (win > crashState.highestWin) crashState.highestWin = win;
  crashElements.result.textContent = 'Wypłacono: ' + win + ' PLN (x' + crashState.multiplier.toFixed(2) + ')';
  crashElements.result.className = 'result win';
  crashElements.startButton.disabled = false;
  crashElements.cashoutButton.disabled = true;
  crashState.running = false;
  updateCrashUI();
  updateCrashPayout();
}

// Reset przez F5 lub ręcznie
window.addEventListener('DOMContentLoaded', () => {
  updateCrashUI();
  crashElements.startButton.disabled = false;
  crashElements.cashoutButton.disabled = true;
});

// 9. Zapisywanie do localStorage
function saveToLocalStorage() {
  localStorage.setItem('balance', state.balance);
  localStorage.setItem('lastBet', state.bet);
  localStorage.setItem('wheelTotalSpins', state.stats.totalSpins);
  localStorage.setItem('wheelTotalWins', state.stats.totalWins);
  localStorage.setItem('wheelHighestWin', state.stats.highestWin);
  localStorage.setItem('wheelTotalAdded', state.stats.totalAdded);
}

// 10. Aktualizacja interfejsu
function updateUI() {
  elements.balanceDisplay.textContent = `${state.balance.toLocaleString()} PLN`;
  elements.totalSpinsDisplay.textContent = state.stats.totalSpins;
  elements.totalWinsDisplay.textContent = state.stats.totalWins;
  elements.highestWinDisplay.textContent = `${state.stats.highestWin.toLocaleString()} PLN`;
  elements.totalAddedDisplay.textContent = `${state.stats.totalAdded.toLocaleString()} PLN`;
  elements.betInput.value = state.bet;
  elements.multiplierDisplay.textContent = `Max wygrana: ${(state.bet * Math.max(...MULTIPLIERS)).toLocaleString()} PLN`;
}

// 11. Aktualizacja przycisku dźwięku
function updateSoundButton() {
  elements.soundButton.textContent = state.soundEnabled ? '🔊 Dźwięk: Włączony' : '🔇 Dźwięk: Wyłączony';
  elements.soundButton.classList.toggle('muted', !state.soundEnabled);
  elements.soundButton.onclick = () => {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem("wheelSoundEnabled", state.soundEnabled);
    updateSoundButton();
  };
}

// 12. Resetowanie gry
function resetGame() {
  state.balance = config.startingBalance;
  state.stats = { totalSpins: 0, totalWins: 0, highestWin: 0, totalAdded: 0 };
  localStorage.clear();
  saveToLocalStorage();
  updateUI();
}

// 13. Zmiana stawki (bez wpływu na balans)
function changeBet(amount) {
  if (!state.isSpinning) {
    let newBet = state.bet + amount;
    if (newBet < config.minBet) {
      newBet = config.minBet;
      elements.resultDisplay.textContent = `Minimalna stawka to ${config.minBet} PLN.`;
    } 
    state.bet = newBet;
    elements.betInput.value = state.bet;
    saveToLocalStorage();
    updateUI();
  }
}

// 14. Ustawienie konkretnej stawki (bez wpływu na balans)
function setBet(amount) {
  if (!state.isSpinning) {
    if (amount < config.minBet) {
      amount = config.minBet;
      elements.resultDisplay.textContent = `Minimalna stawka to ${config.minBet} PLN.`;
    }
    state.bet = amount;
    elements.betInput.value = state.bet;
    saveToLocalStorage();
    updateUI();
  }
}

// 15. Obsługa zdarzeń
function setupEventListeners() {
  elements.spinButton.addEventListener('click', spinWheel);
  elements.resetButton.addEventListener('click', resetGame);
  elements.betInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      const newBet = Math.min(Math.max(config.minBet, value), state.balance);
      state.bet = newBet;
      saveToLocalStorage();
      updateUI();
    }
  });
}

// Obsługa modalu pomocy
function openHelpModal() {
  document.getElementById("helpModal").style.display = "block";
}

function closeHelpModal() {
  document.getElementById("helpModal").style.display = "none";
}

const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileBtn.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// 16. Uruchomienie gry po załadowaniu strony
window.onload = () => {
  renderMultiplierStrip();
  updateUI();
  setupEventListeners();
  updateSoundButton();
};
alert('Gra jest w trakcie prac i mogą występować błędy.');