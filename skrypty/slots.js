let balance = parseInt(localStorage.getItem("balance")) || 0;
const winMultiplier = 10;
let totalSpins = parseInt(localStorage.getItem("totalSpins")) || 0;
let totalWins = parseInt(localStorage.getItem("totalWins")) || 0;
let highestWin = parseInt(localStorage.getItem("highestWin")) || 0;
let lastBet = parseInt(localStorage.getItem("lastBet")) || 100;

document.getElementById("betInput").value = lastBet;

function updateBalanceDisplay() {
  document.getElementById("balance").textContent = balance;
}

function saveToLocalStorage() {
  localStorage.setItem("balance", balance);
  localStorage.setItem("totalSpins", totalSpins);
  localStorage.setItem("totalWins", totalWins);
  localStorage.setItem("highestWin", highestWin);
  localStorage.setItem("lastBet", document.getElementById("betInput").value);
}

function adjustBalance() {
  const value = parseInt(document.getElementById("adjustValue").value);
  if (!isNaN(value)) {
    balance += value;
    updateBalanceDisplay();
    updateStats();
    saveToLocalStorage();
  }
}
let totalAdded = parseInt(localStorage.getItem("totalAdded")) || 0;

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

function saveToLocalStorage() {
    localStorage.setItem("balance", balance);
    localStorage.setItem("totalSpins", totalSpins);
    localStorage.setItem("totalWins", totalWins);
    localStorage.setItem("highestWin", highestWin);
    localStorage.setItem("lastBet", document.getElementById("betInput").value);
    localStorage.setItem("totalAdded", totalAdded);
}

function updateStats() {
  document.getElementById("totalSpins").textContent = totalSpins;
  document.getElementById("totalWins").textContent = totalWins;
  document.getElementById("highestWin").textContent = highestWin;
  document.getElementById("totalAdded").textContent = totalAdded;
}

function startSpin() {
  const bet = parseInt(document.getElementById("betInput").value);
  if (isNaN(bet) || bet <= 0) {
    alert("Podaj poprawną stawkę!");
    return;
  }
  if (balance < bet) {
    alert("Masz za mało gotówki, żeby grać!");
    return;
  }

  balance -= bet;
  updateBalanceDisplay();
  document.getElementById("spinButton").disabled = true;
  document.getElementById("result").textContent = "";
  document.getElementById("result").className = "result";
  totalSpins++;
  saveToLocalStorage();
  updateStats();

  const symbols = ["🍒", "🍋", "🍉", "🔔", "💎", "7️⃣", "🍀", "⭐"];
  const weights = [30, 25, 20, 15, 5, 3, 1, 1];
  const symbolPool = weights.flatMap((weight, index) => Array(weight).fill(symbols[index]));

  const slots = document.querySelectorAll('.slot');
  slots.forEach(slot => slot.classList.add('spinning'));

  const spinTime = 2000;
  const interval = 50;
  let elapsed = 0;

  const spinInterval = setInterval(() => {
    slots.forEach(slot => {
      slot.textContent = symbolPool[Math.floor(Math.random() * symbolPool.length)];
    });

    elapsed += interval;
    if (elapsed >= spinTime) {
      clearInterval(spinInterval);
      finalizeSpin(bet, symbolPool);
    }
  }, interval);
}

function finalizeSpin(bet, symbolPool) {
  const slots = document.querySelectorAll('.slot');
  const finalSymbols = Array.from(slots).map(() => symbolPool[Math.floor(Math.random() * symbolPool.length)]);
  slots.forEach((slot, index) => {
    slot.textContent = finalSymbols[index];
    slot.classList.remove('spinning');
    slot.classList.remove('winning-slot', 'losing-slot');
  });

  const resultDiv = document.getElementById("result");
  const specialBonus = { "7️⃣": 2, "🍀": 2.5, "⭐": 3, "💎": 1.5 };

  if (finalSymbols.every(symbol => symbol === finalSymbols[0])) {
    let winAmount = bet * winMultiplier * (specialBonus[finalSymbols[0]] || 1);
    resultDiv.textContent = specialBonus[finalSymbols[0]]
      ? `SUPER! Wygrałeś ${winAmount} 💰 (${specialBonus[finalSymbols[0]]}x bonus)`
      : `JACKPOT! Wygrałeś ${winAmount} 💰`;
    resultDiv.className = "result win";
    balance += winAmount;
    totalWins++;
    highestWin = Math.max(highestWin, winAmount);
    slots.forEach(slot => slot.classList.add('winning-slot'));
  } else if (new Set(finalSymbols).size < 3) {
    const winAmount = Math.round(bet * 0.5);
    resultDiv.textContent = `Dwa pasujące symbole! Odzyskujesz ${winAmount} 💰`;
    resultDiv.className = "result win";
    balance += winAmount;
    totalWins++;
    highestWin = Math.max(highestWin, winAmount);
    finalSymbols.forEach((symbol, index) => {
      if (finalSymbols.filter(s => s === symbol).length > 1) {
        slots[index].classList.add('winning-slot');
      }
    });
  } else {
    resultDiv.textContent = "Niestety, spróbuj jeszcze raz! 😕";
    resultDiv.className = "result lose";
    slots.forEach(slot => slot.classList.add('losing-slot'));
  }

  updateBalanceDisplay();
  updateStats();
  saveToLocalStorage();
  document.getElementById("spinButton").disabled = false;
}
function resetStats() {
    if (confirm("Czy na pewno chcesz zresetować statystyki i balans?")) {
        balance = 0;
        totalSpins = 0;
        totalWins = 0;
        highestWin = 0;
        totalAdded = 0;
        saveToLocalStorage();
        updateBalanceDisplay();
        updateStats();
    }
}

document.getElementById("resetButton").addEventListener("click", resetStats);

updateBalanceDisplay();
updateStats();