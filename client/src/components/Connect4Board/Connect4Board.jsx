import React from "react";
import "./Connect4Board.css";

export default function Connect4Board({
  board,
  players,
  currentPlayer,
  myUserId,
  winner,
  draw,
  sendMove,
  sendResign,
  role,
}) {
  // Determine my symbol
  const myIdx = players.indexOf(myUserId);
  const mySymbol = myIdx === 0 ? "🔴" : myIdx === 1 ? "🟡" : null;

  function handleColumnClick(col) {
    if (winner || draw) return;
    if (!mySymbol) return;
    if (currentPlayer !== myUserId) return;
    sendMove(col);
  }

  return (
    <div className="connect4-board-root">
      {winner && <div className="connect4-board-status">Winner: {winner === myUserId ? "You!" : winner}</div>}
      {draw && <div className="connect4-board-status">It's a draw!</div>}
      {!winner && !draw && players.length === 2 && (
        <div className="connect4-board-status">
          {role === "player"
            ? (currentPlayer === myUserId
                ? "Your turn!"
                : "Opponent's turn")
            : (
                <span>
                  Current turn: <b>{currentPlayer}</b>
                </span>
              )
          }
        </div>
      )}
      <div className="connect4-board-grid">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              className={
                "connect4-board-cell" +
                (
                  !winner && !draw && currentPlayer === myUserId && players.length === 2
                    ? ""
                    : " disabled"
                )
              }
              onClick={() => handleColumnClick(cIdx)}
            >
              {cell}
            </div>
          ))
        )}
      </div>
    </div>
  );
}