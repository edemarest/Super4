import React from "react";
import "./SpectatorBar.css";

export default function SpectatorBar({ spectators = [], queue = [], wins = {}, myUserId }) {
  return (
    <aside className="spectator-bar">
      <h3 className="spectator-bar-title">Spectators</h3>
      <div className="spectator-list">
        {spectators.length === 0 && <div className="spectator-empty">No spectators</div>}
        {spectators.map((userId, idx) => (
          <div
            key={userId}
            className={
              "spectator-card" +
              (queue[0] === userId ? " up-next" : "") +
              (myUserId === userId ? " me" : "")
            }
          >
            <div className="spectator-avatar">
              {userId[0]?.toUpperCase() || "?"}
            </div>
            <div className="spectator-info">
              <div className="spectator-name">
                {userId === myUserId ? "You" : userId}
              </div>
              <div className="spectator-wins">
                Wins: <b>{wins[userId] || 0}</b>
              </div>
              {queue[0] === userId && (
                <div className="spectator-upnext-badge">Up Next</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
