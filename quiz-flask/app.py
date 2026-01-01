from flask import Flask, render_template, jsonify
import json
from pathlib import Path

app = Flask(__name__)

DATA_PATH = Path(__file__).parent / "data" / "questions.json"

def load_questions():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data["questions"]

@app.route("/")
def home():
    questions = load_questions()
    categories = sorted({q["category"] for q in questions})
    return render_template("index.html", total=len(questions), categories=categories)

@app.route("/api/categories")
def api_categories():
    questions = load_questions()
    categories = sorted({q["category"] for q in questions})
    return jsonify(categories)

from flask import Flask, render_template, jsonify, request
import json
import random
from pathlib import Path

@app.route("/api/question")
def api_question():
    category = request.args.get("category")
    if not category:
        return jsonify({"error": "Missing category"}), 400

    questions = load_questions()
    candidates = [q for q in questions if q["category"] == category]

    if not candidates:
        return jsonify({"error": "No questions for this category"}), 404

    q = random.choice(candidates)

    # NEPOSÍLÁME answerIndex, aby si to hráč neokoukal
    return jsonify({
        "id": q["id"],
        "category": q["category"],
        "difficulty": q["difficulty"],
        "question": q["question"],
        "choices": q["choices"]
    })

@app.route("/api/answer", methods=["POST"])
def api_answer():
    data = request.json
    qid = data.get("id")
    selected = data.get("answerIndex")

    if qid is None or selected is None:
        return jsonify({"error": "Missing data"}), 400

    questions = load_questions()
    q = next((x for x in questions if x["id"] == qid), None)

    if not q:
        return jsonify({"error": "Question not found"}), 404

    correct = (selected == q["answerIndex"])

    return jsonify({
        "correct": correct,
        "correctIndex": q["answerIndex"]
    })

if __name__ == "__main__":
    app.run(debug=True)