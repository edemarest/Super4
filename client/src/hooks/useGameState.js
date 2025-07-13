import { useState, useEffect, useRef } from "react";
import { createBoard } from "../../utils/gameLogic";

export function useGameState(gameId, myUserId) {
  const [board, setBoard] = useState(createBoard());
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [winner, setWinner] = useState(null);
  const [draw, setDraw] = useState(false);
  const [spectators, setSpectators] = useState([]);
  const [queue, setQueue] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "join", gameId, userId: myUserId }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "state") {
        setBoard(data.board);
        setPlayers(data.players);
        setCurrentPlayer(data.currentPlayer);
        setWinner(data.winner);
        setDraw(data.draw);
        setSpectators(
          Array.isArray(data.spectators)
            ? data.spectators.map(s => typeof s === "string" ? s : s.userId)
            : []
        );
        setQueue(
          Array.isArray(data.queue)
            ? data.queue.map(q => typeof q === "string" ? q : q.userId)
            : []
        );
      }
    };

    return () => {
      ws.close();
    };
  }, [gameId, myUserId]);

  function sendMove(col) {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: "move", gameId, userId: myUserId, col }));
  }

  function sendResign() {
    if (!wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: "resign", gameId, userId: myUserId }));
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
