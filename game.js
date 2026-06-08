const STAGES = [
`
   -----
   |   |
       |
       |
       |
       |
  ======`,
`
   -----
   |   |
   O   |
       |
       |
       |
  ======`,
`
   -----
   |   |
   O   |
   |   |
       |
       |
  ======`,
`
   -----
   |   |
   O   |
  /|   |
       |
       |
  ======`,
`
   -----
   |   |
   O   |
  /|\\  |
       |
       |
  ======`,
`
   -----
   |   |
   O   |
  /|\\  |
  /    |
       |
  ======`,
`
   -----
   |   |
   O   |
  /|\\  |
  / \\  |
       |
  ======`
];

async function fetchState() {
  const res = await fetch("/state");
  return res.json();
}

async function sendGuess(letter) {
  const res = await fetch("/guess", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ letter })
  });
  return res.json();
}

async function startNewGame() {
  await fetch("/new_game", { method: "POST" });
  await render();
}

async function render() {
  const s = await fetchState();

  // Gallows
  document.getElementById("gallows").textContent = STAGES[s.wrong_count];
  document.getElementById("wrong-counter").textContent =
    `WRONG: ${s.wrong_count} / ${s.max_wrong}`;

  // Hint
  document.getElementById("hint-text").textContent = s.hint;

  // Word row
  const wordRow = document.getElementById("word-row");
  wordRow.innerHTML = s.revealed.map(l =>
    `<div class="letter-box ${l !== "_" ? "revealed" : ""}">${l !== "_" ? l : ""}</div>`
  ).join("");

  // Status
  const statusEl = document.getElementById("status-msg");
  if (s.won) {
    statusEl.textContent = "🎉 YOU WIN!";
    statusEl.className = "status-msg win";
  } else if (s.game_over) {
    statusEl.textContent = `💀 GAME OVER — word was: ${s.word}`;
    statusEl.className = "status-msg lose";
  } else {
    statusEl.textContent = `${s.max_wrong - s.wrong_count} wrong guess${s.max_wrong - s.wrong_count !== 1 ? "es" : ""} remaining`;
    statusEl.className = "status-msg";
  }

  // Keyboard
  const keysEl = document.getElementById("keys");
  keysEl.innerHTML = "abcdefghijklmnopqrstuvwxyz".split("").map(l => {
    let cls = "key";
    if (s.guessed.includes(l)) {
      cls += s.word && s.word.includes(l) || (!s.game_over && s.revealed.includes(l))
        ? " correct" : (s.word.includes(l) ? " correct" : " wrong");
    }
    const disabled = s.guessed.includes(l) || s.game_over ? "disabled" : "";
    return `<button class="${cls}" data-l="${l}" ${disabled}>${l.toUpperCase()}</button>`;
  }).join("");

  keysEl.querySelectorAll(".key:not(:disabled)").forEach(btn => {
    btn.addEventListener("click", async () => {
      await sendGuess(btn.dataset.l);
      await render();
    });
  });

  // New game button
  document.getElementById("new-game-btn").style.display = s.game_over ? "block" : "none";
}

// Keyboard support
document.addEventListener("keydown", async (e) => {
  const l = e.key.toLowerCase();
  if (/^[a-z]$/.test(l)) {
    const s = await fetchState();
    if (!s.game_over && !s.guessed.includes(l)) {
      await sendGuess(l);
      await render();
    }
  }
});

document.getElementById("new-game-btn").addEventListener("click", startNewGame);

render();
