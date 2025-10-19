import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchEditor } from '../store/matchEditorStore';
import { useChampionshipStore } from '../store/championshipStore';
import type { SportType } from '../types/match';
import { SimpleFutsalEditor } from '../components/match-editor/SimpleFutsalEditor';
import { SimpleBasketballEditor } from '../components/match-editor/SimpleBasketballEditor';
import { SimpleVolleyballEditor } from '../components/match-editor/SimpleVolleyballEditor';
import { SimpleHandballEditor } from '../components/match-editor/SimpleHandballEditor';
import { SimpleTableTennisEditor } from '../components/match-editor/SimpleTableTennisEditor';
import { SimpleChessEditor } from '../components/match-editor/SimpleChessEditor'; 
import { X, ArrowLeft, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function MatchEditorPage() {
  const navigate = useNavigate();
  const { currentMatch, createMatch, finishMatch, resetMatch, championshipId, gameId } = useMatchEditor();
  const { updateGame } = useChampionshipStore();
  const [showCreateModal, setShowCreateModal] = useState(!currentMatch);
  const [formData, setFormData] = useState({
    sport: 'volei' as SportType,
    homeTeam: '',
    awayTeam: '',
    championship: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Fechar modal quando currentMatch for criado
  useEffect(() => {
    if (currentMatch) {
      setShowCreateModal(false);
    }
  }, [currentMatch]);

  const sports = [
    { id: 'volei', name: 'Vôlei', emoji: '🏐', color: 'from-yellow-500 to-yellow-600' },
    { id: 'basquete', name: 'Basquete', emoji: '🏀', color: 'from-orange-500 to-orange-600' },
    { id: 'futsal', name: 'Futsal', emoji: '⚽', color: 'from-green-500 to-green-600' },
    { id: 'handebol', name: 'Handebol', emoji: '🤾', color: 'from-red-500 to-red-600' },
    { id: 'tenis_mesa', name: 'Tênis de Mesa', emoji: '🏓', color: 'from-blue-500 to-blue-600' },
    { id: 'xadrez', name: 'Xadrez', emoji: '♟️', color: 'from-purple-500 to-purple-600' },
  ];

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.homeTeam || !formData.awayTeam) {
      toast.error('Preencha os times!');
      return;
    }

    createMatch(formData);
    setShowCreateModal(false);
    toast.success('Partida criada! Comece a registrar os eventos.');
  };

  const handleCancelMatch = () => {
    if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
      resetMatch();
      navigate('/');
    }
  };

  const handleFinishMatch = (data: any) => {
    console.log('Dados da partida:', data);
    
    // Se tiver gameId, atualizar a partida no campeonato
    if (gameId && championshipId) {
      // Calcular placar baseado no tipo de esporte
      let homeScore = 0;
      let awayScore = 0;
      
      if (currentMatch?.sport === 'xadrez') {
        // Para xadrez, usar o resultado
        if (data.result === '1-0') {
          homeScore = 1;
          awayScore = 0;
        } else if (data.result === '0-1') {
          homeScore = 0;
          awayScore = 1;
        } else if (data.result === '1/2-1/2') {
          homeScore = 0.5;
          awayScore = 0.5;
        }
      } else if (currentMatch?.sport === 'volei') {
        // Para vôlei, contar sets ganhos
        const sets = data.sets || [];
        sets.forEach((set: any) => {
          if (set.homeScore > set.awayScore) homeScore++;
          else if (set.awayScore > set.homeScore) awayScore++;
        });
      } else if (currentMatch?.sport === 'basquete') {
        // Para basquete, somar todos os pontos
        const quarters = data.quarters || [];
        quarters.forEach((quarter: any) => {
          homeScore += quarter.homeScore || 0;
          awayScore += quarter.awayScore || 0;
        });
      } else if (currentMatch?.sport === 'futsal' || currentMatch?.sport === 'handebol') {
        // Para futsal e handebol, usar gols diretos
        homeScore = data.homeScore || 0;
        awayScore = data.awayScore || 0;
      } else if (currentMatch?.sport === 'tenis_mesa') {
        // Para tênis de mesa, contar games ganhos
        const games = data.games || [];
        games.forEach((game: any) => {
          if (game.winner === 'playerA') homeScore++;
          else if (game.winner === 'playerB') awayScore++;
        });
      }
      
      // Atualizar o jogo no campeonato
      updateGame(gameId, {
        status: 'finished',
        homeScore,
        awayScore,
        playedAt: new Date(),
      });
      
      toast.success('Partida salva e atualizada no campeonato!');
    } else {
      toast.success('Partida finalizada!');
    }
    
    finishMatch();
    
    // Redirecionar para o campeonato se houver championshipId, senão para dashboard
    if (championshipId) {
      navigate(`/championship/${championshipId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const renderEditor = () => {
    if (!currentMatch) return null;

    const { homeTeam, awayTeam } = currentMatch;

    switch (currentMatch.sport) {
      case 'volei':
        return <SimpleVolleyballEditor homeTeam={homeTeam} awayTeam={awayTeam} onFinish={handleFinishMatch} />;
      case 'basquete':
        return <SimpleBasketballEditor homeTeam={homeTeam} awayTeam={awayTeam} onFinish={handleFinishMatch} />;
      case 'futsal':
        return <SimpleFutsalEditor homeTeam={homeTeam} awayTeam={awayTeam} onFinish={handleFinishMatch} />;
      case 'handebol':
        return <SimpleHandballEditor homeTeam={homeTeam} awayTeam={awayTeam} onFinish={handleFinishMatch} />;
      case 'tenis_mesa':
        return <SimpleTableTennisEditor homePlayer={homeTeam} awayPlayer={awayTeam} onFinish={handleFinishMatch} />;
      case 'xadrez':
        return <SimpleChessEditor whitePlayer={homeTeam} blackPlayer={awayTeam} onFinish={handleFinishMatch} />;
      default:
        return <div>Esporte não suportado</div>;
    }
  };

  // Se não houver partida e o modal estiver fechado, redirecionar
  useEffect(() => {
    if (!currentMatch && !showCreateModal) {
      setShowCreateModal(true);
    }
  }, [currentMatch, showCreateModal]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Modal de Criação */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-3xl font-bold text-white mb-6">Nova Partida</h2>

              <form onSubmit={handleCreateMatch} className="space-y-6">
                {/* Seleção de Esporte */}
                <div>
                  <label className="text-gray-300 font-bold mb-3 block">
                    Selecione o Esporte
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sports.map((sport) => (
                      <button
                        key={sport.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, sport: sport.id as SportType })}
                        className={`
                          p-4 rounded-lg text-white font-bold transition-all
                          ${
                            formData.sport === sport.id
                              ? `bg-gradient-to-br ${sport.color} ring-4 ring-white/50 scale-105`
                              : 'bg-gray-700 hover:bg-gray-600'
                          }
                        `}
                      >
                        <div className="text-4xl mb-2">{sport.emoji}</div>
                        <div>{sport.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Times */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 font-bold mb-2 block">
                      Time Mandante / Jogador A
                    </label>
                    <input
                      type="text"
                      value={formData.homeTeam}
                      onChange={(e) => setFormData({ ...formData, homeTeam: e.target.value })}
                      placeholder="Nome do time..."
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-bold mb-2 block">
                      Time Visitante / Jogador B
                    </label>
                    <input
                      type="text"
                      value={formData.awayTeam}
                      onChange={(e) => setFormData({ ...formData, awayTeam: e.target.value })}
                      placeholder="Nome do time..."
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Campeonato e Data */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 font-bold mb-2 block">
                      Campeonato
                    </label>
                    <input
                      type="text"
                      value={formData.championship}
                      onChange={(e) => setFormData({ ...formData, championship: e.target.value })}
                      placeholder="Nome do campeonato..."
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-300 font-bold mb-2 block">
                      Data
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Criar Partida
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor de Partida */}
      {currentMatch && (
        <div className="p-6">
          {/* Header */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-6 h-6 text-white" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {currentMatch.homeTeam} vs {currentMatch.awayTeam}
                  </h1>
                  <p className="text-gray-400">
                    {currentMatch.championship} • {new Date(currentMatch.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancelMatch}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
                >
                  <X className="w-5 h-5" />
                  Cancelar
                </motion.button>
              </div>
            </div>
          </div>

          {/* Editor Específico */}
          {renderEditor()}
        </div>
      )}
    </div>
  );
}
