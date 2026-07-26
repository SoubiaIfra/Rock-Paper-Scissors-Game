from flask import Flask, render_template, request, jsonify
from game_logic import computer_choice, find_winner

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/play", methods=["POST"])
def play():

    data = request.get_json()

    player = data["move"]
    computer = computer_choice()

    winner = find_winner(player, computer)

    print("Player:", player)
    print("Computer:", computer)
    print("Winner:", winner)

    return jsonify({
    "player": player,
    "computer": computer,
    "winner": winner
})

if __name__ == "__main__":
    app.run(debug=True)