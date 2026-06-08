import random
from flask import Flask, render_template, request, session, jsonify

app = Flask(__name__)
app.secret_key = "hangman_secret_key_2024"

WORDS = [
    {"word": "python",  "hint": "A popular programming language"},
    {"word": "galaxy",  "hint": "A system of millions of stars"},
    {"word": "jungle",  "hint": "A dense tropical forest"},
    {"word": "bridge",  "hint": "A structure that connects two sides"},
    {"word": "rocket",  "hint": "A vehicle that travels to space"},
]

MAX_WRONG = 6


def new_game():
    chosen = random.choice(WORDS)
    session["word"] = chosen["word"]
    session["hint"] = chosen["hint"]
    session["guessed"] = []
    session["wrong_count"] = 0
    session["game_over"] = False
    session["won"] = False


@app.route("/")
def index():
    if "word" not in session:
        new_game()
    return render_template("index.html")


@app.route("/state")
def state():
    if "word" not in session:
        new_game()
    word = session["word"]
    guessed = session["guessed"]
    wrong_count = session["wrong_count"]
    revealed = [l if l in guessed else "_" for l in word]
    won = all(l in guessed for l in word)
    if won:
        session["won"] = True
        session["game_over"] = True
    return jsonify({
        "revealed": revealed,
        "guessed": guessed,
        "wrong_count": wrong_count,
        "max_wrong": MAX_WRONG,
        "hint": session["hint"],
        "game_over": session.get("game_over", False),
        "won": session.get("won", False),
        "word": word if session.get("game_over") else "",
    })


@app.route("/guess", methods=["POST"])
def guess():
    if session.get("game_over"):
        return jsonify({"error": "Game is over"}), 400

    data = request.get_json()
    letter = data.get("letter", "").lower().strip()

    if not letter or len(letter) != 1 or not letter.isalpha():
        return jsonify({"error": "Invalid input"}), 400

    guessed = session["guessed"]
    if letter in guessed:
        return jsonify({"error": "Already guessed"}), 400

    guessed.append(letter)
    session["guessed"] = guessed

    word = session["word"]
    if letter not in word:
        session["wrong_count"] = session["wrong_count"] + 1

    if session["wrong_count"] >= MAX_WRONG:
        session["game_over"] = True
        session["won"] = False

    won = all(l in guessed for l in word)
    if won:
        session["game_over"] = True
        session["won"] = True

    return jsonify({"ok": True})


@app.route("/new_game", methods=["POST"])
def restart():
    new_game()
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(debug=True)
