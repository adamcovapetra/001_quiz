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
const elTotal = document.getElementById("total");
const elFinish = document.getElementById("finish");
const elFinalScore = document.getElementById("finalScore");
const elRestart = document.getElementById("restart");

let currentQuestionId = null;
let score = 0;
let count = 0;
let totalQuestions = 10;
let selectedDifficulty = "easy";
let usedIds = [];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function showFinish() {
  const percent = Math.round((score / totalQuestions) * 100);

  const emoji =
  percent === 100 ? "🔥" :
  percent >= 75 ? "😄" :
  percent >= 50 ? "🙂" :
  "😕";

  elFinalScore.textContent = `${score}/${totalQuestions} = ${percent} % správných odpovědí ${emoji}`;
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

const shuffledChoices = shuffle(data.choices);

shuffledChoices.forEach((text, idx) => {
  const btn = document.createElement("button");
  btn.className = "choice";
  btn.textContent = `${String.fromCharCode(65 + idx)}) ${text}`;
  btn.onclick = () => submitAnswer(text, btn); // posíláme TEXT
  elChoices.appendChild(btn);
});
  elQuiz.classList.remove("hidden");
}

async function submitAnswer(selectedText, button) {
  // zakážeme další klikání
  [...elChoices.children].forEach(b => b.disabled = true);

  const res = await fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: currentQuestionId,
      selectedText: selectedText
    })
  });

  const data = await res.json();

  if (data.correct) {
    score += 1;
    elScore.textContent = String(score);
    elTotal.textContent = String(totalQuestions);
    button.classList.add("correct");
  } else {
    button.classList.add("wrong");

    // najdeme tlačítko, které má správný text a označíme ho zeleně
    [...elChoices.children].forEach(b => {
      const txt = b.textContent.split(") ").slice(1).join(") "); // odstraní "A) "
      if (txt === data.correctText) b.classList.add("correct");
    });
  }

  count += 1;
  elCount.textContent = String(count);

  const pauseMs = data.correct ? 1200 : 3000;
  await sleep(pauseMs);


  if (count >= totalQuestions) {
    showFinish();
    return;
  }

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
  elTotal.textContent = String(totalQuestions);

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

