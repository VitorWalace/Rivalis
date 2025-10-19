import { useState } from 'react';
import { Undo, Flag, Download, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Chess, type Square } from 'chess.js';
import CustomChessboard from './CustomChessboard';

interface ChessEditorProps {
  whitePlayer: string;
  blackPlayer: string;
  onFinish: (data: MatchData) => void;
}

interface MatchData {
  moves: string[];
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
  whitePlayer: string;
  blackPlayer: string;
  pgn: string;
  fen: string;
}

export function SimpleChessEditor({ whitePlayer, blackPlayer, onFinish }: ChessEditorProps) {
  const [game] = useState(new Chess());
  const [, setPosition] = useState(game.fen());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [result, setResult] = useState<'1-0' | '0-1' | '1/2-1/2' | '*'>('*');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMove = (from: Square, to: Square) => {
    try {
      const move = game.move({
        from,
        to,
        promotion: 'q', // sempre promover para rainha
      });

      if (move === null) return;

      setPosition(game.fen());
      setMoveHistory(game.history({ verbose: false }));
      setRefreshKey(prev => prev + 1); // Força re-render do tabuleiro
      
      toast.success(`${move.color === 'w' ? '⚪' : '⚫'} ${move.san}`);

      // Verificar xeque-mate, empate, etc
      if (game.isCheckmate()) {
        const winner = game.turn() === 'w' ? blackPlayer : whitePlayer;
        toast.success(`🏆 Xeque-mate! ${winner} venceu!`, { duration: 5000 });
      } else if (game.isDraw()) {
        toast.success('🤝 Empate!', { duration: 5000 });
      } else if (game.isCheck()) {
        toast.error('⚠️ Xeque!');
      }
    } catch (error) {
      // Movimento inválido
    }
  };

  const undoLast = () => {
    const move = game.undo();
    if (move === null) {
      toast.error('Nenhum movimento para desfazer');
      return;
    }

    setPosition(game.fen());
    setMoveHistory(game.history({ verbose: false }));
    toast.success('Último movimento desfeito');
  };

  const resetGame = () => {
    if (confirm('Tem certeza que deseja reiniciar a partida?')) {
      game.reset();
      setPosition(game.fen());
      setMoveHistory([]);
      setResult('*');
      toast.success('Partida reiniciada');
    }
  };

  const generatePGN = (): string => {
    const date = new Date().toISOString().split('T')[0];
    let pgn = `[Event "Partida Rivalis"]\n`;
    pgn += `[Date "${date}"]\n`;
    pgn += `[White "${whitePlayer}"]\n`;
    pgn += `[Black "${blackPlayer}"]\n`;
    pgn += `[Result "${result}"]\n\n`;
    pgn += game.pgn();
    pgn += ` ${result}`;
    return pgn;
  };

  const downloadPGN = () => {
    const pgn = generatePGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${whitePlayer}_vs_${blackPlayer}_${new Date().getTime()}.pgn`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('PGN baixado com sucesso!');
  };

  const handleFinish = (finalResult: '1-0' | '0-1' | '1/2-1/2') => {
    setResult(finalResult);
    const data: MatchData = {
      moves: moveHistory,
      result: finalResult,
      whitePlayer,
      blackPlayer,
      pgn: generatePGN(),
      fen: game.fen(),
    };

    onFinish(data);
    
    let message = '';
    if (finalResult === '1-0') {
      message = `🏆 ${whitePlayer} venceu!`;
    } else if (finalResult === '0-1') {
      message = `🏆 ${blackPlayer} venceu!`;
    } else {
      message = '🤝 Empate!';
    }
    
    toast.success(message);
  };

  // Agrupar movimentos em pares (brancas, pretas)
  const movePairs: Array<{ number: number; white: string; black?: string }> = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1],
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-stone-200 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-900">♟️ Partida de Xadrez</h2>
            <div className="text-xl font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-lg">
              Movimento {Math.floor(moveHistory.length / 2) + 1}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Tabuleiro */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabuleiro */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              {/* Jogador Pretas (no topo) */}
              <div className="mb-4 bg-slate-800 text-center p-4 rounded-xl shadow-lg">
                <div className="text-lg font-semibold text-slate-300">
                  ⚫ {blackPlayer}
                </div>
                {game.turn() === 'b' && (
                  <div className="mt-2 text-green-400 font-semibold flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Vez de jogar
                  </div>
                )}
              </div>

              {/* Tabuleiro */}
              <CustomChessboard key={refreshKey} game={game} onMove={handleMove} />

              {/* Jogador Brancas (embaixo) */}
              <div className="mt-4 bg-white border-2 border-slate-300 text-center p-4 rounded-xl shadow-lg">
                <div className="text-lg font-semibold text-slate-900">
                  ⚪ {whitePlayer}
                </div>
                {game.turn() === 'w' && (
                  <div className="mt-2 text-green-600 font-semibold flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    Vez de jogar
                  </div>
                )}
              </div>

              {/* Status do Jogo */}
              <div className="mt-6 text-center">
                {game.isCheck() && !game.isCheckmate() && (
                  <div className="bg-red-100 text-red-800 py-3 px-6 rounded-xl font-bold text-lg animate-pulse">
                    ⚠️ XEQUE!
                  </div>
                )}
                {game.isCheckmate() && (
                  <div className="bg-green-100 text-green-800 py-3 px-6 rounded-xl font-bold text-lg">
                    🏆 XEQUE-MATE! {game.turn() === 'w' ? blackPlayer : whitePlayer} VENCEU!
                  </div>
                )}
                {game.isDraw() && (
                  <div className="bg-yellow-100 text-yellow-800 py-3 px-6 rounded-xl font-bold text-lg">
                    🤝 EMPATE!
                  </div>
                )}
              </div>
            </div>

            {/* Dica */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl shadow-lg p-4">
              <h3 className="text-md font-bold text-blue-900 mb-2">💡 Como jogar:</h3>
              <p className="text-sm text-slate-700">
                Arraste as peças no tabuleiro para fazer seus movimentos. O jogo valida automaticamente 
                as jogadas e detecta xeque, xeque-mate e empate.
              </p>
            </div>
          </div>

          {/* Coluna Direita - Histórico e Controles */}
          <div className="space-y-6">
            {/* Histórico de Movimentos */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                📋 Movimentos
                <span className="text-sm font-normal text-slate-500 ml-auto">
                  {moveHistory.length} lance{moveHistory.length !== 1 ? 's' : ''}
                </span>
              </h3>
              {movePairs.length > 0 ? (
                <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {movePairs.map((pair, index) => (
                    <div
                      key={pair.number}
                      className={`p-3 rounded-lg font-mono text-base transition-colors ${
                        index === movePairs.length - 1 
                          ? 'bg-blue-50 border-2 border-blue-200' 
                          : 'bg-slate-50 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-bold text-slate-600 mr-2">{pair.number}.</span>
                      <span className="text-slate-900 font-semibold">{pair.white}</span>
                      {pair.black && (
                        <span className="text-slate-900 font-semibold ml-4">{pair.black}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-400 text-center py-8 bg-slate-50 rounded-lg">
                  <div className="text-4xl mb-2">♟️</div>
                  <p className="text-sm">Nenhum movimento ainda</p>
                </div>
              )}
            </div>

            {/* Controles */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                🎮 Controles
              </h3>
              <div className="space-y-3">
                <button
                  onClick={undoLast}
                  disabled={moveHistory.length === 0}
                  className="w-full h-14 bg-slate-200 hover:bg-slate-300 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Undo className="h-5 w-5" />
                  Desfazer
                </button>

                <button
                  onClick={resetGame}
                  className="w-full h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  Reiniciar
                </button>

                <button
                  onClick={downloadPGN}
                  disabled={moveHistory.length === 0}
                  className="w-full h-14 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Baixar PGN
                </button>
              </div>
            </div>

            {/* Finalizar Partida */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Finalizar
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleFinish('1-0')}
                  className="w-full h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Brancas Vencem
                </button>
                <button
                  onClick={() => handleFinish('1/2-1/2')}
                  className="w-full h-14 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Empate
                </button>
                <button
                  onClick={() => handleFinish('0-1')}
                  className="w-full h-14 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  Pretas Vencem
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
