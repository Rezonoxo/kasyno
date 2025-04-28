// 1. Konfiguracja gry
const config = {
  sections: [
      { multiplier: 1, color: '#FF6F61', label: 'x1' },     // Czerwono-pomarańczowy
      { multiplier: 2, color: '#29ABE2', label: 'x2' },     // Jasnoniebieski
      { multiplier: 0, color: '#F4D03F', label: 'Pusto' },     // Żółty
      { multiplier: 1, color: '#FF6F61', label: 'x1' },     // Czerwono-pomarańczowy
      { multiplier: 2, color: '#29ABE2', label: 'x2' },     // Jasnoniebieski
      { multiplier: 0, color: '#F4D03F', label: 'Pusto' },     // Żółty
      { multiplier: 1, color: '#FF6F61', label: 'x1' },     // Czerwono-pomarańczowy
      { multiplier: 2, color: '#29ABE2', label: 'x2' },     // Jasnoniebieski
      { multiplier: 0, color: '#F4D03F', label: 'Pusto' },     // Żółty
      { multiplier: 1, color: '#FF6F61', label: 'x1' },     // Czerwono-pomarańczowy
      { multiplier: 0, color: '#F4D03F', label: 'Pusto', index: 'last'},     // Żółty
  ],
  minSpinDegrees: 103,
  spinDuration: 3000,
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
  wheel: document.getElementById('wheel'),
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
  resetButton: document.getElementById('resetButton')
};

// 5. Inicjalizacja gry
function initGame() {
  createWheel();
  updateUI();
  setupEventListeners();
  updateSoundButton();
}

// 6. Tworzenie koła
function createWheel() {
  elements.wheel.innerHTML = '';
  const sectionAngle = 360 / config.sections.length;

  config.sections.forEach((section, index) => {
    const sectionElement = document.createElement('div');
    sectionElement.className = 'wheel-section';
    
    // Dodaj specjalną klasę dla ostatniego elementu
    if (section.index === 'last') {
      sectionElement.classList.add('last-section');
    }
    
    sectionElement.style.transform = `rotate(${index * sectionAngle}deg)`;
    sectionElement.style.backgroundColor = section.color;
    sectionElement.style.borderColor = section.color;
    elements.wheel.appendChild(sectionElement);
  });
}

// 7. Losowanie sekcji
function getRandomSection() {
  const randomIndex = Math.floor(Math.random() * config.sections.length);
  return config.sections[randomIndex];
}

// 8. Kręcenie kołem
function spinWheel() {
  if (state.isSpinning || state.balance < state.bet) {
      if (state.balance < state.bet) {
          elements.resultDisplay.textContent = `Za mało środków!`;
      }
      return;
  }

  state.isSpinning = true;
  state.balance -= state.bet;
  state.stats.totalSpins++;
  playSound('spin');

  saveToLocalStorage();
  updateUI();
  elements.spinButton.disabled = true;

  const selectedSection = getRandomSection();
  const sectionIndex = config.sections.findIndex(s => s === selectedSection);
  const sectionAngle = 360 / config.sections.length;
  const minRotation = config.minSpinDegrees;
  const targetAngle = minRotation + (360 - (sectionIndex * sectionAngle + sectionAngle / 2));

  elements.wheel.style.transition = `transform ${config.spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
  elements.wheel.style.transform = `rotate(${targetAngle}deg)`;

  setTimeout(() => {
      elements.wheel.style.transition = 'none';
      const actualRotation = targetAngle % 360;
      elements.wheel.style.transform = `rotate(${actualRotation}deg)`;
      void elements.wheel.offsetWidth;
      elements.wheel.style.transition = `transform ${config.spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
  }, config.spinDuration);

  setTimeout(() => {
      state.isSpinning = false;
      elements.spinButton.disabled = false;
      const winAmount = Math.floor(state.bet * selectedSection.multiplier);

      if (winAmount > 0) {
          state.balance += winAmount;
          state.stats.totalWins++;
          if (winAmount > state.stats.highestWin) state.stats.highestWin = winAmount;
          elements.resultDisplay.textContent = selectedSection.multiplier === 100
              ? `JACKPOT! WYGRAŁEŚ ${winAmount.toLocaleString()} PLN!`
              : `Wygrałeś ${winAmount.toLocaleString()} PLN!`;
          elements.lastWinDisplay.textContent = `Ostatnia wygrana: ${winAmount.toLocaleString()} PLN`;
          playSound(selectedSection.multiplier === 100 ? 'jackpot' : 'win');
      } else {
          elements.resultDisplay.textContent = `Niestety, nic nie wygrałeś!`;
      }

      saveToLocalStorage();
      updateUI();
  }, config.spinDuration);
}

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

  const maxMultiplier = Math.max(...config.sections.map(s => s.multiplier));
  elements.multiplierDisplay.textContent = `Max wygrana: ${(state.bet * maxMultiplier).toLocaleString()} PLN`;
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

// 13. Zmiana stawki
function changeBet(amount) {
  if (!state.isSpinning) {
      const newBet = state.bet + amount;
      if (newBet >= config.minBet && newBet <= state.balance) {
          state.bet = newBet;
          elements.betInput.value = state.bet;
          saveToLocalStorage();
          updateUI();
      } else if (newBet < config.minBet) {
          elements.resultDisplay.textContent = `Minimalna stawka to ${config.minBet} PLN.`;
      } else if (newBet > state.balance) {
          elements.resultDisplay.textContent = `Nie masz wystarczająco środków!`;
      }
  }
}

// 14. Ustawienie konkretnej stawki (przyciski szybkiego zakładu)
function setBet(amount) {
  if (!state.isSpinning) {
      if (amount >= config.minBet && amount <= state.balance) {
          state.bet = amount;
          elements.betInput.value = state.bet;
          saveToLocalStorage();
          updateUI();
      } else if (amount < config.minBet) {
          state.bet = config.minBet;
          elements.betInput.value = state.bet;
          saveToLocalStorage();
          updateUI();
      } else {
          state.bet = state.balance;
          elements.betInput.value = state.bet;
          saveToLocalStorage();
          updateUI();
      }
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
window.onload = initGame;
alert('Gra jest w trakcie prac i mogą występować błędy.');