// Konfiguracja gry
const config = {
    sections: [
      { multiplier: 0.5, color: '#3498db', textColor: '#fff', name: '0.5x', weight: 15 },
      { multiplier: 1, color: '#2ecc71', textColor: '#fff', name: '1x', weight: 20 },
      { multiplier: 2, color: '#e74c3c', textColor: '#fff', name: '2x', weight: 15 },
      { multiplier: 5, color: '#9b59b6', textColor: '#fff', name: '5x', weight: 10 },
      { multiplier: 10, color: '#f1c40f', textColor: '#000', name: '10x', weight: 5 },
      { multiplier: 20, color: '#1abc9c', textColor: '#fff', name: '20x', weight: 3 },
      { multiplier: 0, color: '#e67e22', textColor: '#fff', name: 'PUSTO', weight: 15 },
      { multiplier: 0, color: '#95a5a6', textColor: '#fff', name: 'PUSTO', weight: 15 },
      { multiplier: 100, color: '#ff0000', textColor: '#fff', name: 'JACKPOT', weight: 2 }
    ],
    minSpinDegrees: 1080, // Minimalny obrót (3 pełne obroty)
    spinDuration: 4000, // 4 sekundy
    minBet: 10,
    startingBalance: 1000
  };
  
  // Stan gry - ładowanie z localStorage
  const state = {
    balance: parseInt(localStorage.getItem("balance")) || config.startingBalance,
    bet: parseInt(localStorage.getItem("lastBet")) || 50,
    isSpinning: false,
    soundEnabled: localStorage.getItem("wheelSoundEnabled") !== "false",
    stats: {
      totalSpins: parseInt(localStorage.getItem("wheelTotalSpins")) || 0,
      totalWins: parseInt(localStorage.getItem("wheelTotalWins")) || 0,
      highestWin: parseInt(localStorage.getItem("wheelHighestWin")) || 0,
      totalAdded: parseInt(localStorage.getItem("wheelTotalAdded")) || 0
    }
  };
  
  // Elementy DOM
  const elements = {
    wheel: document.getElementById('wheel'),
    wheelSections: null,
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
    helpButton: document.getElementById('helpButton'),
    helpModal: document.getElementById('helpModal'),
    closeModal: document.querySelector('.close-modal')
  };
  
  // Dźwięki
  const sounds = {
    spin: document.getElementById('spinSound'),
    win: document.getElementById('winSound'),
    jackpot: document.getElementById('jackpotSound')
  };
  
  // Inicjalizacja gry
  function initGame() {
    createWheel();
    updateUI();
    setupEventListeners();
    updateSoundButton();
  }
  
  // Tworzenie koła fortuny z widocznymi stawkami
  function createWheel() {
    elements.wheel.innerHTML = '';
    const sectionAngle = 360 / config.sections.length;
  
    config.sections.forEach((section, index) => {
      const sectionElement = document.createElement('div');
      sectionElement.className = 'wheel-section';
      if (section.multiplier === 0) sectionElement.classList.add('lose');
      if (section.multiplier === 100) sectionElement.classList.add('jackpot');
  
      // Ustawienia stylu
      sectionElement.style.transform = `rotate(${index * sectionAngle}deg)`;
      sectionElement.style.backgroundColor = section.color;
      sectionElement.style.color = section.textColor;
      sectionElement.style.borderColor = section.color;
  
      // Tekst w sekcji - pokazuje mnożnik i przykładową wygraną
      const textElement = document.createElement('div');
      textElement.className = 'wheel-section-text';
  
      if (section.multiplier > 0) {
        textElement.innerHTML = `
          <div class="multiplier">${section.multiplier}x</div>
          <div class="example-win">${section.multiplier * 100} PLN</div>
        `;
      } else {
        textElement.textContent = section.name;
      }
  
      sectionElement.appendChild(textElement);
  
      // Ustawienie kąta dla tekstu
      const textAngle = index * sectionAngle + sectionAngle / 2;
      sectionElement.style.transform = `rotate(${index * sectionAngle}deg)`;
      sectionElement.style.setProperty('--text-angle', `${-textAngle}deg`);
  
      elements.wheel.appendChild(sectionElement);
    });
  
    elements.wheelSections = document.querySelectorAll('.wheel-section');
  }
  
  // Funkcja do ważonego losowania sekcji
  function getWeightedRandomSection() {
    const totalWeight = config.sections.reduce((sum, section) => sum + section.weight, 0);
    let random = Math.random() * totalWeight;
  
    for (const section of config.sections) {
      if (random < section.weight) {
        return section;
      }
      random -= section.weight;
    }
  
    return config.sections[0]; // fallback
  }
  
  // Obsługa zakręcenia kołem
  function spinWheel() {
    if (state.isSpinning || state.balance < state.bet) return;
  
    state.isSpinning = true;
    state.balance -= state.bet;
    state.stats.totalSpins++;
  
    saveToLocalStorage();
    updateUI();
    elements.spinButton.disabled = true;
  
    // Odtwórz dźwięk spinowania
    if (state.soundEnabled) {
      sounds.spin.currentTime = 0;
      sounds.spin.play();
    }
  
    // Losowanie wyniku z uwzględnieniem wag
    const selectedSection = getWeightedRandomSection();
    const sectionIndex = config.sections.findIndex(s => s === selectedSection);
    const sectionAngle = 360 / config.sections.length;
  
    // Obliczenie kąta końcowego z minimalnym obrotem
    const minRotation = config.minSpinDegrees;
    const targetAngle = minRotation + (360 - (sectionIndex * sectionAngle + sectionAngle / 2));
  
    // Animacja koła
    elements.wheel.style.transition = `transform ${config.spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    elements.wheel.style.transform = `rotate(${targetAngle}deg)`;
  
    // Naprawa podpisów po zakończeniu animacji
    setTimeout(() => {
      elements.wheel.style.transition = 'none';
      const actualRotation = targetAngle % 360;
      elements.wheel.style.transform = `rotate(${actualRotation}deg)`;
  
      // Wymuszenie repaint
      void elements.wheel.offsetWidth;
  
      // Przywrócenie animacji
      elements.wheel.style.transition = `transform ${config.spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
    }, config.spinDuration);
  
    // Zakończenie spinowania
    setTimeout(() => {
      state.isSpinning = false;
      elements.spinButton.disabled = false;
  
      // Sprawdź wygraną
      const winAmount = Math.floor(state.bet * selectedSection.multiplier);
  
      if (winAmount > 0) {
        state.balance += winAmount;
        state.stats.totalWins++;
  
        if (winAmount > state.stats.highestWin) {
          state.stats.highestWin = winAmount;
        }
  
        // Odtwórz dźwięk wygranej
        if (state.soundEnabled) {
          if (selectedSection.multiplier === 100) {
            sounds.jackpot.currentTime = 0;
            sounds.jackpot.play();
          } else {
            sounds.win.currentTime = 0;
            sounds.win.play();
          }
        }
  
        // Wyświetl wynik
        elements.resultDisplay.textContent = selectedSection.multiplier === 100 
          ? `JACKPOT! WYGRAŁEŚ ${winAmount.toLocaleString()} PLN!` 
          : `Wygrałeś ${winAmount.toLocaleString()} PLN!`;
  
        // Wyświetl ostatnią wygraną
        elements.lastWinDisplay.textContent = `Ostatnia wygrana: ${winAmount.toLocaleString()} PLN`;
      } else {
        elements.resultDisplay.textContent = `Niestety, nic nie wygrałeś!`;
      }
  
      // Zapisz dane gry
      saveToLocalStorage();
      updateUI();
    }, config.spinDuration);
  }
  
  // Zapisanie stanu gry do localStorage
  function saveToLocalStorage() {
    localStorage.setItem('balance', state.balance);
    localStorage.setItem('lastBet', state.bet);
    localStorage.setItem('wheelTotalSpins', state.stats.totalSpins);
    localStorage.setItem('wheelTotalWins', state.stats.totalWins);
    localStorage.setItem('wheelHighestWin', state.stats.highestWin);
    localStorage.setItem('wheelTotalAdded', state.stats.totalAdded);
  }
  
  // Aktualizacja UI
  function updateUI() {
    elements.balanceDisplay.textContent = `${state.balance.toLocaleString()} PLN`;
    elements.totalSpinsDisplay.textContent = state.stats.totalSpins;
    elements.totalWinsDisplay.textContent = state.stats.totalWins;
    elements.highestWinDisplay.textContent = `${state.stats.highestWin.toLocaleString()} PLN`;
    elements.totalAddedDisplay.textContent = `${state.stats.totalAdded.toLocaleString()} PLN`;
    elements.betInput.value = state.bet;
    elements.multiplierDisplay.textContent = `${state.bet * 100} PLN`;
  }
  
  // Funkcja do zmiany stawki
  function changeBet(amount) {
    const newBet = state.bet + amount;
    if (newBet >= config.minBet && newBet <= state.balance) {
      state.bet = newBet;
      saveToLocalStorage();
      updateUI();
    }
  }
  
  // Funkcja do ustawienia stałej stawki
  function setBet(amount) {
    state.bet = amount;
    saveToLocalStorage();
    updateUI();
  }
  
  // Obsługa włączenia i wyłączenia dźwięku
  function updateSoundButton() {
    elements.soundButton.textContent = state.soundEnabled ? 'Wyłącz dźwięk' : 'Włącz dźwięk';
    elements.soundButton.onclick = () => {
      state.soundEnabled = !state.soundEnabled;
      localStorage.setItem("wheelSoundEnabled", state.soundEnabled);
      updateSoundButton();
    };
  }
  
  // Funkcja do resetowania gry
  function resetGame() {
    state.balance = config.startingBalance;
    state.stats = {
      totalSpins: 0,
      totalWins: 0,
      highestWin: 0,
      totalAdded: 0
    };
    localStorage.clear();
    saveToLocalStorage();
    updateUI();
  }
  
  // Setup event listeners
  function setupEventListeners() {
    elements.spinButton.addEventListener('click', spinWheel);
    elements.resetButton.addEventListener('click', resetGame);
    elements.betInput.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      if (value >= config.minBet && value <= state.balance) {
        state.bet = value;
        saveToLocalStorage();
        updateUI();
      }
    });
  }
  
  window.onload = initGame;
  