import { useState } from 'react';
import type { GameState, Position, Piece, Player } from '../types/game';
import { getValidPlayerMoves } from '../game';
import styles from './Board.module.css';

interface BoardProps {
  gameState: GameState;
  onPieceMove: (pieceId: string, from: Position, to: Position) => void;
}

export function Board({ gameState, onPieceMove }: BoardProps) {
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [highlightedCells, setHighlightedCells] = useState<Position[]>([]);

  const { board, currentPlayer, actionsLeft, score } = gameState;

  const getPieceAt = (position: Position): Piece | undefined => {
    return board.pieces.find(
      (piece: Piece) => piece.position.x === position.x && piece.position.y === position.y
    );
  };

  const getCellType = (_x: number, y: number): string => {
    if (y === 0 || y === 8) {
      return styles.goalArea;
    }
    if (y === 1 || y === 7) {
      return styles.keeperArea;
    }
    return '';
  };

  const isHighlighted = (x: number, y: number): boolean => {
    return highlightedCells.some(pos => pos.x === x && pos.y === y);
  };

  const getValidMoves = (piece: Piece): Position[] => {
    if (piece.type === 'player') {
      return getValidPlayerMoves(board, piece);
    } else if (piece.type === 'ball') {
      const moves: Position[] = [];
      const { x, y } = piece.position;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx === 0 && dy === 0) continue;
          
          const newX = x + dx;
          const newY = y + dy;
          
          if (newX >= 0 && newX < board.width && newY >= 0 && newY < board.height) {
            const targetPiece = getPieceAt({ x: newX, y: newY });
            if (!targetPiece) {
              moves.push({ x: newX, y: newY });
            } else if (targetPiece.type === 'player' && targetPiece.player === currentPlayer) {
              moves.push({ x: newX, y: newY });
            }
          }
        }
      }

      board.pieces
        .filter((p: Piece) => p.type === 'player' && p.player === currentPlayer)
        .forEach((player: Piece) => {
          const distance = Math.max(
            Math.abs(player.position.x - x),
            Math.abs(player.position.y - y)
          );
          if (distance > 1 && distance <= 3) {
            moves.push(player.position);
          }
        });

      return moves.filter((move, index, self) => 
        self.findIndex(m => m.x === move.x && m.y === move.y) === index
      );
    }

    return [];
  };

  const playSound = (soundType: 'move' | 'goal' | 'steal') => {
    const context = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    switch (soundType) {
      case 'move':
        oscillator.frequency.setValueAtTime(440, context.currentTime);
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        break;
      case 'goal':
        oscillator.frequency.setValueAtTime(880, context.currentTime);
        gainNode.gain.setValueAtTime(0.2, context.currentTime);
        break;
      case 'steal':
        oscillator.frequency.setValueAtTime(330, context.currentTime);
        gainNode.gain.setValueAtTime(0.15, context.currentTime);
        break;
    }
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  };

  const handleCellClick = (x: number, y: number) => {
    const position = { x, y };
    const pieceAtPosition = getPieceAt(position);

    if (selectedPiece) {
      if (isHighlighted(x, y)) {
        const piece = board.pieces.find((p: Piece) => p.id === selectedPiece);
        if (piece) {
          const isGoalArea = position.y === 0 || position.y === 8;
          if (piece.type === 'ball' && isGoalArea) {
            playSound('goal');
          } else {
            playSound('move');
          }
          onPieceMove(selectedPiece, piece.position, position);
        }
      }
      setSelectedPiece(null);
      setHighlightedCells([]);
    } else if (pieceAtPosition) {
      if (
        (pieceAtPosition.type === 'player' && pieceAtPosition.player === currentPlayer) ||
        pieceAtPosition.type === 'ball'
      ) {
        setSelectedPiece(pieceAtPosition.id);
        setHighlightedCells(getValidMoves(pieceAtPosition));
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, x: number, y: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCellClick(x, y);
    }
  };

  const getBallHolder = (): Player | null => {
    const ballPiece = board.pieces.find(p => p.type === 'ball');
    if (!ballPiece) return null;
    
    const playerAtBallPosition = board.pieces.find((p: Piece) => 
      p.type === 'player' && 
      p.position.x === ballPiece.position.x && 
      p.position.y === ballPiece.position.y
    );
    
    return playerAtBallPosition?.player || null;
  };

  const renderPiece = (piece: Piece) => {
    const baseClasses = [styles.piece];
    const ballHolder = getBallHolder();
    
    if (piece.type === 'player' && piece.player) {
      baseClasses.push(styles[piece.player]);
      
      if (piece.player === currentPlayer) {
        baseClasses.push(styles.currentPlayerPiece);
      }
      
      // ボールを持っている選手にはボールホルダークラスを追加
      const ballPiece = board.pieces.find((p: Piece) => p.type === 'ball');
      if (ballPiece && 
          ballPiece.position.x === piece.position.x && 
          ballPiece.position.y === piece.position.y) {
        baseClasses.push(styles.ballHolder);
      }
    } else if (piece.type === 'ball') {
      baseClasses.push(styles.ball);
      
      // ボールの色を保持チームに合わせる
      if (ballHolder === 'player1') {
        baseClasses.push(styles.ballWithPlayer1);
      } else if (ballHolder === 'player2') {
        baseClasses.push(styles.ballWithPlayer2);
      }
    }
    
    if (selectedPiece === piece.id) {
      baseClasses.push(styles.selected);
    }

    const canSelect = (piece.type === 'player' && piece.player === currentPlayer) || piece.type === 'ball';

    const getPlayerNumber = (pieceId: string) => {
      const match = pieceId.match(/\d+$/);
      return match ? parseInt(match[0]) + 1 : 1;
    };

    // ボールを持っている選手かチェック
    const playerHasBall = piece.type === 'player' && (() => {
      const ballPiece = board.pieces.find((p: Piece) => p.type === 'ball');
      return ballPiece && 
        ballPiece.position.x === piece.position.x && 
        ballPiece.position.y === piece.position.y;
    })();

    // ボールを持っている選手の場合はツールチップを表示しない
    // ボール自体も同じ位置に選手がいる場合はツールチップを表示しない
    const shouldShowTooltip = (() => {
      if (!canSelect) return false;
      if (playerHasBall) return false;
      
      // ボール自体の場合、同じ位置に選手がいればツールチップを表示しない
      if (piece.type === 'ball') {
        const playerAtBallPosition = board.pieces.find((p: Piece) => 
          p.type === 'player' && 
          p.position.x === piece.position.x && 
          p.position.y === piece.position.y
        );
        return !playerAtBallPosition;
      }
      
      return true;
    })();

    return (
      <div 
        key={piece.id} 
        className={baseClasses.join(' ')}
        title={shouldShowTooltip ? 'クリックして選択' : ''}
      >
        {piece.type === 'player' ? (
          <>
            <div className={styles.playerNumber}>{getPlayerNumber(piece.id)}</div>
            {/* ボールを持っている選手にボールアイコンを表示 */}
            {(() => {
              const ballPiece = board.pieces.find((p: Piece) => p.type === 'ball');
              const hassBall = ballPiece && 
                ballPiece.position.x === piece.position.x && 
                ballPiece.position.y === piece.position.y;
              return hassBall ? (
                <div className={styles.ballIcon}>⚽</div>
              ) : null;
            })()}
          </>
        ) : (
          '⚽'
        )}
      </div>
    );
  };

  const renderBoard = () => {
    const cells = [];
    
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const piece = getPieceAt({ x, y });
        const cellClasses = [styles.cell, getCellType(x, y)];
        
        if (isHighlighted(x, y)) {
          cellClasses.push(styles.highlighted);
        }

        cells.push(
          <div
            key={`${x}-${y}`}
            className={cellClasses.join(' ')}
            onClick={() => handleCellClick(x, y)}
            onKeyDown={(e) => handleKeyDown(e, x, y)}
            tabIndex={0}
            role="button"
            aria-label={`セル ${x}, ${y}${piece ? ` - ${piece.type === 'ball' ? 'ボール' : piece.player === 'player1' ? 'プレイヤー1の選手' : 'プレイヤー2の選手'}` : ''}`}
          >
            {piece && renderPiece(piece)}
          </div>
        );
      }
    }
    
    return cells;
  };

  return (
    <div>
      <div className={styles.gameInfo}>
        <div className={`${styles.playerScore} ${currentPlayer === 'player1' ? styles.active : ''}`}>
          <div className={styles.playerName}>
            <span className={`${styles.playerIcon} ${styles.player1Icon}`}></span>
            BLUE FC
          </div>
          <div className={styles.playerPoints}>{score.player1}</div>
        </div>
        
        <div className={styles.centerInfo}>
          <div className={styles.actionsLeft}>
            残り {actionsLeft} 回
          </div>
          <div className={styles.turnInfo}>
            アクション可能
          </div>
          <div className={styles.ballStatus}>
            {(() => {
              const ballHolder = getBallHolder();
              const ballPiece = board.pieces.find((p: Piece) => p.type === 'ball');
              const ballPlayerNumber = ballPiece ? board.pieces.find((p: Piece) => 
                p.type === 'player' && 
                p.position.x === ballPiece.position.x && 
                p.position.y === ballPiece.position.y
              ) : null;
              
              const getPlayerNumber = (pieceId: string) => {
                const match = pieceId.match(/\d+$/);
                return match ? parseInt(match[0]) + 1 : 1;
              };
              
              if (ballHolder === 'player1' && ballPlayerNumber) {
                return <span className={styles.ballStatusBlue}>⚽ BLUE FC #{getPlayerNumber(ballPlayerNumber.id)}</span>;
              } else if (ballHolder === 'player2' && ballPlayerNumber) {
                return <span className={styles.ballStatusRed}>⚽ RED FC #{getPlayerNumber(ballPlayerNumber.id)}</span>;
              } else {
                return <span className={styles.ballStatusNeutral}>⚽ フリーボール</span>;
              }
            })()}
          </div>
        </div>
        
        <div className={`${styles.playerScore} ${currentPlayer === 'player2' ? styles.active : ''}`}>
          <div className={styles.playerName}>
            <span className={`${styles.playerIcon} ${styles.player2Icon}`}></span>
            RED FC
          </div>
          <div className={styles.playerPoints}>{score.player2}</div>
        </div>
      </div>
      <div className={styles.board}>
        {renderBoard()}
      </div>
    </div>
  );
}