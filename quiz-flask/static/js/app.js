// ================================
// Napojení na HTML prvky (DOM)
// -------------------------------
// Vytahujeme si reference na elementy z index.html, abychom je mohli:
// - číst (např. vybranou kategorii/obtížnost/limit)
// - měnit (otázka, odpovědi, skóre, chybové hlášky)
// ================================
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

// ================================
// Stav hry (proměnné, které drží průběh kola)
// -------------------------------
// currentQuestionId: potřebujeme ho posílat na backend při vyhodnocení odpovědi
// score: počet správných odpovědí
// count: počet již zodpovězených otázek v tomto kole
// totalQuestions: kolik otázek chce uživatel v jednom kole (nastaví na začátku)
// selectedDifficulty: vybraná obtížnost z UI
// usedIds: seznam použitých ID, abychom zabránili opakování otázek v jednom kole
// ================================
let currentQuestionId = null;
let score = 0;
let count = 0;
let totalQuestions = 10;
let selectedDifficulty = "easy";
let usedIds = [];

// ================================
// Pomocná funkce: shuffle (zamíchání pořadí odpovědí)
// -------------------------------
// Přidali jsme, abychom předešli tomu, aby si uživatel zapamatoval písmeno (A/B/C/D) se správnou odpovědí.
// Proto teď zamícháme data.choices před zobrazením.
// ================================
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ================================
// Pomocná funkce: sleep (pauza mezi otázkami)
// -------------------------------
// Používáme ji pro "zpomalení" přechodu na další otázku,
// aby měl hráč čas:
// - všimnout si, že odpověděl špatně
// - vidět správnou odpověď zvýrazněnou zeleně
// ================================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ================================
// Konec hry: zobrazit finální výsledek
// -------------------------------
// Zobrazuje finální skóre jako x/y a zároveň dopočítá procenta.
// Přidali jsme i emoji podle úspěšnosti pro příjemnější UI.
// ================================
function showFinish() {
  const percent = Math.round((score / totalQuestions) * 100);

  // Emoji podle úspěšnosti (malá "gamifikace")
  const emoji =
  percent === 100 ? "🔥" :
  percent >= 75 ? "😄" :
  percent >= 50 ? "🙂" :
  "😕";

  // Zobrazení finálního textu s procenty (aby uživatel viděl, jak úspěšný byl)
  elFinalScore.textContent = `${score}/${totalQuestions} = ${percent} % správných odpovědí ${emoji}`;

  // UI přepnutí: skryjeme kvíz a ukážeme závěrečný panel
  elQuiz.classList.add("hidden");
  elFinish.classList.remove("hidden");
}

// ================================
// Načtení jedné otázky z backendu (Flask API)
// -------------------------------
// Frontend si vyžádá jednu náhodnou otázku přes endpoint /api/question.
// Posíláme parametry:
// - category (z UI)
// - difficulty (z UI)
// - exclude (seznam použitých ID), aby se otázky neopakovaly v jednom kole
// ================================
async function loadQuestion() {
  // vyčistíme případnou předchozí chybu a na chvíli skryjeme quiz UI
  elError.textContent = "";
  elQuiz.classList.add("hidden");

  const category = elCategory.value;

  // exclude = ID otázek, které už byly použité (bez opakování v jednom kole)
  const exclude = usedIds.join(",");

  // API request: backend vrátí jednu náhodnou otázku, která odpovídá filtrům
  const res = await fetch(
    `/api/question?category=${encodeURIComponent(category)}&difficulty=${encodeURIComponent(selectedDifficulty)}&exclude=${encodeURIComponent(exclude)}`
  );
  const data = await res.json();

  // Pokud backend vrátí chybu (např. už nejsou otázky v dané kombinaci filtrů),
  // zobrazíme error message a ukončíme načítání
  if (!res.ok) {
    elError.textContent = data.error || "Chyba.";
    return;
  }

  // Uložíme ID aktuální otázky (budeme ho potřebovat při odeslání odpovědi)
  currentQuestionId = data.id;

  // Hned přidáme do usedIds, aby se otázka v tomto kole už neobjevila znovu
  usedIds.push(currentQuestionId);

  // Meta informace o otázce (kategorie a obtížnost)
  elMeta.textContent = `${data.category} • ${data.difficulty}`;

  // Text otázky
  elQuestion.textContent = data.question;

  // Vymažeme předchozí odpovědi (tlačítka)
  elChoices.innerHTML = "";

  // Zamícháme odpovědi, aby uživatel nemohl "trénovat písmenko"
  const shuffledChoices = shuffle(data.choices);

  // Vytvoříme 4 tlačítka (A/B/C/D) pro odpovědi
  shuffledChoices.forEach((text, idx) => {
    const btn = document.createElement("button");
    btn.className = "choice";

    // Písmeno generujeme z ASCII: 65 = "A"
    btn.textContent = `${String.fromCharCode(65 + idx)}) ${text}`;

    // Důležité: posíláme TEXT odpovědi, ne index.
    // To je důvod, proč shuffle funguje bezpečně:
    // - backend porovnává vybraný text se správným textem (data.correctText)
    btn.onclick = () => submitAnswer(text, btn); // posíláme TEXT

    elChoices.appendChild(btn);
  });

  // Teď už můžeme kvíz znovu zobrazit
  elQuiz.classList.remove("hidden");
}

// ================================
// Odeslání odpovědi a vyhodnocení
// -------------------------------
// Odpověď vyhodnocuje backend přes endpoint /api/answer.
// Frontend pošle:
// - id otázky (aby backend věděl, kterou otázku vyhodnocuje)
// - selectedText (text odpovědi, na kterou uživatel klikl)
// ================================
async function submitAnswer(selectedText, button) {
  // zakážeme další klikání, aby uživatel nemohl "naklikat" více odpovědí
  [...elChoices.children].forEach(b => b.disabled = true);

  // Pošleme odpověď backendu
  const res = await fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: currentQuestionId,
      selectedText: selectedText
    })
  });

  const data = await res.json();

  // Pokud je odpověď správně:
  // - zvýšíme score
  // - aktualizujeme UI skóre
  // - označíme tlačítko zeleně
  if (data.correct) {
    score += 1;
    elScore.textContent = String(score);

    // totalQuestions držíme v UI, aby se zobrazovalo jako x/y
    elTotal.textContent = String(totalQuestions);

    button.classList.add("correct");
  } else {
    // Špatně:
    // - označíme zvolenou odpověď červeně
    // - navíc najdeme správnou odpověď a zvýrazníme ji zeleně,
    //   aby se uživatel mohl poučit
    button.classList.add("wrong");

    // najdeme tlačítko, které má správný text a označíme ho zeleně
    [...elChoices.children].forEach(b => {
      // V textContent tlačítka je "A) odpověď", proto odstraníme prefix "A) "
      const txt = b.textContent.split(") ").slice(1).join(") "); // odstraní "A) "
      if (txt === data.correctText) b.classList.add("correct");
    });
  }

  // Posuneme počet zodpovězených otázek
  count += 1;
  elCount.textContent = String(count);

  // Pauza mezi otázkami:
  // - správná odpověď: kratší (uživatel nepotřebuje tolik času)
  // - špatná odpověď: delší (aby stihl vidět, co bylo správně)
  const pauseMs = data.correct ? 1200 : 3000;
  await sleep(pauseMs);

  // Pokud jsme dosáhli limitu, ukončíme hru a zobrazíme výsledky
  if (count >= totalQuestions) {
    showFinish();
    return;
  }

  // Jinak načteme další otázku
  await loadQuestion();
}

// ================================
// Start hry (klik na "Načíst otázku")
// -------------------------------
// Tady se načte nastavení z UI a resetuje se celý stav hry.
// ================================
elLoad.addEventListener("click", async () => {
  // uložíme vybranou obtížnost
  selectedDifficulty = elDifficulty.value;

  // načteme počet otázek (uživatel si volí sám)
  totalQuestions = Number(elLimit.value);
  if (!Number.isFinite(totalQuestions) || totalQuestions < 1) totalQuestions = 10;

  // reset hry (nové kolo)
  score = 0;
  count = 0;

  // velmi důležité: reset usedIds, jinak by se otázky "neopakování" přenášelo i do další hry
  usedIds = [];

  // UI reset skóre/počítadel
  elScore.textContent = "0";
  elCount.textContent = "0";
  elTotal.textContent = String(totalQuestions);

  // UI reset (skryjeme finish, smažeme chybu)
  elFinish.classList.add("hidden");
  elError.textContent = "";

  // načteme první otázku
  await loadQuestion();
});

// ================================
// Restart hry (klik na "Restart")
// -------------------------------
// Jednodušší restart: resetuje skóre a počítadla a načte novou otázku.
// (Pozn.: zde se neresetuje usedIds — to je v pořádku podle toho,
// jak jste to chtěli používat, ale je dobré vědět, že pak může být
// pokračování bez opakování závislé na předchozím průběhu.)
// ================================
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

