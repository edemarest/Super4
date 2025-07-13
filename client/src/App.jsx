import React, { useState, useRef, useEffect } from "react";
import GameHeader from "./components/GameHeader/GameHeader";
import Connect4Board from "./components/Connect4Board/Connect4Board";
import PlayerCards from "./components/PlayerCards/PlayerCards";
import SpectatorBar from "./components/SpectatorBar/SpectatorBar";
import GameActions from "./components/GameActions/GameActions";
import { useGameState } from "./hooks/useGameState";
import RightSidebar from "./components/RightSidebar/RightSidebar";
import WinAnimation from "./components/WinAnimation/WinAnimation";
import StatusMessage from "./components/StatusMessage/StatusMessage";
import "./components/GameActions/GameActions.css";
import "../style/theme.css";
import "./App.css";
import "./components/RightSidebar/RightSidebar.css";
import "./components/WinAnimation/WinAnimation.css";
import "./components/StatusMessage/StatusMessage.css";

function getUserId() {
  const params = new URLSearchParams(window.location.search);
  if (window.discordSdk && window.discordSdk.auth && window.discordSdk.auth.user) {
    return window.discordSdk.auth.user.id;
  }
  if (params.get("userId")) return params.get("userId");
  return "test-" + Math.floor(Math.random() * 100000);
}

export default function App() {
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [showWin, setShowWin] = useState(false);
  const [sessionWins, setSessionWins] = useState({});
  const winTimeoutRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  const gameId = new URLSearchParams(window.location.search).get("gameId") || "default";
  const gameName = "Connect 4 Activity";
  const myUserId = getUserId();

  const {
    board,
    players,
    currentPlayer,
    winner,
    draw,
    spectators,
    queue,
    sendMove,
    sendResign,
  } = useGameState(gameId, myUserId);

  // Session wins: increment when user wins, reset on leave (page reload)
  useEffect(() => {
    if (winner && winner === myUserId) {
      setSessionWins(wins => ({
        ...wins,
        [myUserId]: (wins[myUserId] || 0) + 1
      }));
      setShowWin(true);
      // Hide win animation after 5s, then show status message for new game
      winTimeoutRef.current = setTimeout(() => {
        setShowWin(false);
        setStatusMsg("A new game has started between the winner and the next in queue!");
        setShowStatus(true);
        statusTimeoutRef.current = setTimeout(() => setShowStatus(false), 3000);
      }, 5000);
    }
    // Clean up on unmount or winner change
    return () => {
      clearTimeout(winTimeoutRef.current);
      clearTimeout(statusTimeoutRef.current);
    };
  }, [winner, myUserId]);

  // Placeholder for wins (to be implemented)
  const wins = sessionWins;

  // Determine role for current user
  let role = "";
  if (players.includes(myUserId)) {
    role = "player";
  } else if (queue.includes(myUserId)) {
    role = "queued";
  } else if (spectators.includes(myUserId)) {
    role = "spectator";
  }

  function handlePlayAgain() {
    window.location.reload();
  }

  return (
    <div className="app-root">
      <GameHeader gameName={gameName} gameId={gameId} error={error} />
      <WinAnimation visible={showWin} winnerName={winner === myUserId ? "You" : winner} />
      <StatusMessage message={statusMsg} visible={showStatus} />
      <div className="main-content">
        <SpectatorBar
          spectators={spectators}
          queue={queue}
          myUserId={myUserId}
          wins={wins}
        />
        <div className="center-content">
          <PlayerCards players={players} currentPlayer={currentPlayer} myUserId={myUserId} wins={wins} />
          <Connect4Board
            board={board}
            players={players}
            currentPlayer={currentPlayer}
            myUserId={myUserId}
            winner={winner}
            draw={draw}
            sendMove={sendMove}
            sendResign={sendResign}
            role={role}
          />
          <GameActions
            role={role}
            currentPlayer={currentPlayer}
            myUserId={myUserId}
            winner={winner}
            draw={draw}
            onResign={sendResign}
            onPlayAgain={handlePlayAgain}
          />
        </div>
        <RightSidebar
          players={players}
          spectators={spectators}
          queue={queue}
          winner={winner}
          draw={draw}
        />
      </div>
    </div>
  );
}