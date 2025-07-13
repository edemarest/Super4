import React from "react";
import "./PlayerCards.css";

export default function PlayerCards({ players, currentPlayer, myUserId, wins = {} }) {
  // If the user is a player, always show their card on the left
  let orderedPlayers = players;
  if (players.length === 2 && players.includes(myUserId)) {
    orderedPlayers = [myUserId, players.find(id => id !== myUserId)];
  }

  return (
    <div className="player-cards-row">
      {orderedPlayers.map((userId, idx) => (
        <React.Fragment key={userId}>
          {idx === 1 && <div className="player-vs">VS</div>}
          <div
            className={
              "player-card" +
              (currentPlayer === userId ? " active" : "") +
              (myUserId === userId ? " me" : "")
            }
          >
            {/* Use theme token colors for avatars, no gradients */}
            <div
              className="player-avatar"
              style={{
                background: idx === 0
                  ? "var(--player1-color)"
                  : "var(--player2-color)",
                color: "#232323"
              }}
            >
              {userId[0]?.toUpperCase() || "?"}
            </div>
            <div className="player-info">
              <div className="player-name">{userId === myUserId ? "You" : userId}</div>
              <div className="player-wins">
                Wins: <b>{wins[userId] || 0}</b>
              </div>
              {currentPlayer === userId && (
                <div className="player-turn-badge">Turn</div>
              )}
            </div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
