import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

let games = {}; // { gameId: { board, players, spectators, queue, currentPlayer, winner, draw, resetTimeouts: {} } }
const RECONNECT_GRACE = 3000; // ms to wait for reconnect before treating as leave/resign
const NEXT_GAME_DELAY = 5000; // ms to show win/draw before next game

function createBoard() {
  return Array.from({ length: 6 }, () => Array(7).fill(null));
}

function dropPiece(board, col, player) {
  for (let row = 5; row >= 0; row--) {
    if (!board[row][col]) {
      board[row][col] = player;
      return { row, col };
    }
  }
  return null;
}

function checkWin(board, player) {
  function checkDir(r, c, dr, dc) {
    let count = 0;
    for (let i = 0; i < 4; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (
        nr >= 0 && nr < 6 &&
        nc >= 0 && nc < 7 &&
        board[nr][nc] === player
      ) {
        count++;
      } else {
        break;
      }
    }
    return count === 4;
  }
  for (let r = 0; r < 6; r++) {
    for (let c = 0; c < 7; c++) {
      if (
        board[r][c] === player &&
        (
          checkDir(r, c, 0, 1) ||
          checkDir(r, c, 1, 0) ||
          checkDir(r, c, 1, 1) ||
          checkDir(r, c, 1, -1)
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

function checkDraw(board) {
  return board.every(row => row.every(cell => cell !== null));
}

function getPlayerSymbol(idx) {
  return idx === 0 ? "🔴" : "🟡";
}

function broadcastGameState(game) {
  const state = {
    type: "state",
    board: game.board,
    players: game.players.map(p => p.userId),
    spectators: game.spectators.map(s => s.userId),
    queue: [...game.queue],
    currentPlayer: game.currentPlayer,
    winner: game.winner,
    draw: game.draw,
  };
  for (const p of [...game.players, ...game.spectators]) {
    if (p.ws && p.ws.readyState === 1) {
      p.ws.send(JSON.stringify(state));
    }
  }
}

function promoteSpectatorToPlayer(game, winnerId = null) {
  let winnerObj = winnerId ? game.players.find(p => p.userId === winnerId) : null;
  let newPlayers = [];
  if (winnerObj) {
    newPlayers.push(winnerObj);
  }
  while (newPlayers.length < 2 && game.queue.length > 0) {
    const nextId = game.queue.shift();
    const idx = game.spectators.findIndex(s => s.userId === nextId);
    if (idx !== -1) {
      newPlayers.push(game.spectators[idx]);
      game.spectators.splice(idx, 1);
    }
  }
  for (const p of game.players) {
    if (!winnerObj || p.userId !== winnerObj.userId) {
      game.spectators.push(p);
    }
  }
  game.players = newPlayers;
}

function startNextGame(game, winnerId = null, reason = "win") {
  if (game.resetTimeout) {
    clearTimeout(game.resetTimeout);
    game.resetTimeout = null;
  }

  // Always promote winner (if present) and next in queue to players
  let winnerObj = winnerId
    ? [...game.players, ...game.spectators].find(p => p.userId === winnerId)
    : null;
  let newPlayers = [];
  if (winnerObj) {
    newPlayers.push(winnerObj);
  }

  // Always fill up to 2 players from the queue
  while (newPlayers.length < 2 && game.queue.length > 0) {
    const nextId = game.queue.shift();
    // Remove from spectators if present
    const idx = game.spectators.findIndex(s => s.userId === nextId);
    if (idx !== -1) {
      newPlayers.push(game.spectators[idx]);
      game.spectators.splice(idx, 1);
    } else {
      newPlayers.push({ userId: nextId, ws: null });
    }
  }

  // If we still don't have 2 players, promote a spectator (not the winner) if available
  while (newPlayers.length < 2 && game.spectators.length > 0) {
    // Don't add the winner again
    const nextSpectatorIdx = game.spectators.findIndex(s => !winnerObj || s.userId !== winnerObj.userId);
    if (nextSpectatorIdx !== -1) {
      newPlayers.push(game.spectators[nextSpectatorIdx]);
      game.spectators.splice(nextSpectatorIdx, 1);
    } else {
      break;
    }
  }

  // Remove newPlayers from spectators if present
  for (const p of newPlayers) {
    game.spectators = game.spectators.filter(s => s.userId !== p.userId);
  }

  // Any remaining previous players become spectators (if not winner)
  for (const p of game.players) {
    if (!winnerObj || p.userId !== winnerObj.userId) {
      if (!game.spectators.find(s => s.userId === p.userId) && !newPlayers.find(np => np.userId === p.userId)) {
        game.spectators.push(p);
      }
    }
  }

  game.players = newPlayers;

  // Logging for next game
  const winnerName = winnerId || "draw";
  const challenger = game.players.length > 1 ? game.players[1].userId : "None";
  console.log(`[SERVER] ${winnerName} wins because of ${reason}. Starting new game with ${game.players[0] ? game.players[0].userId : "None"} and challenger ${challenger}`);

  // If only one player, waiting for challenger
  if (game.players.length < 2) {
    game.board = createBoard();
    game.currentPlayer = null;
    game.winner = null;
    game.draw = false;
    broadcastGameState(game);
    return;
  }

  // If two players, start new game
  game.board = createBoard();
  game.currentPlayer = game.players[0].userId;
  game.winner = null;
  game.draw = false;
  broadcastGameState(game);
}

function handleDisconnect(game, userId) {
  if (!game.disconnectTimers) game.disconnectTimers = {};
  if (game.disconnectTimers[userId]) return;
  game.disconnectTimers[userId] = setTimeout(() => {
    const pIdx = game.players.findIndex(p => p.userId === userId);
    if (pIdx !== -1) {
      const winnerObj = game.players.find((p, idx) => idx !== pIdx);
      const winnerId = winnerObj ? winnerObj.userId : null;
      game.winner = winnerId;
      broadcastGameState(game);
      game.resetTimeout = setTimeout(() => {
        startNextGame(game, winnerId, "disconnect");
      }, NEXT_GAME_DELAY);
      game.players.splice(pIdx, 1);
    }
    const sIdx = game.spectators.findIndex(s => s.userId === userId);
    if (sIdx !== -1) {
      game.spectators.splice(sIdx, 1);
      game.queue = game.queue.filter(id => id !== userId);
    }
    if (game.players.length === 0 && game.spectators.length === 0) {
      delete games[game.gameId];
    } else {
      broadcastGameState(game);
    }
    delete game.disconnectTimers[userId];
  }, RECONNECT_GRACE);
}

function handleReconnect(game, userId, ws) {
  if (game.disconnectTimers && game.disconnectTimers[userId]) {
    clearTimeout(game.disconnectTimers[userId]);
    delete game.disconnectTimers[userId];
  }
  // Update ws reference for player or spectator
  let found = false;
  for (const p of game.players) {
    if (p.userId === userId) {
      p.ws = ws;
      found = true;
    }
  }
  for (const s of game.spectators) {
    if (s.userId === userId) {
      s.ws = ws;
      found = true;
    }
  }
  return found;
}

wss.on('connection', function connection(ws) {
  let currentGameId = null;
  let currentUserId = null;

  ws.on('message', function incoming(message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch {
      return;
    }
    // Handle join
    if (data.type === 'join') {
      const { gameId, userId } = data;
      if (!gameId || !userId) return;
      currentGameId = gameId;
      currentUserId = userId;
      if (!games[gameId]) {
        games[gameId] = {
          board: createBoard(),
          players: [],
          spectators: [],
          queue: [],
          currentPlayer: null,
          winner: null,
          draw: false,
          gameId,
        };
      }
      const game = games[gameId];

      // Reconnect logic
      if (handleReconnect(game, userId, ws)) {
        broadcastGameState(game);
        return;
      }

      // Remove from all lists before adding
      game.players = game.players.filter(p => p.userId !== userId);
      game.spectators = game.spectators.filter(s => s.userId !== userId);
      game.queue = game.queue.filter(id => id !== userId);

      // Add as player if <2, else as spectator and queue
      if (game.players.length < 2) {
        game.players.push({ userId, ws });
      } else {
        game.spectators.push({ userId, ws });
        game.queue.push(userId);
      }

      // If only one player, waiting for challenger
      if (game.players.length === 1) {
        game.currentPlayer = null;
        game.winner = null;
        game.draw = false;
        game.board = createBoard();
      }
      // If two players, assign turn if not already set
      if (game.players.length === 2 && !game.currentPlayer) {
        game.currentPlayer = game.players[0].userId;
      }
      broadcastGameState(game);
    }

    // Handle move
    if (data.type === 'move') {
      const { gameId, userId, col } = data;
      const game = games[gameId];
      if (!game || !userId || typeof col !== "number") return;
      if (game.winner || game.draw) return;
      if (game.players.length < 2) return;
      if (game.currentPlayer !== userId) return;
      const playerIdx = game.players.findIndex(p => p.userId === userId);
      const symbol = getPlayerSymbol(playerIdx);
      const move = dropPiece(game.board, col, symbol);
      if (!move) return;
      if (checkWin(game.board, symbol)) {
        game.winner = userId;
        broadcastGameState(game);
        game.resetTimeout = setTimeout(() => {
          startNextGame(game, userId, "4-in-a-row");
        }, NEXT_GAME_DELAY);
      } else if (checkDraw(game.board)) {
        game.draw = true;
        broadcastGameState(game);
        game.resetTimeout = setTimeout(() => {
          startNextGame(game, null, "draw");
        }, NEXT_GAME_DELAY);
      } else {
        const nextIdx = (playerIdx + 1) % 2;
        game.currentPlayer = game.players[nextIdx].userId;
        broadcastGameState(game);
      }
    }

    // Handle resign
    if (data.type === 'resign') {
      const { gameId, userId } = data;
      const game = games[gameId];
      if (!game || !userId) return;
      const playerIdx = game.players.findIndex(p => p.userId === userId);
      if (playerIdx === -1) return;
      const winnerObj = game.players.find((p, idx) => idx !== playerIdx);
      const winnerId = winnerObj ? winnerObj.userId : null;
      game.winner = winnerId;
      broadcastGameState(game);
      game.resetTimeout = setTimeout(() => {
        // Always promote next available spectator or queued user as new player
        startNextGame(game, winnerId, "resignation");
      }, NEXT_GAME_DELAY);
    }
  });

  ws.on('close', function() {
    if (!currentGameId || !currentUserId) return;
    const game = games[currentGameId];
    if (!game) return;
    handleDisconnect(game, currentUserId);
  });
});

console.log('WebSocket server running on ws://localhost:8080');