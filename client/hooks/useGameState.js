import { useState, useEffect, useRef } from "react";
import { createBoard } from "../utils/gameLogic";

export function useGameState(gameId, myUserId) {
  const [board, setBoard] = useState(createBoard());
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [winner, setWinner] = useState(null);
  const [draw, setDraw] = useState(false);
  const [spectators, setSpectators] = useState([]);
  const [queue, setQueue] = useState([]);
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ type: "join", gameId, userId: myUserId }));
    };

    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "state") {
        setBoard(data.board);
        setPlayers(data.players);
        setCurrentPlayer(data.currentPlayer);
        setWinner(data.winner);
        setDraw(data.draw);
        setSpectators(data.spectators);
        setQueue(data.queue);
      }
    };

    return () => {
      ws.current.close();
    };
  }, [gameId, myUserId]);

  function sendMove(col) {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "move", gameId, userId: myUserId, col }));
    }
  }

  function sendResign() {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "resign", gameId, userId: myUserId }));
    }
  }

  return {
    board,
    players,
    currentPlayer,
    winner,
    draw,
    spectators,
    queue,
    sendMove,
    sendResign,
  };
}