// Konfiguracja gry
const config = {
  minBet: 1,
  startingBalance: 0, // Balans początkowy
  minCrash: 0.25, // Minimalna wartość crash
  maxCrash: 10, // Maksymalna wartość crash
  chanceToHitMin: 0.30, // 30% szans na osiągnięcie minCrash
  chanceToHitMax: 0.01, // 5% szans na osiągnięcie maxCrash
  chanceToHitOne: 0.50, // 50% szans na osiągnięcie 1.0
  speed: 0.0001 // Szybkość wzrostu mnożnika
};

// Dźwięki
const sounds = {
  start: new Audio('dzwieki/spin.mp3'),
  win: new Audio('dzwieki/win.mp3'),
  crash: new Audio('dzwieki/jackpot.mp3')
};

function playSound(type) {
  if (!state.soundEnabled) return;
  if (sounds[type]) {
    sounds[type].currentTime = 0;
    sounds[type].play();
  }
}

// Stan gry
const state = {
  balance: parseInt(localStorage.getItem("balance")) || config.startingBalance,
  bet: parseInt(localStorage.getItem("crashLastBet")) || config.minBet,
  running: false,
  crashed: false,
  multiplier: 0.0,
  animationFrame: null,
  crashAt: 0,
  countdown: 0,
  soundEnabled: localStorage.getItem("crashSoundEnabled") !== "false",
  stats: {
    totalGames: parseInt(localStorage.getItem("crashTotalGames")) || 0,
    totalWins: parseInt(localStorage.getItem("crashTotalWins")) || 0,
    highestWin: parseInt(localStorage.getItem("crashHighestWin")) || 0,
    totalAdded: parseInt(localStorage.getItem("crashTotalAdded")) || 0
  }
};

// Elementy DOM
const elements = {
  startButton: document.getElementById('startButton'),
  cashoutButton: document.getElementById('cashoutButton'),
  crashMultiplier: document.getElementById('crashMultiplier'),
  betInput: document.getElementById('betInput'),
  result: document.getElementById('result'),
  balanceDisplay: document.getElementById('balance'),
  totalGames: document.getElementById('totalGames'),
  totalWins: document.getElementById('totalWins'),
  highestWin: document.getElementById('highestWin'),
  totalAdded: document.getElementById('totalAdded'),
  crashCountdown: document.getElementById('crashCountdown'),
  crashPayout: document.getElementById('crashPayout'),
  soundButton: document.getElementById('soundButton'),
  resetButton: document.getElementById('resetButton')
};

// Aktualizacja interfejsu
function updateUI() {
  elements.balanceDisplay.textContent = `${state.balance.toLocaleString()} PLN`;
  elements.totalGames.textContent = state.stats.totalGames;
  elements.totalWins.textContent = state.stats.totalWins;
  elements.highestWin.textContent = `${state.stats.highestWin.toLocaleString()} PLN`;
  elements.totalAdded.textContent = `${state.stats.totalAdded.toLocaleString()} PLN`;
  elements.betInput.value = state.bet;
  updateCrashPayout();
}

// Zapisywanie do localStorage
function saveToLocalStorage() {
  localStorage.setItem('balance', state.balance);
  localStorage.setItem('crashLastBet', state.bet);
  localStorage.setItem('crashTotalGames', state.stats.totalGames);
  localStorage.setItem('crashTotalWins', state.stats.totalWins);
  localStorage.setItem('crashHighestWin', state.stats.highestWin);
  localStorage.setItem('crashTotalAdded', state.stats.totalAdded);
  localStorage.setItem('crashSoundEnabled', state.soundEnabled);
}

// Aktualizacja przycisku dźwięku
function updateSoundButton() {
  if (!elements.soundButton) return;
  
  elements.soundButton.textContent = state.soundEnabled ? '🔊 Dźwięk: Włączony' : '🔇 Dźwięk: Wyłączony';
  elements.soundButton.classList.toggle('muted', !state.soundEnabled);
  elements.soundButton.onclick = () => {
    state.soundEnabled = !state.soundEnabled;
    localStorage.setItem("crashSoundEnabled", state.soundEnabled);
    updateSoundButton();
  };
}

// Resetowanie gry
function resetGame() {
  if (confirm("Czy na pewno chcesz zresetować statystyki gry Crash? Twoje saldo pozostanie bez zmian.")) {
    state.stats = { totalGames: 0, totalWins: 0, highestWin: 0, totalAdded: 0 };
    saveToLocalStorage();
    updateUI();
  }
}

// Zmiana stawki
function changeBet(percentage) {
  if (!state.running) {
    let changeAmount = Math.floor(state.bet * (percentage / 100)); // Calculate 10% of the current bet
    let newBet = state.bet + changeAmount;

    if (newBet < config.minBet) {
      newBet = config.minBet;
      elements.result.textContent = `Minimalna stawka to ${config.minBet} PLN.`;
    }
    if (newBet > state.balance) {
      newBet = state.balance;
    }
    state.bet = newBet;
    elements.betInput.value = state.bet;
    saveToLocalStorage();
    updateUI();
  }
}

// Ustawienie konkretnej stawki
function setBet(amount) {
  if (!state.running) {
    if (amount < config.minBet) {
      amount = config.minBet;
      elements.result.textContent = `Minimalna stawka to ${config.minBet} PLN.`;
    }
    if (amount > state.balance) {
      amount = state.balance;
    }
    state.bet = amount;
    elements.betInput.value = state.bet;
    saveToLocalStorage();
    updateUI();
  }
}

// Obsługa inputu stawki
function setupEventListeners() {
  elements.startButton.addEventListener('click', startCrashGame);
  elements.cashoutButton.addEventListener('click', crashCashout);
  
  if (elements.resetButton) {
    elements.resetButton.addEventListener('click', resetGame);
  }
  
  elements.betInput.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      const newBet = Math.min(Math.max(config.minBet, value), state.balance);
      state.bet = newBet;
      saveToLocalStorage();
      updateUI();
    }
  });

  // Update the bet step buttons to use percentages
  document.querySelector('.bet-step:first-child').onclick = () => changeBet(-10); // Decrease by 10%
  document.querySelector('.bet-step:last-child').onclick = () => changeBet(10); // Increase by 10%
}

// Aktualizacja wypłaty
function updateCrashPayout() {
  if (state.running && !state.crashed) {
    const payout = Math.floor(state.bet * state.multiplier);
    elements.crashPayout.textContent = `${payout.toLocaleString()} PLN`;
  } else {
    elements.crashPayout.textContent = '0 PLN';
  }
}

// Rozpoczynanie odliczania przed grą
function startCrashGame() {
  if (state.running || state.bet > state.balance) {
    if (state.balance < state.bet) {
      elements.result.textContent = `Za mało środków!`;
    }
    return;
  }
  
  elements.startButton.disabled = true;
  elements.cashoutButton.disabled = true;
  elements.crashCountdown.textContent = '';
  state.countdown = 3;
  
  function doCountdown() {
    if (state.countdown > 0) {
      elements.crashCountdown.textContent = state.countdown + '...';
      state.countdown--;
      setTimeout(doCountdown, 700);
    } else {
      elements.crashCountdown.textContent = 'GO!';
      setTimeout(() => {
        elements.crashCountdown.textContent = '';
        initiateCrash();
      }, 600);
    }
  }
  
  doCountdown();
}

// Rozpoczęcie właściwej animacji
function initiateCrash() {
  state.running = true;
  state.crashed = false;
  state.multiplier = 0.00;
  elements.result.textContent = '';
  elements.result.className = 'result';
  elements.startButton.disabled = true;
  elements.cashoutButton.disabled = false;
  
  // Pobieramy z salda
  state.balance -= state.bet;
  state.stats.totalGames++;
  
  updateUI();
  saveToLocalStorage();
  playSound('start');
  
  // Losuj kiedy nastąpi crash (wykorzystanie rozkładu wykładniczego)
  const r = Math.random();

  // Użyj wartości z konfiguracji
  if (Math.random() < config.chanceToHitOne) {
    state.crashAt = 1.5; // Ustaw crashAt na 1.5
  } else if (Math.random() < config.chanceToHitMin) {
    state.crashAt = config.minCrash; // Ustaw crashAt na minCrash
  } else if (Math.random() < config.chanceToHitMax) {
    state.crashAt = config.maxCrash; // Ustaw crashAt na maxCrash
  } else {
    state.crashAt = Math.max(config.minCrash, Math.min(config.maxCrash, (-1 / Math.log(1 - r)) * 5));
  }
  
  let startTimestamp = null;
  
  function animateCrashMultiplier(timestamp) {
    if (!state.running || state.crashed) return;
    if (!startTimestamp) startTimestamp = timestamp;
    
    const elapsed = timestamp - startTimestamp;
    state.multiplier = 0 + (elapsed * config.speed);
    elements.crashMultiplier.textContent = state.multiplier.toFixed(2) + 'x';
    updateCrashPayout();
    
    if (state.multiplier >= state.crashAt) {
      crashCrash();
      return;
    }
    
    state.animationFrame = requestAnimationFrame(animateCrashMultiplier);
  }
  
  state.animationFrame = requestAnimationFrame(animateCrashMultiplier);
}

// Obsługa wypadku (crash)
function crashCrash() {
  state.crashed = true;
  if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
  
  elements.result.textContent = 'CRASH! x' + state.multiplier.toFixed(2);
  elements.result.className = 'result lose';
  elements.startButton.disabled = false;
  elements.cashoutButton.disabled = true;
  state.running = false;
  
  updateUI();
  playSound('crash');
  saveToLocalStorage();
}

// Wypłata przed crashem
function crashCashout() {
  if (!state.running || state.crashed) return;
  
  if (state.animationFrame) cancelAnimationFrame(state.animationFrame);
  
  const win = Math.floor(state.bet * state.multiplier);
  state.balance += win;
  state.stats.totalWins++;
  
  if (win > state.stats.highestWin) {
    state.stats.highestWin = win;
  }
  
  elements.result.textContent = 'Wypłacono: ' + win.toLocaleString() + ' PLN (x' + state.multiplier.toFixed(2) + ')';
  elements.result.className = 'result win';
  elements.startButton.disabled = false;
  elements.cashoutButton.disabled = true;
  state.running = false;
  
  updateUI();
  playSound('win');
  saveToLocalStorage();
}

// Funkcja do dodawania środków (dla testów)
function addFunds(amount) {
  state.balance += amount;
  state.stats.totalAdded += amount;
  saveToLocalStorage();
  updateUI();
}

// Funkcja pomocnicza do obsługi modalu pomocy
function openHelpModal() {
  const helpModal = document.getElementById("helpModal");
  if (helpModal) {
    helpModal.style.display = "block";
  }
}

function closeHelpModal() {
  const helpModal = document.getElementById("helpModal");
  if (helpModal) {
    helpModal.style.display = "none";
  }
}

// Obsługa menu mobilnego
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileBtn && navLinks) {
  mobileBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// Inicjalizacja po załadowaniu strony
window.onload = () => {
  updateUI();
  setupEventListeners();
  updateSoundButton();
  
  // Upewnij się, że przyciski są w odpowiednim stanie
  elements.startButton.disabled = false;
  elements.cashoutButton.disabled = true;
};