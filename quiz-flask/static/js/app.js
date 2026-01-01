const elCategory = document.getElementById("category");
const elLoad = document.getElementById("load");
const elQuiz = document.getElementById("quiz");
const elMeta = document.getElementById("meta");
const elQuestion = document.getElementById("question");
const elChoices = document.getElementById("choices");
const elError = document.getElementById("error");

let currentQuestionId = null;

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

  if (data.correct) {
    button.classList.add("correct");
  } else {
    button.classList.add("wrong");
    elChoices.children[data.correctIndex].classList.add("correct");
  }
}

elLoad.addEventListener("click", loadQuestion);