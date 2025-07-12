export type Player = 'player1' | 'player2';

export type PieceType = 'player' | 'ball';

export interface Position {
  x: number;
  y: number;
}

export interface Piece {
  id: string;
  type: PieceType;
  player?: Player;
  position: Position;
}

export interface Board {
  width: number;
  height: number;
  pieces: Piece[];
}


export interface GameState {
  board: Board;
  currentPlayer: Player;
  actionsLeft: number;
  score: {
    player1: number;
    player2: number;
  };
  gameStatus: 'playing' | 'finished';
  winner?: Player;
}


