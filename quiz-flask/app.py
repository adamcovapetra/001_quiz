from flask import Flask, render_template
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
    return render_template(
        "index.html",
        total=len(questions),
        categories=categories
    )

if __name__ == "__main__":
    app.run(debug=True)