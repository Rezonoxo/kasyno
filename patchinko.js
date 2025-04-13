// Patchinko - gra JS z animacją kulki i logiką gry
let balance = parseInt(localStorage.getItem("balance")) || 1000;
let totalDrops = parseInt(localStorage.getItem("totalDrops")) || 0;
let totalWins = parseInt(localStorage.getItem("totalWins")) || 0;
let highestWin = parseInt(localStorage.getItem("highestWin")) || 0;
let lastBet = parseInt(localStorage.getItem("lastBet")) || 100;
let totalAdded = parseInt(localStorage.getItem("totalAdded")) || 0;

document.getElementById("betInput").value = lastBet;

function updateBalanceDisplay() {
  document.getElementById("balance").textContent = balance;
}

function updateStats() {
  document.getElementById("totalDrops").textContent = totalDrops;
  document.getElementById("totalWins").textContent = totalWins;
  document.getElementById("highestWin").textContent = highestWin;
  document.getElementById("totalAdded").textContent = totalAdded;
}

function saveToLocalStorage() {
  localStorage.setItem("balance", balance);
  localStorage.setItem("totalDrops", totalDrops);
  localStorage.setItem("totalWins", totalWins);
  localStorage.setItem("highestWin", highestWin);
  localStorage.setItem("lastBet", document.getElementById("betInput").value);
  localStorage.setItem("totalAdded", totalAdded);
}

function adjustBalance() {
  const value = parseInt(document.getElementById("adjustValue")?.value);
  if (!isNaN(value)) {
    balance += value;
    totalAdded += value;
    updateBalanceDisplay();
    updateStats();
    saveToLocalStorage();
  }
}

function resetGame() {
  if (confirm("Zresetować wszystko?")) {
    balance = 1000;
    totalDrops = 0;
    totalWins = 0;
    highestWin = 0;
    totalAdded = 0;
    saveToLocalStorage();
    updateBalanceDisplay();
    updateStats();
    document.getElementById("result").textContent = "";
  }
}

function createBoard() {
    const board = document.querySelector(".patchinko-board");
    board.innerHTML = "";  // Resetowanie planszy przed utworzeniem nowych elementów
  
    const rows = 8;  // Liczba wierszy pinów
    const cols = 7;  // Liczba kolumn slotów
    const pinSpacingX = 40;
    const pinSpacingY = 40;
    const offsetX = 20;  // Przesunięcie pinów w zależności od wiersza
  
    // Tworzymy pinów
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols - (y % 2); x++) {
        const pin = document.createElement("div");
        pin.classList.add("pin");
        pin.style.top = `${y * pinSpacingY + 20}px`;
        pin.style.left = `${x * pinSpacingX + (y % 2 === 0 ? offsetX : offsetX / 2)}px`;
        board.appendChild(pin);
      }
    }
  
    // Tworzymy sloty w dolnej części planszy
    for (let i = 0; i < cols; i++) {
      const slot = document.createElement("div");
      slot.classList.add("slot");
      slot.dataset.slot = i;  // Przypisujemy unikalny numer do slotu
      slot.style.left = `${i * 40}px`;  // Rozstawiamy sloty równomiernie
      board.appendChild(slot);
    }
  }
  
  

  function dropBall() {
    const board = document.querySelector(".patchinko-board");
    const ball = document.createElement("div");
    ball.classList.add("ball");
    ball.style.top = "0px";  // Startowa pozycja kulki
    ball.style.left = "140px";  // Pozycja startowa w środku
    board.appendChild(ball);
  
    let top = 0;
    let left = 140;
  
    const dropInterval = setInterval(() => {
      top += 40;
      left += Math.random() < 0.5 ? -20 : 20;  // Losowy ruch kulki w lewo/prawo
  
      ball.style.top = `${top}px`;
      ball.style.left = `${left}px`;
  
      if (top >= 360) {
        clearInterval(dropInterval);
        // Oblicz slot, do którego trafiła kulka na podstawie jej lewego marginesu
        const slot = Math.min(6, Math.max(0, Math.round((left - 20) / 40)));
        handleResult(slot);  // Obsługuje wynik
      }
    }, 100);
  }
  
function handleResult(slot) {
    const resultText = document.querySelector(".result");
    const bet = parseInt(document.querySelector(".bet-setting input").value);
    const multipliers = [0, 0.5, 1.5, 3, 1.5, 0.5, 0]; // Zmniejszone mnożniki dla slotów

    const multiplier = multipliers[slot] || 0;
    if (multiplier > 0) {
        const win = bet * multiplier;
        balance += win;
        totalWins++;
        highestWin = Math.max(highestWin, win);
        resultText.textContent = `🎯 Trafiłeś slot ${slot}! Mnożnik ${multiplier}x → ${win} 💰`;
        resultText.className = "result win";
    } else {
        resultText.textContent = "💥 Pudło! Spróbuj ponownie!";
        resultText.className = "result lose";
    }

    updateBalanceDisplay();
    updateStats();
    saveToLocalStorage();
}
  

// Init
createBoard();
updateBalanceDisplay();
updateStats();
document.getElementById("resetButton").addEventListener("click", resetGame);
