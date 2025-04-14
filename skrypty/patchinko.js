// Patchinko - gra JS z animacją kulki i logiką gry
let balance = parseInt(localStorage.getItem("balance")) || 0;
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
    balance = 0;
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
  const pinSpacingX = 40;  // Rozstawienie pinów poziomo
  const pinSpacingY = 40;  // Rozstawienie pinów pionowo
  const offsetX = 20;  // Przesunięcie pinów w zależności od wiersza

  // Tworzymy pinów w kształcie rombu/hexagonu (jak w Stake)
  for (let y = 0; y < rows; y++) {
      const pinsInRow = cols;  // Każdy wiersz ma tyle samo pinów
      const rowOffset = (y % 2) * (pinSpacingX / 2);  // Przesunięcie co drugi wiersz

      for (let x = 0; x < pinsInRow; x++) {
          const pin = document.createElement("div");
          pin.classList.add("pin");
          pin.style.top = `${y * pinSpacingY + 20}px`;
          pin.style.left = `${x * pinSpacingX + rowOffset + offsetX}px`;
          board.appendChild(pin);
      }
  }

  // Tworzymy sloty w dolnej części planszy
  for (let i = 0; i < cols; i++) {
      const slot = document.createElement("div");
      slot.classList.add("slot");
      slot.dataset.slot = i;  // Przypisujemy unikalny numer do slotu
      slot.style.left = `${i * 41}px`;  // Rozstawiamy sloty równomiernie
      board.appendChild(slot);
  }
}

function dropBall() {
  const bet = parseInt(document.querySelector(".bet-setting input").value);
  const resultText = document.querySelector(".result");

  if (isNaN(bet) || bet < 10) {
    resultText.textContent = "Minimalna stawka to 10 PLN!";
    resultText.className = "result lose";
    return;
  }

  if (balance < bet) {
    resultText.textContent = "Masz za mało gotówki, żeby grać!";
    resultText.className = "result lose";
    return;
  }

  balance -= bet;
  totalDrops++;
  updateBalanceDisplay();
  updateStats();
  saveToLocalStorage();

  const board = document.querySelector(".patchinko-board");
  const ball = document.createElement("div");
  ball.classList.add("ball");
  ball.style.top = "0px";
  ball.style.left = "140px";
  board.appendChild(ball);

  let top = 0;
  let left = 150;
  let velocityX = 0;
  let frameCount = 0;

  const dropInterval = setInterval(() => {
    frameCount++;

    top += 15 + Math.sin(frameCount * 0.1) * 2;
    velocityX += (Math.random() - 0.5) * 15;
    left += velocityX;

    if (top > 200) {
      top += 1 + (top - 200) * 0.02;
    }

    if (left < 20) {
      left = 20;
      velocityX *= -0.6;
    } else if (left > 280) {
      left = 280;
      velocityX *= -0.6;
    }

    ball.style.top = `${top}px`;
    ball.style.left = `${left}px`;

    const boardHeight = board.clientHeight;
    const endPosition = boardHeight - 40;

    if (top >= endPosition) {
      clearInterval(dropInterval);

      const slotWidth = 41;
      const slotIndex = Math.max(0, Math.min(6, Math.round((left - 20) / slotWidth)));

      // Ustawienie kulki dokładnie na środek slotu
      const slotCenter = 20 + slotIndex * slotWidth;
      ball.style.left = `${slotCenter}px`;

      setTimeout(() => {
        handleResult(slotIndex);
        board.removeChild(ball);
      }, 300);
    }
  }, 100);
}


function handleResult(slot) {
    const resultText = document.querySelector(".result");
    const bet = parseInt(document.querySelector(".bet-setting input").value);
    
    // Mnożniki jak w Stake (bardziej ryzykowne)
    const multipliers = [0, 0.5, 1, 4, 1, 0.5, 0];
    
    // Podpisy stawek dla slotów
    const slotNames = [
      "Slot 1: ❌", 
      "Slot 2: 0.5x", 
      "Slot 3: 1x", 
      "Slot 4: 4x", 
      "Slot 5: 1x", 
      "Slot 6: 0.5x", 
      "Slot 7: ❌"
    ];

    const multiplier = multipliers[slot] || 0;
    const slotName = slotNames[slot];

    if (multiplier > 0) {
        const win = Math.floor(bet * multiplier);
        balance += win;
        totalWins++;
        highestWin = Math.max(highestWin, win);
        resultText.textContent = `🎯 Trafiłeś ${slotName} → Wygrałeś: ${win} wPLN 💰`;
        resultText.className = "result win";
    } else {
        resultText.textContent = `💥 Pudło! Trafiłeś ${slotName}. Spróbuj ponownie!`;
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