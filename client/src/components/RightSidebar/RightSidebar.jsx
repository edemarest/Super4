import React from "react";
import "./RightSidebar.css";

export default function RightSidebar({ players, spectators, queue, winner, draw }) {
  return (
    <aside className="right-sidebar">
      <div>
        <h3>Game Info</h3>
        <div><b>Players:</b> {players && players.length > 0 ? players.join(", ") : "None"}</div>
        <div><b>Spectators:</b> {spectators && spectators.length > 0 ? spectators.join(", ") : "None"}</div>
        <div><b>Queue:</b> {queue && queue.length > 0 ? queue.join(", ") : "None"}</div>
        {winner && <div style={{ marginTop: 12, color: "#00ffb8" }}><b>Winner:</b> {winner}</div>}
        {draw && <div style={{ marginTop: 12, color: "#ffe156" }}><b>Draw!</b></div>}
      </div>
    </aside>
  );
}
