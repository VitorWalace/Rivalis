import { useState } from 'react';
import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';

interface CustomChessboardProps {
  game: Chess;
  onMove: (from: Square, to: Square) => void;
}

const pieceUnicode: Record<string, string> = {
  'wP': '♙', 'wN': '♘', 'wB': '♗', 'wR': '♖', 'wQ': '♕', 'wK': '♔',
  'bP': '♟', 'bN': '♞', 'bB': '♝', 'bR': '♜', 'bQ': '♛', 'bK': '♚',
};

export default function CustomChessboard({ game, onMove }: CustomChessboardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const handleSquareClick = (square: Square) => {
    if (selectedSquare) {
      // Tentar fazer o movimento
      if (possibleMoves.includes(square)) {
        onMove(selectedSquare, square);
      }
      setSelectedSquare(null);
      setPossibleMoves([]);
    } else {
      // Selecionar peça
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        const moves = game.moves({ square, verbose: true });
        setPossibleMoves(moves.map((m) => m.to as Square));
      }
    }
  };

  const getPieceSymbol = (piece: { type: PieceSymbol; color: Color } | null): string => {
    if (!piece) return '';
    const key = `${piece.color}${piece.type.toUpperCase()}`;
    return pieceUnicode[key] || '';
  };

  const isLightSquare = (fileIndex: number, rankIndex: number): boolean => {
    return (fileIndex + rankIndex) % 2 === 0;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-slate-800 p-4 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-8 gap-0 border-4 border-slate-700 rounded-lg overflow-hidden">
          {ranks.map((rank, rankIndex) =>
            files.map((file, fileIndex) => {
              const square = (file + rank) as Square;
              const piece = game.get(square);
              const isLight = isLightSquare(fileIndex, rankIndex);
              const isSelected = selectedSquare === square;
              const isPossibleMove = possibleMoves.includes(square);

              return (
                <button
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`
                    aspect-square w-full
                    flex items-center justify-center 
                    text-4xl sm:text-5xl md:text-6xl
                    transition-all duration-200
                    hover:brightness-110 active:scale-95
                    relative
                    ${isLight ? 'bg-amber-100' : 'bg-amber-800'}
                    ${isSelected ? 'ring-4 ring-blue-500 ring-inset z-10' : ''}
                  `}
                >
                  <span 
                    className={piece?.color === 'w' ? 'text-white' : 'text-slate-900'}
                    style={{
                      filter: piece?.color === 'w' 
                        ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' 
                        : 'drop-shadow(0 2px 4px rgba(255,255,255,0.8))',
                      textShadow: piece?.color === 'w'
                        ? '2px 2px 4px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.5)'
                        : '2px 2px 4px rgba(255,255,255,0.9), -1px -1px 2px rgba(255,255,255,0.5)'
                    }}
                  >
                    {getPieceSymbol(piece || null)}
                  </span>
                  {isPossibleMove && !piece && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full opacity-60"></div>
                    </div>
                  )}
                  {isPossibleMove && piece && (
                    <div className="absolute inset-0 ring-4 ring-green-500 ring-inset opacity-40"></div>
                  )}
                </button>
              );
            })
          )}
        </div>
        
        {/* Legendas das colunas */}
        <div className="grid grid-cols-8 mt-2">
          {files.map((file) => (
            <div key={file} className="text-center text-white font-bold text-sm sm:text-base">
              {file}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
