// Dane gry
let balance = parseInt(localStorage.getItem("balance")) || 1000;
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

// Elementy DOM
const boardElement = document.getElementById("board");
const betInput = document.getElementById("betInput");
const bombsInput = document.getElementById("bombsInput");
const multiplierValue = document.getElementById("multiplierValue");
const startButton = document.getElementById("startButton");
const cashoutButton = document.getElementById("cashoutButton");
const resultDiv = document.getElementById("result");

// Inicjalizacja
updateBalanceDisplay();
updateStats();
updateMultiplier();

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
  const baseMultiplier = 1 + (bombs * 0.1);
  multiplierValue.textContent = baseMultiplier.toFixed(2);
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
  
  currentBet = bet;
  balance -= bet;
  revealedCells = 0;
  multiplier = 1 + (bombsCount * 0.1);
  gameActive = true;
  
  updateBalanceDisplay();
  createBoard();
  placeBombs();
  
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
  boardElement.style.gridTemplateColumns = "repeat(5, 1fr)";
  
  for (let i = 0; i < 25; i++) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.index = i;
    cell.addEventListener("click", () => handleCellClick(i));
    boardElement.appendChild(cell);
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
  cell.classList.add("revealed");
  
  if (bombPositions.includes(index)) {
    // Trafiono na bombę
    cell.classList.add("bomb");
    cell.innerHTML = "💣";
    endGame(false);
  } else {
    // Bezpieczne pole
    revealedCells++;
    multiplier += 0.05 * bombsCount;
    multiplierValue.textContent = multiplier.toFixed(2);
    cell.innerHTML = "💰";
    
    // Sprawdź czy wszystkie bezpieczne pola zostały odkryte
    if (revealedCells === 25 - bombsCount) {
      endGame(true);
    }
  }
}

function cashOut() {
  if (gameActive && revealedCells > 0) {
    endGame(true, true);
  }
}

function endGame(win, cashout = false) {
  gameActive = false;
  
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
}

function resetGame() {
  if (confirm("Czy na pewno chcesz zresetować statystyki i balans?")) {
    balance = 1000;
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
  }
}

// Event listeners
bombsInput.addEventListener("input", updateMultiplier);
document.getElementById("resetButton").addEventListener("click", resetGame);