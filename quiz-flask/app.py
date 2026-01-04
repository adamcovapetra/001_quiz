from flask import Flask, render_template, jsonify, request
import json
from pathlib import Path
import random

app = Flask(__name__)

# Cesta k datům s otázkami:
# Používáme Path(__file__).parent, aby to fungovalo stabilně i po přesunu projektu
# (nezávisle na tom, odkud program spouštíš).
DATA_PATH = Path(__file__).parent / "data" / "questions.json"

def load_questions():
    # Načtení otázek ze souboru JSON.
    # Držíme to v samostatné funkci, aby:
    # - se kód neopakoval v endpoint ech
    # - bylo jasné "odkud se berou data"
    # Pozn.: při větším projektu by se to často cacheovalo (nenačítat soubor pořád dokola),
    # ale pro výukový projekt je tohle jednodušší a průhledné.
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["questions"]

@app.route("/")
def home():
    # Hlavní stránka:
    # - načte otázky
    # - vyrobí seznam kategorií (unikátní hodnoty q["category"])
    # - pošle je do Jinja šablony index.html, aby se select "Kategorie" naplnil hned po načtení stránky
    questions = load_questions()
    categories = sorted({q["category"] for q in questions})

    # total posíláme do šablony jako informaci "kolik otázek existuje celkem"
    # (v UI můžeš použít, ale logiku limitu si stejně drží frontend).
    return render_template("index.html", total=len(questions), categories=categories)

@app.route("/api/categories")
def api_categories():
    # API endpoint pro kategorie:
    # Přidali jsme ho jako možnost, kdyby ses rozhodl kategorie
    # načítat dynamicky přes fetch z JS místo server-side vykreslení.
    # V tvé verzi už kategorie posíláme i v / přes render_template,
    # ale tento endpoint se hodí jako rozšiřitelný "čistý API" přístup.
    questions = load_questions()
    categories = sorted({q["category"] for q in questions})
    return jsonify(categories)

@app.route("/api/question")
def api_question():
    # Endpoint, který frontend volá pro získání jedné otázky.
    # Parametry přichází z app.js v query stringu:
    # - category: vybraná kategorie (povinné)
    # - difficulty: easy / medium (volitelné, ale v tvém UI vždy posíláš)
    # - exclude: seznam ID oddělených čárkou (použité otázky v aktuálním kole)
    category = request.args.get("category")
    difficulty = request.args.get("difficulty")
    exclude = request.args.get("exclude", "")

    # Kategorie je povinná, protože bez ní bychom nevěděli, z jakého "balíku" vybírat.
    if not category:
        return jsonify({"error": "Missing category"}), 400

    # exclude_ids:
    # Přichází jako text "101,102,103".
    # Převádíme na set intů, abychom:
    # - uměli rychle filtrovat
    # - zabránili opakování otázek v jednom kole
    exclude_ids = set()
    if exclude.strip():
        try:
            exclude_ids = {int(x) for x in exclude.split(",") if x.strip()}
        except ValueError:
         # Pokud by přišlo něco nečíselného, vrátíme chybu.
         # (Odsazení je důležité — u tebe to jednou dělalo problém.)
         return jsonify({"error": "Invalid exclude"}), 400

    questions = load_questions()

    # Základní filtr: nejdřív vybereme jen otázky z dané kategorie.
    candidates = [q for q in questions if q["category"] == category]

    # Filtr podle obtížnosti:
    # Frontend posílá selectedDifficulty, aby se hráčovi zobrazovaly jen otázky dané obtížnosti.
    if difficulty:
        candidates = [q for q in candidates if q["difficulty"] == difficulty]

    # Filtr bez opakování:
    # remove otázky, jejichž id už je v exclude_ids (použité v tomto kole)
    if exclude_ids:
        candidates = [q for q in candidates if q["id"] not in exclude_ids]

    # Pokud už nejsou žádné další otázky, hra nemůže pokračovat.
    # To se může stát třeba když:
    # - uživatel zvolí malou kategorii/obtížnost
    # - a chce víc otázek, než je v JSONu dostupných
    if not candidates:
        return jsonify({"error": "No more questions for this selection"}), 404

    # Vybereme jednu náhodnou otázku.
    # Náhodnost je na backendu, aby byl "výběr otázek" řízen na jednom místě.
    q = random.choice(candidates)

    # ZÁSADNÍ bezpečnostní / herní detail:
    # Neposíláme answerIndex do frontendu, aby si hráč nemohl "vyčíst správnou odpověď"
    # z networku nebo z JS proměnných.
    # Frontend dostane jen texty odpovědí a uživatelskou volbu pak posílá zpět do /api/answer.
    return jsonify({
        "id": q["id"],
        "category": q["category"],
        "difficulty": q["difficulty"],
        "question": q["question"],
        "choices": q["choices"]
    })

@app.route("/api/answer", methods=["POST"])
def api_answer():
    # Endpoint pro vyhodnocení odpovědi.
    # Frontend posílá JSON:
    # {
    #   id: currentQuestionId,
    #   selectedText: "nějaký text odpovědi"
    # }
    #
    # Proč posíláme selectedText a ne answerIndex?
    # Protože na frontendu odpovědi shuffleujeme.
    # Index by tedy přestal dávat smysl, ale text odpovědi zůstává konzistentní.

    data = request.json
    qid = data.get("id")
    selected_text = data.get("selectedText")

    # Kontrola vstupu: bez ID otázky a bez vybrané odpovědi nelze vyhodnotit.
    if qid is None or selected_text is None:
        return jsonify({"error": "Missing data"}), 400

    questions = load_questions()

    # Najdeme otázku podle id:
    # next(..., None) vrátí první shodu, nebo None, pokud otázka neexistuje.
    q = next((x for x in questions if x["id"] == qid), None)

    if not q:
        return jsonify({"error": "Question not found"}), 404

    # Správný text odpovědi vezmeme z původních dat:
    # answerIndex ukazuje do q["choices"] na správnou volbu.
    correct_text = q["choices"][q["answerIndex"]]

    # Vyhodnocení: porovnáme vybraný text s correct_text
    correct = (selected_text == correct_text)

    # Vracíme:
    # - correct: aby frontend věděl, jestli přičíst bod a jak obarvit tlačítko
    # - correctText: aby frontend mohl zvýraznit správnou odpověď při špatné volbě
    return jsonify({
        "correct": correct,
        "correctText": correct_text
    })

# Lokální spuštění aplikace:
# debug=True je super pro vývoj (automatický reload + lepší error stránky),
# ale pro produkční nasazení by se vypínal.
if __name__ == "__main__":
    app.run(debug=True)
