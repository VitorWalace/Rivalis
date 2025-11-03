import { useEffect, useMemo, useState } from 'react';
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';

interface CustomChessboardProps {
  game: Chess;
  onMove: (from: Square, to: Square) => void;
  orientation?: 'white' | 'black';
  lastMoveSquares?: [Square, Square] | null;
  disabled?: boolean;
}

const pieceUnicode: Record<string, string> = {
  wP: '♙',
  wN: '♘',
  wB: '♗',
  wR: '♖',
  wQ: '♕',
  wK: '♔',
  bP: '♟',
  bN: '♞',
  bB: '♝',
  bR: '♜',
  bQ: '♛',
  bK: '♚',
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const;

const getPieceSymbol = (piece: { type: PieceSymbol; color: Color } | null): string => {
  if (!piece) return '';
  const key = `${piece.color}${piece.type.toUpperCase()}`;
  return pieceUnicode[key] || '';
};

const isLightSquare = (fileIndex: number, rankIndex: number): boolean => (
  (fileIndex + rankIndex) % 2 === 0
);

export default function CustomChessboard({
  game,
  onMove,
  orientation = 'white',
  lastMoveSquares,
  disabled = false,
}: CustomChessboardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);

  const files = useMemo(() => (
    orientation === 'white' ? [...FILES] : [...FILES].reverse()
  ), [orientation]);

  const ranks = useMemo(() => (
    orientation === 'white' ? [...RANKS].reverse() : [...RANKS]
  ), [orientation]);

  useEffect(() => {
    if (disabled) {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  }, [disabled]);

  useEffect(() => {
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, [orientation]);

  const handleSquareClick = (square: Square) => {
    if (disabled) {
      return;
    }

    if (selectedSquare) {
      if (possibleMoves.includes(square)) {
        onMove(selectedSquare, square);
      }
      setSelectedSquare(null);
      setPossibleMoves([]);
    } else {
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves.map(move => move.to as Square));
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-slate-800 p-4 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-8 gap-0 border-4 border-slate-700 rounded-lg overflow-hidden">
          {ranks.map((rank, rankIndex) =>
            files.map((file, fileIndex) => {
              const square = (file + rank) as Square;
              const piece = game.get(square);
              const isSelected = selectedSquare === square;
              const isPossibleMove = possibleMoves.includes(square);
              const isLastMove = lastMoveSquares?.includes(square) ?? false;
              const lightSquare = isLightSquare(fileIndex, rankIndex);

              return (
                <button
                  key={square}
                  type="button"
                  onClick={() => handleSquareClick(square)}
                  disabled={disabled}
                  aria-label={`Casa ${square}`}
                  aria-pressed={isSelected}
                  className={`aspect-square w-full flex items-center justify-center text-4xl sm:text-5xl md:text-6xl transition-all duration-200 relative ${
                    lightSquare ? 'bg-amber-100' : 'bg-amber-800'
                  } ${
                    isSelected ? 'ring-4 ring-blue-500 ring-inset z-10' : ''
                  } ${
                    disabled ? 'cursor-not-allowed opacity-80' : 'hover:brightness-110 active:scale-95'
                  }`}
                >
                  {isLastMove && (
                    <span className="absolute inset-0 rounded-lg bg-cyan-400/25" aria-hidden="true" />
                  )}
                  <span
                    className={piece?.color === 'w' ? 'text-white' : 'text-slate-900'}
                    style={{
                      filter:
                        piece?.color === 'w'
                          ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))'
                          : 'drop-shadow(0 2px 4px rgba(255,255,255,0.8))',
                      textShadow:
                        piece?.color === 'w'
                          ? '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.5)'
                          : '2px 2px 4px rgba(255,255,255,0.9), -1px -1px 2px rgba(255,255,255,0.5)',
                    }}
                  >
                    {getPieceSymbol(piece || null)}
                  </span>
                  {isPossibleMove && !piece && (
                    <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                      <span className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-500/80" />
                    </span>
                  )}
                  {isPossibleMove && piece && (
                    <span className="absolute inset-0 ring-4 ring-emerald-500/70 ring-inset" aria-hidden="true" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="grid grid-cols-8 mt-2">
          {files.map(file => (
            <div key={file} className="text-center text-white font-bold text-sm sm:text-base">
              {file}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
