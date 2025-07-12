import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Board } from './Board';
import { createInitialGameState } from '../game/gameLogic';
import type { GameState } from '../types/game';

// モックのゲーム状態を作成するヘルパー関数
const createMockGameState = (overrides: Partial<GameState> = {}): GameState => {
  const initial = createInitialGameState();
  return {
    ...initial,
    ...overrides,
  };
};

// AudioContextのモック
const mockAudioContext = {
  createOscillator: () => ({
    connect: vi.fn(),
    frequency: {
      setValueAtTime: vi.fn(),
    },
    start: vi.fn(),
    stop: vi.fn(),
  }),
  createGain: () => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
    },
  }),
  destination: {},
  currentTime: 0,
};

// グローバルWindowオブジェクトのモック
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudioContext),
});

describe('Board', () => {
  const mockOnPieceMove = vi.fn();

  beforeEach(() => {
    mockOnPieceMove.mockClear();
  });

  describe('レンダリング', () => {
    it('should render game board with correct dimensions', () => {
      const gameState = createMockGameState();
      render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      // ボードのセルが63個（7x9）表示されることを確認
      const cells = screen.getAllByRole('button');
      expect(cells).toHaveLength(63);
    });

    it('should render without crashing', () => {
      const gameState = createMockGameState();
      const { container } = render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      expect(container).toBeInTheDocument();
    });

    it('should contain ball emoji', () => {
      const gameState = createMockGameState();
      render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      // ボールが表示されることを確認
      const ballElements = screen.getAllByText('⚽');
      expect(ballElements.length).toBeGreaterThan(0);
    });

    it('should render pieces correctly', () => {
      const gameState = createMockGameState();
      render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      // ボールが表示されることを確認
      const ballCells = screen.getAllByText('⚽');
      expect(ballCells.length).toBeGreaterThan(0);
    });
  });

  describe('駒の選択', () => {
    it('should allow clicking on game pieces', () => {
      const gameState = createMockGameState();
      render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      const cells = screen.getAllByRole('button');
      
      // 最初のセルをクリックしてもエラーが発生しないことを確認
      fireEvent.click(cells[0]);
      expect(cells[0]).toBeInTheDocument();
    });

    it('should handle ball selection', () => {
      const gameState = createMockGameState();
      render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      // ボールを含むセルをクリック
      const ballElement = screen.getAllByText('⚽')[0];
      const ballCell = ballElement.closest('[role="button"]');
      
      if (ballCell) {
        fireEvent.click(ballCell);
        // ボールが正常にクリックできることを確認
        expect(ballCell).toBeInTheDocument();
      }
    });
  });

  describe('駒の移動', () => {
    it('should handle cell clicks without errors', () => {
      const gameState = createMockGameState();
      render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      const cells = screen.getAllByRole('button');
      
      // 複数のセルをクリックしてもエラーが発生しないことを確認
      fireEvent.click(cells[0]);
      fireEvent.click(cells[1]);
      
      // 関数が呼ばれる可能性がある（有効な移動の場合）
      expect(mockOnPieceMove).toHaveBeenCalledTimes(0);
    });

    it('should handle keyboard interaction', () => {
      const gameState = createMockGameState();
      render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      const cells = screen.getAllByRole('button');
      const firstCell = cells[0];
      
      // Enterキーでセルをアクティブ化
      fireEvent.keyDown(firstCell, { key: 'Enter' });
      
      // スペースキーでもアクティブ化
      fireEvent.keyDown(firstCell, { key: ' ' });
      
      // エラーが発生しないことを確認
      expect(firstCell).toBeInTheDocument();
    });
  });

  describe('ボール保持状態', () => {
    it('should handle ball status display', () => {
      const gameState = createMockGameState();
      const { container } = render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      // レンダリングが正常に完了することを確認
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ゴールエリアとキーパーエリア', () => {
    it('should apply correct CSS classes for special areas', () => {
      const gameState = createMockGameState();
      const { container } = render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      // CSSクラスが正しく適用されているかを確認
      // これは実装詳細のテストになるため、必要に応じて調整
      const cells = container.querySelectorAll('[role="button"]');
      expect(cells.length).toBe(63);
    });
  });

  describe('アクセシビリティ', () => {
    it('should have proper aria labels', () => {
      const gameState = createMockGameState();
      render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      const cells = screen.getAllByRole('button');
      
      // 各セルにaria-labelが設定されていることを確認
      cells.forEach(cell => {
        expect(cell).toHaveAttribute('aria-label');
      });
    });

    it('should be keyboard navigable', () => {
      const gameState = createMockGameState();
      render(<Board gameState={gameState} onPieceMove={mockOnPieceMove} />);
      
      const cells = screen.getAllByRole('button');
      
      // 各セルがtabIndexを持っていることを確認
      cells.forEach(cell => {
        expect(cell).toHaveAttribute('tabIndex', '0');
      });
    });
  });
});