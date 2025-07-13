import React from "react";
import "./GameActions.css";

export default function GameActions({
  role,
  currentPlayer,
  myUserId,
  winner,
  draw,
  onResign,
  onPlayAgain,
  canMove
}) {
  // Show resign if it's your turn and you're a player
  if (role === "player" && !winner && !draw && currentPlayer === myUserId) {
    return (
      <div className="game-actions">
        <button className="button-primary" onClick={onResign}>Resign</button>
      </div>
    );
  }

  // Show play again if game is over and user is a player
  if (role === "player" && (winner || draw)) {
    return (
      <div className="game-actions">
        <button className="button-primary" onClick={onPlayAgain}>Play Again</button>
      </div>
    );
  }

  // If not your turn
  if (role === "player" && !winner && !draw && currentPlayer !== myUserId) {
    return (
      <div className="game-actions">
        <span>Waiting for opponent's move...</span>
      </div>
    );
  }

  // If spectator or queued
  if (role !== "player") {
    return (
      <div className="game-actions">
        <span>You're spectating or in queue.</span>
      </div>
    );
  }

  return null;
}
