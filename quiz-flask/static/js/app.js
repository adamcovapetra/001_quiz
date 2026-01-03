const elCategory = document.getElementById("category");
const elDifficulty = document.getElementById("difficulty");
const elLimit = document.getElementById("limit");
const elLoad = document.getElementById("load");
const elQuiz = document.getElementById("quiz");
const elMeta = document.getElementById("meta");
const elQuestion = document.getElementById("question");
const elChoices = document.getElementById("choices");
const elError = document.getElementById("error");
const elScore = document.getElementById("score");
const elCount = document.getElementById("count");
const elFinish = document.getElementById("finish");
const elFinalScore = document.getElementById("finalScore");
const elRestart = document.getElementById("restart");

let currentQuestionId = null;
let score = 0;
let count = 0;
let totalQuestions = 10;
let selectedDifficulty = "easy";
let usedIds = [];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showFinish() {
  elFinalScore.textContent = `${score}/${totalQuestions}`;
  elQuiz.classList.add("hidden");
  elFinish.classList.remove("hidden");
}

async function loadQuestion() {
  elError.textContent = "";
  elQuiz.classList.add("hidden");

  const category = elCategory.value;
  const exclude = usedIds.join(",");

const res = await fetch(
  `/api/question?category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(selectedDifficulty)}&exclude=${encodeURIComponent(exclude)}`
);
  const data = await res.json();

  if (!res.ok) {
    elError.textContent = data.error || "Chyba.";
    return;
  }

  currentQuestionId = data.id;
  usedIds.push(currentQuestionId);

  elMeta.textContent = `${data.category} • ${data.difficulty}`;
  elQuestion.textContent = data.question;

  elChoices.innerHTML = "";
  data.choices.forEach((text, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice";
    btn.textContent = `${String.fromCharCode(65 + idx)}) ${text}`;
    btn.onclick = () => submitAnswer(idx, btn);
    elChoices.appendChild(btn);
  });

  elQuiz.classList.remove("hidden");
}

async function submitAnswer(index, button) {
  // zakážeme další klikání
  [...elChoices.children].forEach(b => b.disabled = true);

  const res = await fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: currentQuestionId,
      answerIndex: index
    })
  });

  const data = await res.json();

  // počítadlo otázek
  count += 1;
 if (count >= totalQuestions) {
  showFinish();
  return;
}
  elCount.textContent = String(count);

  if (data.correct) {
    score += 1;
    elScore.textContent = String(score);
    button.classList.add("correct");
  } else {
    button.classList.add("wrong");
    elChoices.children[data.correctIndex].classList.add("correct");
  }

 // pauza – delší při špatné odpovědi
const pauseMs = data.correct ? 1200 : 3000;
await sleep(pauseMs);
await loadQuestion();
}

elLoad.addEventListener("click", async () => {
  // uložíme vybranou obtížnost
  selectedDifficulty = elDifficulty.value;

  // načteme počet otázek
  totalQuestions = Number(elLimit.value);
  if (!Number.isFinite(totalQuestions) || totalQuestions < 1) totalQuestions = 10;

  // reset hry
  score = 0;
  count = 0;
  usedIds = [];
  elScore.textContent = "0";
  elCount.textContent = "0";

  // UI reset
  elFinish.classList.add("hidden");
  elError.textContent = "";

  await loadQuestion();
});

elRestart.addEventListener("click", async () => {
  // reset
  score = 0;
  count = 0;
  elScore.textContent = "0";
  elCount.textContent = "0";

  // UI přepnutí
  elFinish.classList.add("hidden");
  elError.textContent = "";

  // start nové hry
  await loadQuestion();
});

