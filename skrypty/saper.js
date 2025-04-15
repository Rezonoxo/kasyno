// Dane gry
let balance = parseInt(localStorage.getItem("balance")) || 0;
let totalGames = parseInt(localStorage.getItem("totalGames")) || 0;
let totalWins = parseInt(localStorage.getItem("totalWins")) || 0;
let highestWin = parseInt(localStorage.getItem("highestWin")) || 0;
let totalAdded = parseInt(localStorage.getItem("totalAdded")) || 0;

// Zmienne gry
let currentBet = 0;
let bombsCount = 0;
let revealedCells = 0;
let multiplier = 1;
let gameActive = false;
let bombPositions = [];
let nextClickMultiplier = 0; // Przechowuje wartość mnożnika za następne kliknięcie

// Elementy DOM
const boardElement = document.getElementById("board");
const betInput = document.getElementById("betInput");
const bombsInput = document.getElementById("bombsInput");
const multiplierValue = document.getElementById("multiplierValue");
const startButton = document.getElementById("startButton");
const cashoutButton = document.getElementById("cashoutButton");
const resultDiv = document.getElementById("result");
const nextMultiplierDiv = document.createElement("div"); // Nowy element do wyświetlania potencjalnego przyrostu mnożnika
const currentPayoutDiv = document.createElement("div"); // Nowy element do wyświetlania aktualnej kwoty do wypłaty

// Inicjalizacja
updateBalanceDisplay();
updateStats();
updateMultiplier();

// Dodanie elementu do wyświetlania mnożnika za następne kliknięcie
nextMultiplierDiv.id = "nextMultiplier";
nextMultiplierDiv.className = "next-multiplier";
document.querySelector(".game-controls")?.appendChild(nextMultiplierDiv);

// Dodanie elementu do wyświetlania aktualnej kwoty do wypłaty
currentPayoutDiv.id = "currentPayout";
currentPayoutDiv.className = "current-payout";
document.querySelector(".game-controls")?.appendChild(currentPayoutDiv);

// Funkcje
function updateBalanceDisplay() {
  document.getElementById("balance").textContent = balance;
}

function updateStats() {
  document.getElementById("totalGames").textContent = totalGames;
  document.getElementById("totalWins").textContent = totalWins;
  document.getElementById("highestWin").textContent = highestWin;
  document.getElementById("totalAdded").textContent = totalAdded;
}

function saveToLocalStorage() {
  localStorage.setItem("balance", balance);
  localStorage.setItem("totalGames", totalGames);
  localStorage.setItem("totalWins", totalWins);
  localStorage.setItem("highestWin", highestWin);
  localStorage.setItem("totalAdded", totalAdded);
}

function adjustBalance() {
  const value = parseInt(document.getElementById("adjustValue").value);
  if (!isNaN(value)) {
    balance += value;
    totalAdded += value;
    updateBalanceDisplay();
    updateStats();
    saveToLocalStorage();
  }
}

function updateMultiplier() {
  const bombs = parseInt(bombsInput.value) || 5;
  // Zmniejszony bazowy mnożnik dla mniejszej liczby bomb
  const baseMultiplier = 1 + (bombs * 0.1) + (Math.pow(bombs, 1.1) * 0.003);
  multiplierValue.textContent = baseMultiplier.toFixed(2);
}

// Aktualizacja wyświetlania aktualnej kwoty do wypłaty
function updateCurrentPayout() {
  if (!gameActive) {
    currentPayoutDiv.style.display = "none";
    return;
  }
  
  const currentPayout = Math.round(currentBet * multiplier);
  currentPayoutDiv.style.display = "block";
  currentPayoutDiv.innerHTML = `Aktualna wypłata: <span class="payout-value">${currentPayout}zł</span>`;
  
  // Dodajemy kolorowanie w zależności od zysku
  const profit = currentPayout - currentBet;
  if (profit > currentBet * 0.5) {
    currentPayoutDiv.classList.add("high-profit");
    currentPayoutDiv.classList.remove("medium-profit", "low-profit", "no-profit");
  } else if (profit > 0) {
    currentPayoutDiv.classList.add("medium-profit");
    currentPayoutDiv.classList.remove("high-profit", "low-profit", "no-profit");
  } else if (profit === 0) {
    currentPayoutDiv.classList.add("no-profit");
    currentPayoutDiv.classList.remove("high-profit", "medium-profit", "low-profit");
  } else {
    currentPayoutDiv.classList.add("low-profit");
    currentPayoutDiv.classList.remove("high-profit", "medium-profit", "no-profit");
  }
}

function startGame() {
  const bet = parseInt(betInput.value);
  bombsCount = parseInt(bombsInput.value);

  if (isNaN(bet) || bet <= 0) {
    showResult("Podaj poprawną stawkę!", "error");
    return;
  }

  if (bet > balance) {
    showResult("Masz za mało gotówki!", "error");
    return;
  }

  if (isNaN(bombsCount) || bombsCount < 1 || bombsCount > 24) {
    showResult("Liczba bomb musi być między 1 a 24!", "error");
    return;
  }

  // Ustalamy stawkę tylko raz
  currentBet = bet;
  // Pobieramy stawkę z balansu tylko raz
  balance -= bet;
  
  revealedCells = 0;
  // Zmniejszony startowy mnożnik dla mniejszej liczby bomb
  multiplier = 1 + (bombsCount * 0.1) + (Math.pow(bombsCount, 1.1) * 0.003);
  gameActive = true;

  updateBalanceDisplay();
  createBoard();
  placeBombs();
  updateNextMultiplierDisplay(); // Wyświetlamy potencjalny mnożnik dla pierwszego kliknięcia
  updateCurrentPayout(); // Wyświetlamy aktualną kwotę do wypłaty

  startButton.disabled = true;
  cashoutButton.disabled = false;
  betInput.disabled = true;
  bombsInput.disabled = true;

  totalGames++;
  saveToLocalStorage();
  updateStats();

  showResult(`Gra rozpoczęta! Stawka: ${bet} zł, Bomby: ${bombsCount}`, "info");
}

function createBoard() {
  boardElement.innerHTML = "";
  boardElement.className = "board"; // Upewniamy się, że ma właściwą klasę
  boardElement.style.gridTemplateColumns = "repeat(5, 1fr)";

  for (let i = 0; i < 25; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    
    // Dodajemy efekt hover z wyświetlaniem potencjalnego mnożnika
    cell.addEventListener("mouseenter", () => {
      if (gameActive && !cell.classList.contains("revealed")) {
        cell.classList.add("cell-hover");
        // Wyświetlamy potencjalny mnożnik w komórce
        showCellMultiplierPreview(cell);
      }
    });
    
    cell.addEventListener("mouseleave", () => {
      cell.classList.remove("cell-hover");
      // Usuwamy podgląd mnożnika
      if (cell.querySelector(".multiplier-preview")) {
        cell.querySelector(".multiplier-preview").remove();
      }
    });
    
    cell.addEventListener("click", () => handleCellClick(i));
    boardElement.appendChild(cell);
  }
}

// Funkcja do obliczania i pokazywania potencjalnego mnożnika dla komórki
function showCellMultiplierPreview(cell) {
  if (!gameActive || cell.classList.contains("revealed")) return;
  
  // Obliczamy potencjalny przyrost mnożnika dla tej komórki
  const increment = calculateMultiplierIncrement();
  
  // Tworzymy i wyświetlamy podgląd mnożnika
  const preview = document.createElement("div");
  preview.className = "multiplier-preview";
  preview.textContent = `+${increment.toFixed(2)}x`;
  
  // Usuwamy poprzedni podgląd, jeśli istnieje
  if (cell.querySelector(".multiplier-preview")) {
    cell.querySelector(".multiplier-preview").remove();
  }
  
  cell.appendChild(preview);
}

function calculateMultiplierIncrement() {
  // Logarytmiczna progresja mnożnika - bardziej wartościowa na początku, wolniejsza na końcu
  const totalSafeCells = 25 - bombsCount;
  const remainingSafeCells = totalSafeCells - revealedCells;
  
  if (remainingSafeCells <= 0) return 0;
  
  // Mniejsza baza dla niskiego ryzyka
  let baseIncrement = 0.01 + (bombsCount * 0.005);
  
  // Czynnik ryzyka - im mniej bezpiecznych pól pozostało, tym większy przyrost
  const riskFactor = Math.pow((totalSafeCells - remainingSafeCells + 1) / totalSafeCells, 0.7);
  
  // Czynnik trudności - im więcej bomb, tym większy przyrost
  const difficultyFactor = Math.pow(bombsCount / 24, 0.7);
  
  // Czynnik progresji - zwiększa przyrost, gdy gracz odkrywa więcej pól
  const progressionFactor = 1 + (revealedCells / totalSafeCells);
  
  // Im mniej bezpiecznych pól zostało, tym większa szansa na trafienie bomby
  const bombChanceFactor = Math.pow(bombsCount / remainingSafeCells, 0.5);
  
  // Finalny przyrost mnożnika
  const increment = baseIncrement * (1 + riskFactor) * (1 + difficultyFactor) * progressionFactor * (1 + bombChanceFactor);
  
  // Ograniczenie maksymalnego przyrostu dla balansu
  return Math.min(increment, 2.0);
}

// Aktualizacja wyświetlania potencjalnego mnożnika za następne kliknięcie
function updateNextMultiplierDisplay() {
  if (!gameActive) {
    nextMultiplierDiv.style.display = "none";
    return;
  }
  
  const increment = calculateMultiplierIncrement();
  nextMultiplierDiv.style.display = "block";
  nextMultiplierDiv.innerHTML = `Następne kliknięcie: <span class="multiplier-highlight">+${increment.toFixed(2)}x</span> <span class="potential-win">(${Math.round(currentBet * (multiplier + increment))}zł)</span>`;
  
  // Dodajemy wizualne podkreślenie opłacalności następnego kliknięcia
  const potentialNextWin = currentBet * (multiplier + increment);
  const currentWin = currentBet * multiplier;
  const gainPercentage = ((potentialNextWin - currentWin) / currentWin) * 100;
  
  // Dodajemy klasę bazującą na opłacalności
  if (gainPercentage > 15) {
    nextMultiplierDiv.classList.add("high-gain");
    nextMultiplierDiv.classList.remove("medium-gain", "low-gain");
  } else if (gainPercentage > 8) {
    nextMultiplierDiv.classList.add("medium-gain");
    nextMultiplierDiv.classList.remove("high-gain", "low-gain");
  } else {
    nextMultiplierDiv.classList.add("low-gain");
    nextMultiplierDiv.classList.remove("high-gain", "medium-gain");
  }
}

function placeBombs() {
  bombPositions = [];
  const totalCells = 25;

  while (bombPositions.length < bombsCount) {
    const randomPos = Math.floor(Math.random() * totalCells);
    if (!bombPositions.includes(randomPos)) {
      bombPositions.push(randomPos);
    }
  }
}

function handleCellClick(index) {
  if (!gameActive || document.querySelector(`.cell[data-index="${index}"]`).classList.contains("revealed")) {
    return;
  }

  const cell = document.querySelector(`.cell[data-index="${index}"]`);
  
  // Animacja kliknięcia
  cell.classList.add("cell-click");
  setTimeout(() => {
    cell.classList.remove("cell-click");
    revealCell(cell, index);
  }, 150);
}

function revealCell(cell, index) {
  cell.classList.add("revealed");

  if (bombPositions.includes(index)) {
    // Trafiono bombę
    cell.classList.add("bomb");
    cell.innerHTML = "💣";
    createExplosion(cell);
    endGame(false);
  } else {
    // Poprawna komórka
    revealedCells++;
    
    // Obliczamy przyrost mnożnika
    const increment = calculateMultiplierIncrement();
    multiplier += increment;
    
    // Aktualizujemy wyświetlanie mnożnika z animacją
    animateMultiplier(multiplier - increment, multiplier);
    
    // Pokazujemy wartość przyrostu
    showMultiplierIncrease(increment);
    
    // Dodajemy wartość kafelka (można dodać losowe wartości dla urozmaicenia)
    cell.innerHTML = "💰";
    
    // Aktualizujemy informacje o kolejnym przyroście mnożnika i aktualnej wypłacie
    updateNextMultiplierDisplay();
    updateCurrentPayout();

    // Sprawdź czy wszystkie bezpieczne pola zostały odkryte
    const totalSafeCells = 25 - bombsCount;
    if (revealedCells === totalSafeCells) {
      // Sprawdź czy odgadnięto ponad 50% pól
      createConfetti();
      endGame(true);
    }
  }
}

// Animacja zmiany mnożnika
function animateMultiplier(from, to) {
  const duration = 500; // ms
  const start = performance.now();
  
  function update(timestamp) {
    const elapsed = timestamp - start;
    const progress = Math.min(elapsed / duration, 1);
    const current = from + (to - from) * progress;
    multiplierValue.textContent = current.toFixed(2);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

// Wyświetlanie informacji o przyroście mnożnika
function showMultiplierIncrease(increment) {
  const notification = document.createElement("div");
  notification.className = "multiplier-notification";
  notification.textContent = `+${increment.toFixed(2)}x`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add("fade-out");
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 1000);
}

function createExplosion(element) {
  const explosion = document.createElement("div");
  explosion.className = "explosion";
  element.appendChild(explosion);
  
  // Dodajemy więcej cząsteczek wybuchu dla lepszego efektu
  for (let i = 0; i < 20; i++) {
    const particle = document.createElement("div");
    particle.className = "explosion-particle";
    
    // Losowe pozycje i kolory
    const size = Math.random() * 8 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.backgroundColor = ['#ff5e57', '#ff9966', '#ffcc33'][Math.floor(Math.random() * 3)];
    
    // Animacja
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 100 + 50;
    particle.style.left = "50%";
    particle.style.top = "50%";
    particle.style.transform = `translate(-50%, -50%)`;
    
    element.appendChild(particle);
    
    // Animacja cząsteczek
    setTimeout(() => {
      particle.style.transform = `translate(${Math.cos(angle) * speed}%, ${Math.sin(angle) * speed}%)`;
      particle.style.opacity = "0";
    }, 10);
  }
  
  // Wstrząśnij całą planszą
  boardElement.classList.add("shake");
  setTimeout(() => {
    boardElement.classList.remove("shake");
    explosion.remove();
  }, 1000);
}

// Ulepszona funkcja konfetti - na całym ekranie przez 1 sekundę
function createConfetti() {
  const confettiContainer = document.createElement("div");
  confettiContainer.className = "confetti-container";
  document.body.appendChild(confettiContainer);
  
  // Tworzenie konfetti
  for (let i = 0; i < 150; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti";
    
    // Bogatsze kolory
    const colors = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590'];
    const size = Math.random() * 10 + 5;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size}px`;
    confetti.style.backgroundColor = color;
    confetti.style.left = `${Math.random() * 100}%`;
    confetti.style.top = `-${Math.random() * 20 + 10}px`;
    
    confettiContainer.appendChild(confetti);
  }
  
  // Usunięcie efektu po 1 sekundzie
  setTimeout(() => {
    confettiContainer.remove();
  }, 5000);
}

function cashOut() {
  if (gameActive && revealedCells > 0) {
    endGame(true, true);
  }
}

function endGame(win, cashout = false) {
  gameActive = false;
  
  // Ukryj informacje o przyszłym mnożniku i aktualnej wypłacie
  nextMultiplierDiv.style.display = "none";
  currentPayoutDiv.style.display = "none";

  // Odkryj wszystkie bomby
  bombPositions.forEach(pos => {
    const cell = document.querySelector(`.cell[data-index="${pos}"]`);
    if (!cell.classList.contains("revealed")) {
      cell.classList.add("revealed", "bomb");
      cell.innerHTML = "💣";
    }
  });

  if (win) {
    const winAmount = Math.round(currentBet * multiplier);
    balance += winAmount;
    
    // Efekty wizualne przy wygranej
    if (cashout) {
      showResult(`Wypłacono ${winAmount} zł (Mnożnik: ${multiplier.toFixed(2)}x)!`, "win");
    } else {
      showResult(`Wygrałeś ${winAmount} zł (Mnożnik: ${multiplier.toFixed(2)}x)!`, "win");
    }
    
    totalWins++;
    highestWin = Math.max(highestWin, winAmount);
  } else {
    showResult(`Trafiłeś na bombę! Straciłeś ${currentBet} zł.`, "lose");
  }

  updateBalanceDisplay();
  updateStats();
  saveToLocalStorage();

  startButton.disabled = false;
  cashoutButton.disabled = true;
  betInput.disabled = false;
  bombsInput.disabled = false;
}

function showResult(message, type) {
  resultDiv.textContent = message;
  resultDiv.className = "result " + type;
  
  // Animacja wyświetlania wyniku
  resultDiv.style.animation = "none";
  setTimeout(() => {
    resultDiv.style.animation = "result-appear 0.5s forwards";
  }, 10);
}

function resetGame() {
  if (confirm("Czy na pewno chcesz zresetować statystyki i balans?")) {
    balance = 0;
    totalGames = 0;
    totalWins = 0;
    highestWin = 0;
    totalAdded = 0;
    saveToLocalStorage();
    updateBalanceDisplay();
    updateStats();
    boardElement.innerHTML = "";
    resultDiv.textContent = "";
    resultDiv.className = "result";
    nextMultiplierDiv.style.display = "none";
    currentPayoutDiv.style.display = "none";
  }
}

// Event listeners
bombsInput.addEventListener("input", updateMultiplier);
document.getElementById("adjustButton")?.addEventListener("click", adjustBalance);
cashoutButton.addEventListener("click", cashOut);