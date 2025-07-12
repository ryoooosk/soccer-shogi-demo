import { useState } from 'react';
import styles from './HelpModal.module.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const helpPages = [
    {
      title: "ゲーム目標",
      content: (
        <div>
          <h3>🥅 ゴールの決め方</h3>
          <p><strong>ボールを相手のゴールエリア（赤いエリア）に入れるとゴール！</strong></p>
          <ul>
            <li>先に2点取った方の勝利</li>
            <li>ボールを選択して、相手のゴールエリアに移動させる</li>
            <li>空いているマスにもボールを移動可能</li>
            <li>味方選手にパスしてゴール前まで運ぶ戦略も有効</li>
          </ul>
        </div>
      )
    },
    {
      title: "基本操作",
      content: (
        <div>
          <h3>⚽ 基本の動かし方</h3>
          <ul>
            <li><strong>1ターンに2回</strong>アクション可能</li>
            <li>選手またはボールをクリックして選択</li>
            <li>青くハイライトされたマスに移動可能</li>
            <li>選手：縦・横・斜めに1マス移動（光る駒が選択可能）</li>
            <li>ボール：隣接マスや味方選手に移動</li>
          </ul>
        </div>
      )
    },
    {
      title: "ボール奪取",
      content: (
        <div>
          <h3>⚔️ ボールの奪い方</h3>
          <p><strong>ボールを奪うには2つの方法があります：</strong></p>
          
          <h3>🦘 ジャンプで奪取</h3>
          <ul>
            <li>味方選手でボールを持つ相手選手の位置にジャンプ</li>
            <li>他の駒を飛び越えてでも到達可能</li>
            <li>連続ジャンプで遠くの相手からも奪取可能</li>
            <li><strong>例：</strong>相手が(3,4)にボールを持っている時、味方選手を(3,4)に移動させると奪取</li>
          </ul>
          
          <h3>🤝 挟み撃ちで奪取</h3>
          <ul>
            <li>味方2人でボールを持つ相手を挟むと自動的に奪取</li>
            <li>縦・横・斜めの一直線上で挟む必要がある</li>
            <li><strong>例：</strong>味方が(2,3)と(4,3)にいて、相手が(3,3)にボールを持っている場合、挟み撃ち成功</li>
          </ul>
        </div>
      )
    },
    {
      title: "特殊移動",
      content: (
        <div>
          <h3>🦘 ジャンプ移動の詳細</h3>
          <ul>
            <li>選手は他の駒を飛び越えて移動可能</li>
            <li>連続ジャンプで遠くまで移動できる</li>
            <li>ジャンプ先に相手がいれば、その位置に移動してボール奪取</li>
            <li>ジャンプは縦・横・斜めの全方向に可能</li>
          </ul>
          
          <h3>💨 ボールの長距離パス</h3>
          <ul>
            <li>ボールは隣接マスだけでなく、遠くの味方選手にもパス可能</li>
            <li>距離3マス以内の味方選手に直接パス</li>
            <li>相手を飛び越えてのパスも可能</li>
          </ul>
        </div>
      )
    },
    {
      title: "エリア説明",
      content: (
        <div>
          <h3>🏟️ ボードエリア</h3>
          <ul>
            <li><span style={{color: '#ff6b6b'}}>■</span> <strong>ゴールエリア</strong>：ボールが入ると得点</li>
            <li><span style={{color: '#ffd93d'}}>■</span> <strong>キーパーエリア</strong>：ゴール前の特別エリア</li>
            <li><span style={{color: '#4a7c59'}}>■</span> <strong>フィールド</strong>：通常のプレイエリア</li>
          </ul>
          <p><strong>ヒント：</strong>ボールを直接ゴールエリアに移動させるか、選手と一緒にゴールエリアに入れば得点になります！</p>
        </div>
      )
    }
  ];

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{helpPages[currentPage].title}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.content}>
          {helpPages[currentPage].content}
        </div>
        
        <div className={styles.navigation}>
          <button 
            className={styles.navButton}
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
          >
            ← 前へ
          </button>
          
          <span className={styles.pageIndicator}>
            {currentPage + 1} / {helpPages.length}
          </span>
          
          <button 
            className={styles.navButton}
            onClick={() => setCurrentPage(Math.min(helpPages.length - 1, currentPage + 1))}
            disabled={currentPage === helpPages.length - 1}
          >
            次へ →
          </button>
        </div>
      </div>
    </div>
  );
}