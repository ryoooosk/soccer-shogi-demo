import type { GameState, Board, Piece, Position, Player } from '../types/game';

export const BOARD_WIDTH = 7;
export const BOARD_HEIGHT = 9;

export function createInitialGameState(): GameState {
  const board = createInitialBoard();
  
  return {
    board,
    currentPlayer: 'player1',
    actionsLeft: 2,
    score: {
      player1: 0,
      player2: 0,
    },
    gameStatus: 'playing',
  };
}

function createInitialBoard(): Board {
  const pieces: Piece[] = [];

  const player1Positions: Position[] = [
    { x: 1, y: 7 }, { x: 2, y: 7 }, { x: 3, y: 7 }, { x: 4, y: 7 }, { x: 5, y: 7 },
    { x: 3, y: 6 }
  ];

  const player2Positions: Position[] = [
    { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 4, y: 1 }, { x: 5, y: 1 },
    { x: 3, y: 2 }
  ];

  player1Positions.forEach((pos, index) => {
    pieces.push({
      id: `player1-${index}`,
      type: 'player',
      player: 'player1',
      position: pos,
    });
  });

  player2Positions.forEach((pos, index) => {
    pieces.push({
      id: `player2-${index}`,
      type: 'player',
      player: 'player2',
      position: pos,
    });
  });

  pieces.push({
    id: 'ball',
    type: 'ball',
    position: { x: 3, y: 4 },
  });

  return {
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    pieces,
  };
}

export function getPieceAt(board: Board, position: Position): Piece | undefined {
  return board.pieces.find(
    piece => piece.position.x === position.x && piece.position.y === position.y
  );
}

export function isPositionInBounds(position: Position): boolean {
  return position.x >= 0 && position.x < BOARD_WIDTH && 
         position.y >= 0 && position.y < BOARD_HEIGHT;
}

export function isGoalArea(position: Position): boolean {
  return position.y === 0 || position.y === BOARD_HEIGHT - 1;
}

export function isKeeperArea(position: Position): boolean {
  return position.y === 1 || position.y === BOARD_HEIGHT - 2;
}

export function findJumpPath(board: Board, from: Position, to: Position): Position[] {
  const visited = new Set<string>();
  const queue: { position: Position; path: Position[] }[] = [{ position: from, path: [] }];

  while (queue.length > 0) {
    const { position, path } = queue.shift()!;
    const posKey = `${position.x},${position.y}`;

    if (visited.has(posKey)) continue;
    visited.add(posKey);

    if (position.x === to.x && position.y === to.y) {
      return path;
    }

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [dx, dy] of directions) {
      const adjacentPos = { x: position.x + dx, y: position.y + dy };
      
      if (!isPositionInBounds(adjacentPos)) continue;
      
      const adjacentPiece = getPieceAt(board, adjacentPos);
      if (!adjacentPiece) continue;

      const jumpTargetPos = { x: adjacentPos.x + dx, y: adjacentPos.y + dy };
      
      if (!isPositionInBounds(jumpTargetPos)) continue;
      
      const jumpTargetPiece = getPieceAt(board, jumpTargetPos);
      if (jumpTargetPiece && jumpTargetPiece.type === 'player') continue;

      const jumpTargetKey = `${jumpTargetPos.x},${jumpTargetPos.y}`;
      if (visited.has(jumpTargetKey)) continue;

      queue.push({
        position: jumpTargetPos,
        path: [...path, jumpTargetPos]
      });
    }
  }

  return [];
}

export function getValidPlayerMoves(board: Board, piece: Piece): Position[] {
  const moves: Position[] = [];
  const { x, y } = piece.position;

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if (dx === 0 && dy === 0) continue;
      
      const newX = x + dx;
      const newY = y + dy;
      
      if (newX >= 0 && newX < BOARD_WIDTH && newY >= 0 && newY < BOARD_HEIGHT) {
        const targetPiece = getPieceAt(board, { x: newX, y: newY });
        if (!targetPiece || targetPiece.type === 'ball') {
          moves.push({ x: newX, y: newY });
        }
      }
    }
  }

  const visited = new Set<string>();
  const jumpMoves = findAllJumpMoves(board, piece.position, visited);
  moves.push(...jumpMoves);

  return moves.filter((move, index, self) => 
    self.findIndex(m => m.x === move.x && m.y === move.y) === index
  );
}

function findAllJumpMoves(board: Board, from: Position, visited: Set<string>): Position[] {
  const moves: Position[] = [];
  const posKey = `${from.x},${from.y}`;
  
  if (visited.has(posKey)) return moves;
  visited.add(posKey);

  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];

  for (const [dx, dy] of directions) {
    const adjacentPos = { x: from.x + dx, y: from.y + dy };
    
    if (!isPositionInBounds(adjacentPos)) continue;
    
    const adjacentPiece = getPieceAt(board, adjacentPos);
    if (!adjacentPiece) continue;

    const jumpTargetPos = { x: adjacentPos.x + dx, y: adjacentPos.y + dy };
    
    if (!isPositionInBounds(jumpTargetPos)) continue;
    
    const jumpTargetPiece = getPieceAt(board, jumpTargetPos);
    if (jumpTargetPiece && jumpTargetPiece.type === 'player') continue;

    const jumpTargetKey = `${jumpTargetPos.x},${jumpTargetPos.y}`;
    if (visited.has(jumpTargetKey)) continue;

    moves.push(jumpTargetPos);
    
    const furtherMoves = findAllJumpMoves(board, jumpTargetPos, new Set(visited));
    moves.push(...furtherMoves);
  }

  return moves;
}

export function checkBallSteal(
  board: Board,
  movingPiece: Piece,
  targetPosition: Position,
  currentPlayer: Player
): { stolen: boolean; method?: 'jump' | 'sandwich' } {
  const ballPiece = board.pieces.find((p: Piece) => p.type === 'ball');
  if (!ballPiece) {
    return { stolen: false };
  }

  const ballHolder = board.pieces.find((p: Piece) => 
    p.type === 'player' && 
    p.position.x === ballPiece.position.x && 
    p.position.y === ballPiece.position.y
  );

  if (!ballHolder || ballHolder.player === currentPlayer) {
    return { stolen: false };
  }

  const jumpPath = findJumpPath(board, movingPiece.position, targetPosition);
  if (jumpPath.length > 0) {
    const jumpedPositions = getJumpedPositions(movingPiece.position, jumpPath);
    const ballPosition = ballPiece.position;
    
    if (jumpedPositions.some(pos => pos.x === ballPosition.x && pos.y === ballPosition.y)) {
      return { stolen: true, method: 'jump' };
    }
  }

  if (checkSandwichSteal(board, targetPosition, currentPlayer)) {
    return { stolen: true, method: 'sandwich' };
  }

  return { stolen: false };
}

function getJumpedPositions(from: Position, jumpPath: Position[]): Position[] {
  const jumped: Position[] = [];
  let current = from;

  for (const next of jumpPath) {
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);
    
    const jumpedPos = {
      x: current.x + stepX,
      y: current.y + stepY
    };
    
    jumped.push(jumpedPos);
    current = next;
  }

  return jumped;
}

function checkSandwichSteal(
  board: Board,
  newPosition: Position,
  currentPlayer: Player
): boolean {
  const ballPiece = board.pieces.find((p: Piece) => p.type === 'ball');
  if (!ballPiece) return false;

  const ballPosition = ballPiece.position;
  
  const friendlyPlayers = board.pieces.filter((p: Piece) => 
    p.type === 'player' && 
    p.player === currentPlayer &&
    !(p.position.x === newPosition.x && p.position.y === newPosition.y)
  );

  for (const player of friendlyPlayers) {
    if (isSandwichPosition(ballPosition, newPosition, player.position)) {
      return true;
    }
  }

  return false;
}

function isSandwichPosition(
  ballPos: Position,
  pos1: Position,
  pos2: Position
): boolean {
  if (pos1.x === pos2.x && ballPos.x === pos1.x) {
    return (ballPos.y > Math.min(pos1.y, pos2.y) && ballPos.y < Math.max(pos1.y, pos2.y));
  }
  
  if (pos1.y === pos2.y && ballPos.y === pos1.y) {
    return (ballPos.x > Math.min(pos1.x, pos2.x) && ballPos.x < Math.max(pos1.x, pos2.x));
  }
  
  const dx1 = pos2.x - pos1.x;
  const dy1 = pos2.y - pos1.y;
  const dx2 = ballPos.x - pos1.x;
  const dy2 = ballPos.y - pos1.y;
  
  if (Math.abs(dx1) === Math.abs(dy1)) {
    const ratio1 = dx1 === 0 ? 0 : dx2 / dx1;
    const ratio2 = dy1 === 0 ? 0 : dy2 / dy1;
    
    if (Math.abs(ratio1 - ratio2) < 0.001 && ratio1 > 0 && ratio1 < 1) {
      return true;
    }
  }
  
  return false;
}

function validateMove(
  board: Board, 
  piece: Piece, 
  to: Position, 
  currentPlayer: Player
): { isValid: boolean; reason?: string } {
  if (!isPositionInBounds(to)) {
    return { isValid: false, reason: '盤面外への移動はできません' };
  }

  if (piece.type === 'player') {
    if (piece.player !== currentPlayer) {
      return { isValid: false, reason: '相手の駒は動かせません' };
    }

    const targetPiece = getPieceAt(board, to);
    if (targetPiece && targetPiece.type === 'player') {
      return { isValid: false, reason: '他の選手がいる場所には移動できません' };
    }

    const maxDistance = Math.max(Math.abs(to.x - piece.position.x), Math.abs(to.y - piece.position.y));
    
    if (maxDistance === 1) {
      return { isValid: true };
    }
    
    const jumpPath = findJumpPath(board, piece.position, to);
    if (jumpPath.length === 0) {
      return { isValid: false, reason: 'ジャンプできるパスがありません' };
    }

  } else if (piece.type === 'ball') {
    const targetPiece = getPieceAt(board, to);
    if (targetPiece && targetPiece.type === 'player' && targetPiece.player !== currentPlayer) {
      return { isValid: false, reason: '相手選手にはパスできません' };
    }

    const maxDistance = Math.max(Math.abs(to.x - piece.position.x), Math.abs(to.y - piece.position.y));
    if (maxDistance > 1) {
      return { isValid: false, reason: '一度に1マスしか移動できません' };
    }
  }

  return { isValid: true };
}

export function movePiece(gameState: GameState, pieceId: string, to: Position): GameState {
  const piece = gameState.board.pieces.find((p: Piece) => p.id === pieceId);
  if (!piece) {
    return gameState;
  }

  const validation = validateMove(gameState.board, piece, to, gameState.currentPlayer);
  if (!validation.isValid) {
    return gameState;
  }

  let updatedPieces = gameState.board.pieces.map((p: Piece) => {
    if (p.id === pieceId) {
      return { ...p, position: to };
    }
    return p;
  });

  // 選手がボールを持っていたら、ボールも一緒に移動
  if (piece.type === 'player') {
    const ballPiece = gameState.board.pieces.find((p: Piece) => p.type === 'ball');
    const playerHasBall = ballPiece && 
      ballPiece.position.x === piece.position.x && 
      ballPiece.position.y === piece.position.y;
    
    if (playerHasBall) {
      updatedPieces = updatedPieces.map((p: Piece) => {
        if (p.type === 'ball') {
          return { ...p, position: to };
        }
        return p;
      });
    } else {
      // ボールを持っていない場合のみボール奪取チェック
      const ballStealResult = checkBallSteal(gameState.board, piece, to, gameState.currentPlayer);
      if (ballStealResult.stolen) {
        updatedPieces = updatedPieces.map((p: Piece) => {
          if (p.type === 'ball') {
            return { ...p, position: to };
          }
          return p;
        });
      }
    }
  }

  const newGameState: GameState = {
    ...gameState,
    board: {
      ...gameState.board,
      pieces: updatedPieces,
    },
    actionsLeft: gameState.actionsLeft - 1,
  };

  if (newGameState.actionsLeft === 0) {
    return endTurn(newGameState);
  }

  return newGameState;
}

function endTurn(gameState: GameState): GameState {
  const ballPiece = gameState.board.pieces.find((p: Piece) => p.type === 'ball');
  if (!ballPiece) {
    return gameState;
  }

  let newGameState = { ...gameState };

  if (isGoalArea(ballPiece.position)) {
    if (ballPiece.position.y === 0) {
      newGameState.score.player1++;
    } else {
      newGameState.score.player2++;
    }

    if (newGameState.score.player1 === 2 || newGameState.score.player2 === 2) {
      newGameState.gameStatus = 'finished';
      newGameState.winner = newGameState.score.player1 === 2 ? 'player1' : 'player2';
    } else {
      newGameState = resetBoardAfterGoal(newGameState);
    }
  }

  return {
    ...newGameState,
    currentPlayer: gameState.currentPlayer === 'player1' ? 'player2' : 'player1',
    actionsLeft: 2,
  };
}

function resetBoardAfterGoal(gameState: GameState): GameState {
  const initialBoard = createInitialBoard();
  
  return {
    ...gameState,
    board: initialBoard,
  };
}