const elCategory = document.getElementById("category");
const elLoad = document.getElementById("load");
const elQuiz = document.getElementById("quiz");
const elMeta = document.getElementById("meta");
const elQuestion = document.getElementById("question");
const elChoices = document.getElementById("choices");
const elError = document.getElementById("error");

const elScore = document.getElementById("score");
const elCount = document.getElementById("count");

let currentQuestionId = null;
let score = 0;
let count = 0;

const TOTAL_QUESTIONS = 10;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loadQuestion() {
  elError.textContent = "";
  elQuiz.classList.add("hidden");

  const category = elCategory.value;

  const res = await fetch(`/api/question?category=${encodeURIComponent(category)}`);
  const data = await res.json();

  if (!res.ok) {
    elError.textContent = data.error || "Chyba.";
    return;
  }

  currentQuestionId = data.id;

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
  if (count >= TOTAL_QUESTIONS) {
  alert(`Konec! Skóre: ${score}/${TOTAL_QUESTIONS}`);
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
  // restart hry při kliknutí na "Načíst otázku"
  score = 0;
  count = 0;
  elScore.textContent = "0";
  elCount.textContent = "0";
  await loadQuestion();
});