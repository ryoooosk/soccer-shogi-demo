import { useState, useCallback } from 'react';
import type { GameState, Position } from '../types/game';
import { createInitialGameState, movePiece } from '../game';

export function useGame() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState);
  const [goalAnimation, setGoalAnimation] = useState<{ player: string; show: boolean }>({ player: '', show: false });

  const handlePieceMove = useCallback((pieceId: string, _from: Position, to: Position) => {
    const previousScore = { ...gameState.score };
    const newState = movePiece(gameState, pieceId, to);
    
    // ゴールが決まったかチェック
    if (newState.score.player1 > previousScore.player1) {
      setGoalAnimation({ player: 'player1', show: true });
      setTimeout(() => setGoalAnimation({ player: '', show: false }), 3000);
    } else if (newState.score.player2 > previousScore.player2) {
      setGoalAnimation({ player: 'player2', show: true });
      setTimeout(() => setGoalAnimation({ player: '', show: false }), 3000);
    }
    
    setGameState(newState);
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState(createInitialGameState());
    setGoalAnimation({ player: '', show: false });
  }, []);

  return {
    gameState,
    goalAnimation,
    handlePieceMove,
    resetGame,
  };
}