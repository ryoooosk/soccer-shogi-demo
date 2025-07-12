import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  getPieceAt,
  isPositionInBounds,
  isGoalArea,
  isKeeperArea,
  getValidPlayerMoves,
  movePiece,
  BOARD_WIDTH,
  BOARD_HEIGHT,
} from './gameLogic';

describe('gameLogic', () => {
  describe('createInitialGameState', () => {
    it('should create initial game state with correct board dimensions', () => {
      const gameState = createInitialGameState();

      expect(gameState.board.width).toBe(BOARD_WIDTH);
      expect(gameState.board.height).toBe(BOARD_HEIGHT);
      expect(gameState.currentPlayer).toBe('player1');
      expect(gameState.actionsLeft).toBe(2);
      expect(gameState.gameStatus).toBe('playing');
    });

    it('should place 6 pieces for each player plus 1 ball', () => {
      const gameState = createInitialGameState();
      const pieces = gameState.board.pieces;

      const player1Pieces = pieces.filter(p => p.type === 'player' && p.player === 'player1');
      const player2Pieces = pieces.filter(p => p.type === 'player' && p.player === 'player2');
      const ballPieces = pieces.filter(p => p.type === 'ball');

      expect(player1Pieces).toHaveLength(6);
      expect(player2Pieces).toHaveLength(6);
      expect(ballPieces).toHaveLength(1);
    });

    it('should place ball at center position', () => {
      const gameState = createInitialGameState();
      const ball = gameState.board.pieces.find(p => p.type === 'ball');

      expect(ball?.position).toEqual({ x: 3, y: 4 });
    });
  });

  describe('getPieceAt', () => {
    it('should return piece at specified position', () => {
      const gameState = createInitialGameState();
      const piece = getPieceAt(gameState.board, { x: 3, y: 4 });

      expect(piece?.type).toBe('ball');
    });

    it('should return undefined for empty position', () => {
      const gameState = createInitialGameState();
      const piece = getPieceAt(gameState.board, { x: 0, y: 0 });

      expect(piece).toBeUndefined();
    });
  });

  describe('isPositionInBounds', () => {
    it('should return true for valid positions', () => {
      expect(isPositionInBounds({ x: 0, y: 0 })).toBe(true);
      expect(isPositionInBounds({ x: 3, y: 4 })).toBe(true);
      expect(isPositionInBounds({ x: BOARD_WIDTH - 1, y: BOARD_HEIGHT - 1 })).toBe(true);
    });

    it('should return false for invalid positions', () => {
      expect(isPositionInBounds({ x: -1, y: 0 })).toBe(false);
      expect(isPositionInBounds({ x: 0, y: -1 })).toBe(false);
      expect(isPositionInBounds({ x: BOARD_WIDTH, y: 0 })).toBe(false);
      expect(isPositionInBounds({ x: 0, y: BOARD_HEIGHT })).toBe(false);
    });
  });

  describe('isGoalArea', () => {
    it('should return true for top and bottom rows', () => {
      expect(isGoalArea({ x: 3, y: 0 })).toBe(true);
      expect(isGoalArea({ x: 3, y: BOARD_HEIGHT - 1 })).toBe(true);
    });

    it('should return false for non-goal areas', () => {
      expect(isGoalArea({ x: 3, y: 1 })).toBe(false);
      expect(isGoalArea({ x: 3, y: 4 })).toBe(false);
      expect(isGoalArea({ x: 3, y: BOARD_HEIGHT - 2 })).toBe(false);
    });
  });

  describe('isKeeperArea', () => {
    it('should return true for keeper areas', () => {
      expect(isKeeperArea({ x: 3, y: 1 })).toBe(true);
      expect(isKeeperArea({ x: 3, y: BOARD_HEIGHT - 2 })).toBe(true);
    });

    it('should return false for non-keeper areas', () => {
      expect(isKeeperArea({ x: 3, y: 0 })).toBe(false);
      expect(isKeeperArea({ x: 3, y: 4 })).toBe(false);
      expect(isKeeperArea({ x: 3, y: BOARD_HEIGHT - 1 })).toBe(false);
    });
  });

  describe('getValidPlayerMoves', () => {
    it('should return adjacent empty positions for player piece', () => {
      const gameState = createInitialGameState();

      // プレイヤー1の駒（3,6位置）を選択
      const player = gameState.board.pieces.find(
        p => p.type === 'player' && p.player === 'player1' && p.position.x === 3 && p.position.y === 6
      );

      expect(player).toBeDefined();

      if (player) {
        const moves = getValidPlayerMoves(gameState.board, player);

        // 隣接する空きマスを確認
        expect(moves.some(m => m.x === 2 && m.y === 5)).toBe(true);
        expect(moves.some(m => m.x === 3 && m.y === 5)).toBe(true);
        expect(moves.some(m => m.x === 4 && m.y === 5)).toBe(true);
      }
    });

    it('should not allow moves to positions occupied by other players', () => {
      const gameState = createInitialGameState();

      // プレイヤー1の駒を選択
      const player = gameState.board.pieces.find(
        p => p.type === 'player' && p.player === 'player1' && p.position.x === 2 && p.position.y === 7
      );

      if (player) {
        const moves = getValidPlayerMoves(gameState.board, player);

        // 他のプレイヤーがいる位置には移動できない
        expect(moves.some(m => m.x === 1 && m.y === 7)).toBe(false); // 隣接するプレイヤー1の駒
        expect(moves.some(m => m.x === 3 && m.y === 7)).toBe(false); // 隣接するプレイヤー1の駒
      }
    });
  });

  describe('movePiece', () => {
    it('should move piece to valid position', () => {
      const gameState = createInitialGameState();

      // プレイヤー1の駒を移動
      const player = gameState.board.pieces.find(
        p => p.type === 'player' && p.player === 'player1' && p.position.x === 3 && p.position.y === 6
      );

      expect(player).toBeDefined();

      if (player) {
        const newGameState = movePiece(gameState, player.id, { x: 3, y: 5 });
        const movedPiece = newGameState.board.pieces.find(p => p.id === player.id);

        expect(movedPiece?.position).toEqual({ x: 3, y: 5 });
        expect(newGameState.actionsLeft).toBe(1);
      }
    });

    it('should not move piece to invalid position', () => {
      const gameState = createInitialGameState();

      const player = gameState.board.pieces.find(
        p => p.type === 'player' && p.player === 'player1'
      );

      if (player) {
        // 盤面外への移動を試行
        const newGameState = movePiece(gameState, player.id, { x: -1, y: 0 });
        const piece = newGameState.board.pieces.find(p => p.id === player.id);

        // 位置が変わらないことを確認
        expect(piece?.position).toEqual(player.position);
        expect(newGameState.actionsLeft).toBe(2); // アクションも消費されない
      }
    });

    it('should end turn when actions reach zero', () => {
      let gameState = createInitialGameState();

      const player = gameState.board.pieces.find(
        p => p.type === 'player' && p.player === 'player1' && p.position.x === 3 && p.position.y === 6
      );

      if (player) {
        // 1回目の移動
        gameState = movePiece(gameState, player.id, { x: 3, y: 5 });
        expect(gameState.actionsLeft).toBe(1);
        expect(gameState.currentPlayer).toBe('player1');

        // 2回目の移動でターン終了
        gameState = movePiece(gameState, player.id, { x: 3, y: 4 });
        expect(gameState.actionsLeft).toBe(2);
        expect(gameState.currentPlayer).toBe('player2');
      }
    });

    it('should handle game state updates correctly', () => {
      const gameState = createInitialGameState();

      const player = gameState.board.pieces.find(
        p => p.type === 'player' && p.player === 'player1' && p.position.x === 3 && p.position.y === 6
      );

      if (player) {
        const newGameState = movePiece(gameState, player.id, { x: 3, y: 5 });

        // ゲーム状態が正常に更新されることを確認
        expect(newGameState.board.pieces).toBeDefined();
        expect(newGameState.actionsLeft).toBe(1);
      }
    });
  });
});