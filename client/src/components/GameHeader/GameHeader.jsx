import React from "react";
import "./GameHeader.css";

export default function GameHeader({ gameName = "Connect 4", gameId, error }) {
  return (
    <header className="game-header">
      <div className="game-header-title">{gameName}</div>
      <div className="game-header-id">
        Game ID: <b>{gameId}</b>
      </div>
      <div>
        {error && <span className="game-header-error">{error}</span>}
      </div>
    </header>
  );
}
