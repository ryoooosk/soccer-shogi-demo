import { useState, useEffect } from 'react';
import { Board, HelpModal } from './components';
import { useGame } from './hooks';
import './App.css';

function App() {
  const { gameState, goalAnimation, handlePieceMove, resetGame } = useGame();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const hasSeenHelp = localStorage.getItem('soccer-shogi-help-seen');
    if (!hasSeenHelp) {
      setShowHelp(true);
    }
  }, []);

  const handleCloseHelp = () => {
    setShowHelp(false);
    localStorage.setItem('soccer-shogi-help-seen', 'true');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>サッカー将棋</h1>
        {gameState.gameStatus === 'finished' && (
          <div className="game-finished">
            <h2>🏆 ゲーム終了！</h2>
            <p>
              <span className={`winner-team ${gameState.winner === 'player1' ? 'blue-team' : 'red-team'}`}>
                {gameState.winner === 'player1' ? 'BLUE FC' : 'RED FC'}
              </span> の勝利！
            </p>
            <button onClick={resetGame} className="reset-button">
              新しいゲーム
            </button>
          </div>
        )}
      </header>
      
      <main className="app-main">
        <Board gameState={gameState} onPieceMove={handlePieceMove} />
        
        {goalAnimation.show && (
          <div className={`goal-animation ${goalAnimation.player === 'player1' ? 'blue-goal' : 'red-goal'}`}>
            <div className="goal-content">
              <div className="goal-text">🎉 GOAL! 🎉</div>
              <div className="goal-team">
                {goalAnimation.player === 'player1' ? 'BLUE FC' : 'RED FC'}
              </div>
              <div className="goal-particles">
                {'⭐'.repeat(8).split('').map((star, i) => (
                  <span key={i} className={`particle particle-${i}`}>{star}</span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {gameState.gameStatus === 'playing' && (
          <div className="game-controls">
            <button onClick={() => setShowHelp(true)} className="help-button">
              ？ ヘルプ
            </button>
            <button onClick={resetGame} className="reset-button">
              ゲームリセット
            </button>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <div className="rules-summary">
          <h3>🎯 ゴールの決め方</h3>
          <ul>
            <li>ボールを選択して、相手のゴールエリア（赤いエリア）に移動</li>
            <li>空いているマスにもボールを移動可能</li>
            <li>1ターンに2回のアクションが可能</li>
            <li>先に2点取得したプレイヤーの勝利</li>
          </ul>
          
          <h3>⚔️ ボールの奪い方</h3>
          <ul>
            <li><strong>ジャンプ：</strong>味方選手をボールを持つ相手の位置に移動</li>
            <li><strong>挟み撃ち：</strong>味方2人で相手を一直線上で挟む</li>
          </ul>
          
          <p style={{textAlign: 'center', margin: '10px 0 0 0'}}>
            <button onClick={() => setShowHelp(true)} className="help-link">
              詳しいルールを見る →
            </button>
          </p>
        </div>
      </footer>
      
      <HelpModal isOpen={showHelp} onClose={handleCloseHelp} />
    </div>
  );
}

export default App;