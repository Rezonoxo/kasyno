// Konfiguracja gry
const config = {
  cols: 7, // Liczba kolumn slotów
  multipliers: [0, 0.5, 1, 4, 1, 0.5, 0], // Mnożniki dla każdego slotu
  minBet: 10,
  startingBalance: 0,
  ballDropSpeed: 16, // ms między klatkami animacji (60fps)
  boardHeight: 400, // Wysokość planszy
  boardWidth: 400, // Szerokość planszy
  gravity: 0.25, // Siła grawitacji
  friction: 0.99, // Współczynnik tarcia
  randomFactor: 0.5, // Zwiększony współczynnik losowości ruchu
  ballSize: 12, // Rozmiar kulki w pikselach
  obstacles: 40, // Liczba przeszkód na planszy
  obstacleSize: 8, // Rozmiar przeszkód
  bounceEnergyLoss: 0.7, // Utrata energii przy odbiciu (niższa wartość = większa utrata)
  turbulence: 0.15, // Współczynnik losowych zakłóceń ruchu
  initialVelocityRandomness: 2.5 // Początkowa losowość prędkości
};

// Stan gry - ładowanie z localStorage
const state = {
  balance: parseInt(localStorage.getItem("balance")) || config.startingBalance,
  bet: parseInt(localStorage.getItem("lastBet")) || 50,
  isDropping: false,
  soundEnabled: localStorage.getItem("pachinkoSoundEnabled") !== "false",
  obstacles: [], // Tablica przechowująca informacje o przeszkodach
  stats: {
    totalDrops: parseInt(localStorage.getItem("pachinkoTotalDrops")) || 0,
    totalWins: parseInt(localStorage.getItem("pachinkoTotalWins")) || 0,
    highestWin: parseInt(localStorage.getItem("pachinkoHighestWin")) || 0,
    totalAdded: parseInt(localStorage.getItem("pachinkoTotalAdded")) || 0
  }
};

// Elementy DOM
const elements = {
  board: document.getElementById('pachinkoBoard'),
  dropButton: document.getElementById('dropButton'),
  betInput: document.getElementById('betInput'),
  balanceDisplay: document.getElementById('balance'),
  resultDisplay: document.getElementById('result'),
  lastWinDisplay: document.getElementById('lastWin'),
  totalDropsDisplay: document.getElementById('totalDrops'),
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
  drop: document.getElementById('dropSound'),
  win: document.getElementById('winSound'),
  jackpot: document.getElementById('jackpotSound'),
  collision: document.getElementById('collisionSound') || { play: () => {} } // Opcjonalny dźwięk kolizji
};

// Inicjalizacja gry
function initGame() {
  createBoard();
  generateObstacles();
  updateUI();
  setupEventListeners();
  updateSoundButton();
}

// Tworzenie planszy Pachinko
function createBoard() {
  elements.board.innerHTML = '';
  
  // Ustawiamy wymiary planszy
  elements.board.style.height = `${config.boardHeight}px`;
  elements.board.style.width = `${config.boardWidth}px`;
  elements.board.style.position = 'relative';
  elements.board.style.overflow = 'hidden';
  
  // Kontener dla slotów
  const slotsContainer = document.createElement('div');
  slotsContainer.className = 'slots-container';
  elements.board.appendChild(slotsContainer);
  
  // Tworzenie slotów w dolnej części planszy
  for (let i = 0; i < config.cols; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot-info';
    slot.dataset.slot = i;
    
    // Dodaj etykiety mnożników w slotach
    const multiplierLabel = document.createElement('span');
    multiplierLabel.textContent = `${config.multipliers[i]}x`;
    slot.appendChild(multiplierLabel);
    
    slotsContainer.appendChild(slot);
  }
}

// Generowanie przeszkód na planszy
function generateObstacles() {
  state.obstacles = []; // Resetowanie istniejących przeszkód
  
  // Dodanie przeszkód w siatce
  const zoneHeight = config.boardHeight * 0.7; // Strefa z przeszkodami (70% planszy)
  const startY = config.boardHeight * 0.15; // Zaczynamy 15% od góry
  
  // Odstęp między przeszkodami
  const spacingX = config.boardWidth / (Math.sqrt(config.obstacles) + 0.3);
  const spacingY = zoneHeight / (Math.sqrt(config.obstacles) + 1);
  
  // Tworzymy przeszkody w układzie siatki z losowym rozrzutem
  let obstacleCount = 0;
  
  for (let row = 1; obstacleCount < config.obstacles && row <= Math.sqrt(config.obstacles) * 1.5; row++) {
    for (let col = 1; obstacleCount < config.obstacles && col <= Math.sqrt(config.obstacles); col++) {
      // Bazowa pozycja w siatce
      let baseX = col * spacingX;
      // Dodajemy losowy offset dla rzędów, co drugi rząd jest przesunięty
      if (row % 2 === 0) {
        baseX -= spacingX / 2;
      }
      
      // Dodajemy losowy offset dla każdej przeszkody
      const randomOffsetX = (Math.random() - 0.5) * spacingX * 0.5;
      const randomOffsetY = (Math.random() - 0.5) * spacingY * 0.5;
      
      const posX = Math.max(config.obstacleSize, Math.min(config.boardWidth - config.obstacleSize, 
                            baseX + randomOffsetX));
      const posY = Math.max(config.obstacleSize + startY, Math.min(config.boardHeight - config.obstacleSize - 40, 
                            startY + row * spacingY + randomOffsetY));
      
      state.obstacles.push({
        x: posX,
        y: posY,
        radius: config.obstacleSize / 2,
        // Losowy typ przeszkody dla różnego zachowania
        type: Math.random() > 0.7 ? 'bouncy' : 'normal',
        element: createObstacleElement(posX, posY)
      });
      
      obstacleCount++;
    }
  }
}

// Tworzenie elementu przeszkody
function createObstacleElement(x, y) {
  const obstacle = document.createElement('div');
  obstacle.className = 'obstacle';
  obstacle.style.width = `${config.obstacleSize}px`;
  obstacle.style.height = `${config.obstacleSize}px`;
  obstacle.style.left = `${x - config.obstacleSize/2}px`;
  obstacle.style.top = `${y - config.obstacleSize/2}px`;
  elements.board.appendChild(obstacle);
  return obstacle;
}

// Obsługa rzucania kulką
function dropBall() {
  const currentBet = parseInt(elements.betInput.value);
  
  // Walidacja zakładu
  if (isNaN(currentBet) || currentBet < config.minBet) {
    showResult(`Minimalna stawka to ${config.minBet} PLN!`, 'warning');
    return;
  }
  
  if (state.balance < currentBet) {
    showResult('Masz za mało środków na koncie!', 'warning');
    return;
  }
  
  if (state.isDropping) return;
  
  state.isDropping = true;
  state.bet = currentBet;
  state.balance -= state.bet;
  state.stats.totalDrops++;
  
  saveToLocalStorage();
  updateUI();
  elements.dropButton.disabled = true;
  
  // Odtwórz dźwięk spadania kulki
  if (state.soundEnabled) {
    sounds.drop.currentTime = 0;
    sounds.drop.play();
  }
  
  // Utwórz kulkę
  const ball = document.createElement('div');
  ball.className = 'ball';
  ball.style.width = `${config.ballSize}px`;
  ball.style.height = `${config.ballSize}px`;
  elements.board.appendChild(ball);
  
  // Bardziej losowe początkowe położenie kulki
  const startXRange = config.boardWidth * 0.4; // 40% szerokości planszy w środku
  const startX = (config.boardWidth / 2) - (startXRange / 2) + (Math.random() * startXRange);
  
  ball.style.top = '0px';
  ball.style.left = `${startX - config.ballSize/2}px`;
  
  // Bardziej losowe początkowe parametry fizyki
  let posX = startX - config.ballSize/2;
  let posY = 0;
  // Bardziej zróżnicowana prędkość początkowa
  let velocityX = (Math.random() - 0.5) * config.initialVelocityRandomness;
  let velocityY = 0.5 + Math.random() * 0.5; // Nieco początkowej prędkości w dół
  
  // Śledzenie poprzednich kolizji dla uniknięcia wielokrotnych odbić
  let lastCollisionTime = 0;
  const collisionCooldown = 150; // ms
  
  // Animacja spadania kulki
  const dropInterval = setInterval(() => {
    // Okresowa zmiana współczynnika losowości dla bardziej nieprzewidywalnego ruchu
    const currentTime = Date.now();
    const phase = (currentTime % 2000) / 2000; // 0-1 okresowo co 2 sekundy
    const dynamicRandomFactor = config.randomFactor * (0.5 + Math.sin(phase * Math.PI * 2) * 0.5);
    
    // Losowe "mikrodrgania" i turbulencje
    const turbulenceX = (Math.random() - 0.5) * config.turbulence;
    const turbulenceY = (Math.random() - 0.5) * config.turbulence * 0.5; // Mniejsza turbulencja pionowa
    
    // Dodaj losowe odchylenie z dynamicznym współczynnikiem
    const randomX = (Math.random() - 0.5) * dynamicRandomFactor;
    velocityX += randomX + turbulenceX;
    velocityY += turbulenceY;
    
    // Zastosuj grawitację
    velocityY += config.gravity;
    
    // Zastosuj tarcie
    velocityX *= config.friction;
    velocityY *= config.friction;
    
    // Zachowaj poprzednią pozycję do wykrywania kolizji
    const prevX = posX;
    const prevY = posY;
    
    // Aktualizuj pozycję
    posX += velocityX;
    posY += velocityY;
    
    // Odbicia od ścian z losowym współczynnikiem odbicia
    if (posX <= 0) {
      posX = 0;
      // Losowy współczynnik odbicia
      const bounceFactor = config.bounceEnergyLoss * (0.9 + Math.random() * 0.2);
      velocityX = Math.abs(velocityX) * bounceFactor;
      
      // Dodaj efekt wizualny
      ball.classList.add('collision');
      setTimeout(() => {
        ball.classList.remove('collision');
      }, 100);
    }
    if (posX >= config.boardWidth - config.ballSize) {
      posX = config.boardWidth - config.ballSize;
      // Losowy współczynnik odbicia
      const bounceFactor = config.bounceEnergyLoss * (0.9 + Math.random() * 0.2);
      velocityX = -Math.abs(velocityX) * bounceFactor;
      
      // Dodaj efekt wizualny
      ball.classList.add('collision');
      setTimeout(() => {
        ball.classList.remove('collision');
      }, 100);
    }
    
    // Wykrywanie kolizji z przeszkodami
    const ballRadius = config.ballSize / 2;
    const ballCenterX = posX + ballRadius;
    const ballCenterY = posY + ballRadius;
    
    // Sprawdź kolizje tylko jeśli minął czas odnowienia kolizji
    if (currentTime - lastCollisionTime > collisionCooldown) {
      for (const obstacle of state.obstacles) {
        const dx = ballCenterX - obstacle.x;
        const dy = ballCenterY - obstacle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Wykryto kolizję
        if (distance < ballRadius + obstacle.radius) {
          lastCollisionTime = currentTime;
          
          // Obliczamy normalne odbicie
          const nx = dx / distance;
          const ny = dy / distance;
          
          // Skoryguj pozycję, aby uniknąć nakładania się
          const overlap = (ballRadius + obstacle.radius) - distance;
          posX += nx * overlap * 1.05; // Nieco więcej, by zapobiec zawieszeniom
          posY += ny * overlap * 1.05;
          
          // Obliczamy prędkość przed odbiciem
          const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
          
          // Odbicie z losowym czynnikiem energii
          const energyFactor = obstacle.type === 'bouncy' 
                            ? (0.9 + Math.random() * 0.3) // Bardziej sprężyste
                            : (config.bounceEnergyLoss * (0.8 + Math.random() * 0.4)); // Losowy współczynnik odbicia
          
          // Oblicz nową prędkość po odbiciu
          // Odbicie bazuje na normalnej powierzchni, ale dodajemy losowość
          const randomDeflection = (Math.random() - 0.5) * 0.4; // Losowe odchylenie ±20%
          
          velocityX = (velocityX - 2 * (velocityX * nx + velocityY * ny) * nx) * energyFactor;
          velocityY = (velocityY - 2 * (velocityX * nx + velocityY * ny) * ny) * energyFactor;
          
          // Dodajemy losowe odchylenie do kierunku odbicia
          velocityX += randomDeflection * velocityY;
          velocityY += randomDeflection * velocityX;
          
          // Ograniczenie maksymalnej prędkości po odbiciu
          const newSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
          if (newSpeed > speed * 1.5) {
            velocityX = (velocityX / newSpeed) * speed * 1.5;
            velocityY = (velocityY / newSpeed) * speed * 1.5;
          }
          
          // Efekt wizualny odbicia
          ball.classList.add('collision');
          obstacle.element.classList.add('obstacle-hit');
          
          setTimeout(() => {
            ball.classList.remove('collision');
            obstacle.element.classList.remove('obstacle-hit');
          }, 100);
          
          // Odtwórz dźwięk kolizji
          if (state.soundEnabled && sounds.collision) {
            sounds.collision.volume = 0.3;
            sounds.collision.currentTime = 0;
            sounds.collision.play();
          }
          
          break; // Obsługujemy tylko jedną kolizję na klatkę
        }
      }
    }
    
    // Aktualizuj pozycję kulki
    ball.style.top = `${posY}px`;
    ball.style.left = `${posX}px`;
    
    // Sprawdzenie, czy kulka osiągnęła dół
    if (posY >= config.boardHeight - config.ballSize) {
      clearInterval(dropInterval);
      
      // Oblicz slot, do którego trafiła kulka
      const slotWidth = config.boardWidth / config.cols;
      const slotIndex = Math.floor(posX / slotWidth);
      const boundedSlotIndex = Math.max(0, Math.min(config.cols - 1, slotIndex));
      const multiplier = config.multipliers[boundedSlotIndex] || 0;
      const win = Math.floor(multiplier * state.bet);
      
      // Podświetl slot, do którego wpadła kulka
      const slots = document.querySelectorAll('.slot-info');
      if (slots[boundedSlotIndex]) {
        slots[boundedSlotIndex].classList.add('highlight-slot');
        setTimeout(() => {
          slots[boundedSlotIndex].classList.remove('highlight-slot');
        }, 1500);
      }
      
      if (win > 0) {
        state.balance += win;
        state.stats.totalWins++;
        state.stats.highestWin = Math.max(state.stats.highestWin, win);
        
        if (state.soundEnabled) {
          (multiplier >= 4 ? sounds.jackpot : sounds.win).play();
        }
        
        showResult(`🎉 Wygrałeś ${win} PLN!`, 'success');
        elements.lastWinDisplay.textContent = `Ostatnia wygrana: ${win} PLN`;
      } else {
        showResult('💥 Pudło! Nic nie wygrałeś.', 'fail');
        elements.lastWinDisplay.textContent = `Ostatnia wygrana: 0 PLN`;
      }
      
      saveToLocalStorage();
      updateUI();
      
      // Reset stanu gry po krótkim czasie
      setTimeout(() => {
        ball.remove();
        elements.dropButton.disabled = false;
        state.isDropping = false;
      }, 1500);
    }
  }, config.ballDropSpeed);
}

// Funkcja pomocnicza do wyświetlania wyników
function showResult(message, type = '') {
  elements.resultDisplay.textContent = message;
  elements.resultDisplay.className = `result ${type}`;
}

// Funkcja zapisu stanu do localStorage
function saveToLocalStorage() {
  localStorage.setItem("balance", state.balance);
  localStorage.setItem("lastBet", state.bet);
  localStorage.setItem("pachinkoSoundEnabled", state.soundEnabled);
  localStorage.setItem("pachinkoTotalDrops", state.stats.totalDrops);
  localStorage.setItem("pachinkoTotalWins", state.stats.totalWins);
  localStorage.setItem("pachinkoHighestWin", state.stats.highestWin);
  localStorage.setItem("pachinkoTotalAdded", state.stats.totalAdded);
}

// Aktualizacja UI
function updateUI() {
  elements.balanceDisplay.textContent = `${state.balance.toFixed(2)}`;
  elements.totalDropsDisplay.textContent = state.stats.totalDrops;
  elements.totalWinsDisplay.textContent = state.stats.totalWins;
  elements.highestWinDisplay.textContent = `${state.stats.highestWin} PLN`;
  elements.totalAddedDisplay.textContent = `${state.stats.totalAdded} PLN`;
  const maxMultiplier = Math.max(...config.multipliers);
  elements.multiplierDisplay.textContent = `${state.bet * maxMultiplier} PLN`;
}

// Eventy
function setupEventListeners() {
  elements.dropButton.addEventListener('click', dropBall);
  elements.closeModal.addEventListener('click', () => {
    elements.helpModal.style.display = 'none';
  });
  window.addEventListener('click', (e) => {
    if (e.target === elements.helpModal) {
      elements.helpModal.style.display = 'none';
    }
  });
  elements.helpButton.addEventListener('click', () => {
    elements.helpModal.style.display = 'block';
  });
  elements.soundButton.addEventListener('click', toggleSound);
  elements.resetButton.addEventListener('click', resetGame);
  
  // Obsługa zmiany layoutu przeszkód
  document.getElementById('regenerateObstacles')?.addEventListener('click', () => {
    // Usuń stare przeszkody z DOM
    state.obstacles.forEach(obstacle => {
      if (obstacle.element) obstacle.element.remove();
    });
    generateObstacles();
  });
  
  // Dodajemy obsługę przycisków zmiany zakładu jeśli istnieją
  document.querySelectorAll('.bet-change-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      changeBet(amount);
    });
  });
  
  // Szybkie ustawienie stawki jeśli istnieją przyciski
  document.querySelectorAll('.quick-bet-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = parseInt(btn.dataset.amount);
      setBet(amount);
    });
  });
}

// Dźwięk ON/OFF
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  updateSoundButton();
  saveToLocalStorage();
}

function updateSoundButton() {
  elements.soundButton.innerHTML = `
    <i class="fas ${state.soundEnabled ? 'fa-volume-up' : 'fa-volume-mute'}"></i>
    Dźwięk: ${state.soundEnabled ? 'WŁ' : 'WYŁ'}
  `;
}

// Zmiana zakładu
function changeBet(amount) {
  const newBet = Math.max(config.minBet, parseInt(elements.betInput.value) + amount);
  elements.betInput.value = newBet;
  state.bet = newBet;
  updateUI();
}

// Ustaw konkretną stawkę
function setBet(amount) {
  elements.betInput.value = amount;
  state.bet = amount;
  updateUI();
}

// Reset gry
function resetGame() {
  if (confirm("Na pewno chcesz zresetować postęp?")) {
    localStorage.clear();
    location.reload();
  }
}

// Dodatkowy CSS dla wizualnego wyglądu
function addStyles() {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    /* Zmienne CSS z globalnych stylów */
    :root {
      --primary-color: #0a5c36;
      --primary-dark: #07482a;
      --primary-light: #0d7a47;
      --accent-color: #ffd700;
      --text-color: #ffffff;
      --text-secondary: #cccccc;
      --background-dark: #121f17;
      --background-medium: #1a2c21;
      --background-light: #223a2b;
      --border-color: #2a4d38;
      --win-color: #4caf50;
      --lose-color: #f44336;
      --button-hover: #0d7a47;
      --button-active: #07482a;
      --shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      --transition: all 0.3s ease;
    }
    
    #pachinkoBoard {
      background-color: var(--background-medium);
      border-radius: 10px;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
      position: relative;
    }
    
    .slots-container {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      padding: 0 5px;
      height: 40px;
    }
    
    .slot-info {
      flex: 1;
      text-align: center;
      padding: 8px;
      border-radius: 4px;
      margin: 0 2px;
      color: var(--text-color);
      background-color: var(--background-light);
      transition: var(--transition);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .slot-info.highlight-slot {
      background-color: var(--primary-color);
      color: white;
      font-weight: 700;
      transform: scale(1.05);
    }
    
    .obstacle {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #ffffff, #aaaaaa);
      box-shadow: 0 0 5px rgba(255, 255, 255, 0.7);
      transition: transform 0.1s, box-shadow 0.1s;
      z-index: 5;
    }
    
    .obstacle-hit {
      transform: scale(1.2);
      box-shadow: 0 0 10px rgba(255, 255, 150, 0.9);
    }
    
    .ball {
      background: radial-gradient(circle at 30% 30%, #ff6666, #ff0000);
      border-radius: 50%;
      position: absolute;
      z-index: 10;
      box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
      transition: box-shadow 0.2s;
    }
    
    .ball.collision {
      box-shadow: 0 0 15px rgba(255, 255, 0, 0.8);
    }
    
    .result {
      transition: var(--transition);
    }
    
    .result.success {
      color: var(--win-color);
      font-weight: bold;
    }
    
    .result.fail {
      color: var(--lose-color);
    }
    
    .result.warning {
      color: var(--accent-color);
    }
    
    /* Dodatkowe style dla przycisków */
    button {
      background-color: var(--primary-color);
      color: var(--text-color);
      border: none;
      border-radius: 4px;
      padding: 8px 12px;
      cursor: pointer;
      transition: var(--transition);
    }
    
    button:hover {
      background-color: var(--button-hover);
    }
    
    button:active {
      background-color: var(--button-active);
    }
    
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    #regenerateObstacles {
      position: absolute;
      top: 10px;
      right: 10px;
      font-size: 0.8em;
      padding: 4px 8px;
      z-index: 100;
    }
  `;
  document.head.appendChild(styleSheet);
}

// Start gry
document.addEventListener('DOMContentLoaded', () => {
  initGame();
  addStyles();
  
  // Dodaj przycisk do regeneracji przeszkód
  const regenerateBtn = document.createElement('button');
  regenerateBtn.id = 'regenerateObstacles';
  regenerateBtn.textContent = 'Losuj przeszkody';
  elements.board.appendChild(regenerateBtn);
});

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