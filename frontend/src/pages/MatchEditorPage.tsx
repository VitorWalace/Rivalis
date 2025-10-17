import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMatchEditor } from '../../store/matchEditorStore';
import type { SportType } from '../../types/match';
import { VoleiEditor } from '../../components/match-editor/VoleiEditor';
import { BasqueteEditor } from '../../components/match-editor/BasqueteEditor';
import { FutsalEditor } from '../../components/match-editor/FutsalEditor';
import { TenisMesaEditor } from '../../components/match-editor/TenisMesaEditor';
import { XadrezEditor } from '../../components/match-editor/XadrezEditor';
import { Save, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export function MatchEditorPage() {
  const navigate = useNavigate();
  const { currentMatch, createMatch, finishMatch, resetMatch } = useMatchEditor();
  const [showCreateModal, setShowCreateModal] = useState(!currentMatch);
  const [formData, setFormData] = useState({
    sport: 'volei' as SportType,
    homeTeam: '',
    awayTeam: '',
    championship: '',
    date: new Date().toISOString().split('T')[0],
  });

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

  const handleSaveMatch = () => {
    finishMatch();
    toast.success('Partida salva com sucesso!');
    // TODO: Enviar para API
    navigate('/matches');
  };

  const handleCancelMatch = () => {
    if (confirm('Tem certeza que deseja cancelar? Todos os dados serão perdidos.')) {
      resetMatch();
      navigate('/');
    }
  };

  const renderEditor = () => {
    if (!currentMatch) return null;

    switch (currentMatch.sport) {
      case 'volei':
        return <VoleiEditor />;
      case 'basquete':
        return <BasqueteEditor />;
      case 'futsal':
        return <FutsalEditor />;
      case 'handebol':
        return <FutsalEditor />; // Reusa o mesmo componente
      case 'tenis_mesa':
        return <TenisMesaEditor />;
      case 'xadrez':
        return <XadrezEditor />;
      default:
        return <div>Esporte não suportado</div>;
    }
  };

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
                    <Save className="w-5 h-5" />
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
                  onClick={handleSaveMatch}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Salvar Partida
                </motion.button>
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
