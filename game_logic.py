import random

moves = ["rock", "paper", "scissors"]

def computer_choice():
    return random.choice(moves)

def find_winner(player, computer):

    if player == computer:
        return "Draw"

    if (
        (player == "rock" and computer == "scissors") or
        (player == "paper" and computer == "rock") or
        (player == "scissors" and computer == "paper")
    ):
        return "Player"

    return "Computer"