// Zmienne stanu gry
let balance = parseInt(localStorage.getItem("balance")) || 1000;
const winMultiplier = 10;
let totalSpins = parseInt(localStorage.getItem("totalSpins")) || 0;
let totalWins = parseInt(localStorage.getItem("totalWins")) || 0;
let highestWin = parseInt(localStorage.getItem("highestWin")) || 0;
let lastBet = parseInt(localStorage.getItem("lastBet")) || 100;
let totalAdded = parseInt(localStorage.getItem("totalAdded")) || 0;
let soundEnabled = localStorage.getItem("soundEnabled") !== "false"; // Domyślnie włączony

// Elementy audio
const spinSound = document.getElementById("spinSound");
const winSound = document.getElementById("winSound");
const jackpotSound = document.getElementById("jackpotSound");

// Inicjalizacja
document.getElementById("betInput").value = lastBet;
updateBalanceDisplay();
updateStats();
updateSoundButton();

// Funkcje pomocnicze
function updateBalanceDisplay() {
  document.getElementById("balance").textContent = balance;
}

function updateStats() {
  document.getElementById("totalSpins").textContent = totalSpins;
  document.getElementById("totalWins").textContent = totalWins;
  document.getElementById("highestWin").textContent = highestWin;
  document.getElementById("totalAdded").textContent = totalAdded;
}

function saveToLocalStorage() {
  localStorage.setItem("balance", balance);
  localStorage.setItem("totalSpins", totalSpins);
  localStorage.setItem("totalWins", totalWins);
  localStorage.setItem("highestWin", highestWin);
  localStorage.setItem("lastBet", document.getElementById("betInput").value);
  localStorage.setItem("totalAdded", totalAdded);
  localStorage.setItem("soundEnabled", soundEnabled);
}

// Funkcje dźwiękowe
function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem("soundEnabled", soundEnabled);
  updateSoundButton();
}

function updateSoundButton() {
  const soundButton = document.getElementById("soundButton");
  if (soundEnabled) {
    soundButton.innerHTML = '<i class="fas fa-volume-up"></i> Dźwięk';
    soundButton.classList.remove("sound-off");
    soundButton.classList.add("sound-on");
  } else {
    soundButton.innerHTML = '<i class="fas fa-volume-mute"></i> Dźwięk';
    soundButton.classList.remove("sound-on");
    soundButton.classList.add("sound-off");
  }
}

function playSound(sound, volume = 0.5) {
  if (soundEnabled && sound) {
    sound.currentTime = 0;
    sound.volume = volume;
    sound.play().catch(e => console.log("Autoplay blocked:", e));
  }
}

// Funkcje gry
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

  // Rozpoczęcie gry
  balance -= bet;
  updateBalanceDisplay();
  document.getElementById("spinButton").disabled = true;
  document.getElementById("result").textContent = "";
  document.getElementById("result").className = "result";
  totalSpins++;
  saveToLocalStorage();
  updateStats();

  // Odtwórz dźwięk kręcenia
  playSound(spinSound, 0.3);

  // Symbole i ich wagi
  const symbols = ["🍒", "🍋", "🍉", "🔔", "💎", "7️⃣", "🍀", "⭐"];
  const weights = [30, 25, 20, 15, 5, 3, 1, 1];
  const symbolPool = weights.flatMap((weight, index) => Array(weight).fill(symbols[index]));

  // Animacja kręcenia
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

  // Sprawdź wynik
  if (finalSymbols.every(symbol => symbol === finalSymbols[0])) {
    // Wygrana - wszystkie symbole takie same
    let winAmount = bet * winMultiplier * (specialBonus[finalSymbols[0]] || 1);
    
    // Odtwórz odpowiedni dźwięk
    if (specialBonus[finalSymbols[0]]) {
      playSound(winSound, 0.5);
      resultDiv.textContent = `SUPER! Wygrałeś ${winAmount} 💰 (${specialBonus[finalSymbols[0]]}x bonus)`;
    } else {
      playSound(jackpotSound, 0.5);
      resultDiv.textContent = `JACKPOT! Wygrałeś ${winAmount} 💰`;
    }
    
    resultDiv.className = "result win";
    balance += winAmount;
    totalWins++;
    highestWin = Math.max(highestWin, winAmount);
    slots.forEach(slot => slot.classList.add('winning-slot'));
  } else if (new Set(finalSymbols).size < 3) {
    // Częściowa wygrana - dwa takie same symbole
    const winAmount = Math.round(bet * 0.5);
    playSound(winSound, 0.3);
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
    // Przegrana
    resultDiv.textContent = "Niestety, spróbuj jeszcze raz! 😕";
    resultDiv.className = "result lose";
    slots.forEach(slot => slot.classList.add('losing-slot'));
  }

  // Zakończenie gry
  updateBalanceDisplay();
  updateStats();
  saveToLocalStorage();
  document.getElementById("spinButton").disabled = false;
}

function resetStats() {
  if (confirm("Czy na pewno chcesz zresetować statystyki i balans?")) {
    balance = 1000;
    totalSpins = 0;
    totalWins = 0;
    highestWin = 0;
    totalAdded = 0;
    document.getElementById("betInput").value = 100;
    saveToLocalStorage();
    updateBalanceDisplay();
    updateStats();
  }
}

// Nasłuchiwanie zdarzeń
document.getElementById("resetButton").addEventListener("click", resetStats);