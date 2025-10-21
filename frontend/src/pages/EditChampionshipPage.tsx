import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useChampionshipStore } from '../store/championshipStore';
import { getSportDisplayName } from '../config/sportsCatalog';
import type { SportId, Championship } from '../types';
import toast from 'react-hot-toast';

export default function EditChampionshipPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const championships = useChampionshipStore((state) => state.championships);
  const updateChampionship = useChampionshipStore((state) => state.updateChampionship);

  const championship = championships.find((c) => c.id === id);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    sport: SportId;
    location: string;
    startDate: string;
    registrationDeadline: string;
    format: string;
    visibility: Championship['visibility'];
    maxParticipants: number;
    hasEntryFee: boolean;
    entryFee: number;
    prizePool: number;
    prizeDistribution: string;
  }>({
    name: '',
    description: '',
    sport: 'futsal',
    location: '',
    startDate: '',
    registrationDeadline: '',
    format: '',
    visibility: 'public',
    maxParticipants: 16,
    hasEntryFee: false,
    entryFee: 0,
    prizePool: 0,
    prizeDistribution: '',
  });

  useEffect(() => {
    if (!championship) {
      toast.error('Campeonato não encontrado');
      navigate('/championships');
      return;
    }

    const formatDate = (date: string | Date | undefined): string => {
      if (!date) return '';
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toISOString().split('T')[0];
    };

    setFormData({
      name: championship.name || '',
      description: championship.description || '',
      sport: championship.sport || 'futsal',
      location: championship.location || '',
      startDate: formatDate(championship.startDate),
      registrationDeadline: formatDate(championship.registrationDeadline),
      format: championship.format || '',
      visibility: championship.visibility || 'public',
      maxParticipants: championship.maxParticipants || 16,
      hasEntryFee: championship.hasEntryFee || false,
      entryFee: championship.entryFee || 0,
      prizePool: championship.prizePool || 0,
      prizeDistribution: championship.prizeDistribution || '',
    });
  }, [championship, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Nome do campeonato é obrigatório');
      return;
    }

    if (!id) {
      toast.error('ID do campeonato não encontrado');
      return;
    }

    try {
      // Convert dates back to Date objects for the store
      const updateData: Partial<Championship> = {
        ...formData,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        registrationDeadline: formData.registrationDeadline ? new Date(formData.registrationDeadline) : undefined,
      };

      await updateChampionship(id, updateData);
      toast.success('Campeonato atualizado com sucesso!');
      navigate(`/championship/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar campeonato');
    }
  };

  if (!championship) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/championships"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Voltar para campeonatos
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-3xl shadow-lg">
              📝
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Editar Campeonato</h1>
              <p className="text-sm text-slate-600 mt-1">Atualize as informações do campeonato</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">
                1
              </span>
              Informações Básicas
            </h2>

            <div className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Nome do Campeonato *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                  placeholder="Digite o nome do campeonato"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium resize-none"
                  placeholder="Descreva o campeonato..."
                />
              </div>

              {/* Sport */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Esporte
                </label>
                <select
                  value={formData.sport}
                  onChange={(e) => setFormData({ ...formData, sport: e.target.value as SportId })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                  disabled
                >
                  <option value={formData.sport}>{getSportDisplayName(formData.sport)}</option>
                </select>
                <p className="mt-2 text-xs text-slate-600">
                  O esporte não pode ser alterado após a criação do campeonato
                </p>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Local
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                  placeholder="Digite o local do campeonato"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Data de Início
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Prazo de Inscrição
                  </label>
                  <input
                    type="date"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({ ...formData, registrationDeadline: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">
                2
              </span>
              Configurações
            </h2>

            <div className="space-y-5">
              {/* Format */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Formato do Campeonato
                </label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                >
                  <option value="groups-and-playoffs">Fase de Grupos + Mata-Mata</option>
                  <option value="round-robin">Pontos Corridos</option>
                  <option value="single-elimination">Mata-Mata</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Visibilidade
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as Championship['visibility'] })}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                >
                  <option value="public">Público</option>
                  <option value="private">Privado</option>
                </select>
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Número Máximo de Participantes
                </label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value) || 0 })}
                  min="2"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Prize Information */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 text-sm font-bold">
                3
              </span>
              Premiação
            </h2>

            <div className="space-y-5">
              {/* Entry Fee Toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hasEntryFee"
                  checked={formData.hasEntryFee}
                  onChange={(e) => setFormData({ ...formData, hasEntryFee: e.target.checked })}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="hasEntryFee" className="text-sm font-bold text-slate-900">
                  Possui taxa de inscrição
                </label>
              </div>

              {/* Entry Fee */}
              {formData.hasEntryFee && (
                <div>
                  <label className="block text-sm font-bold text-slate-900 mb-2">
                    Valor da Taxa (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.entryFee}
                    onChange={(e) => setFormData({ ...formData, entryFee: parseFloat(e.target.value) || 0 })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                  />
                </div>
              )}

              {/* Prize Pool */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Premiação Total (R$)
                </label>
                <input
                  type="number"
                  value={formData.prizePool}
                  onChange={(e) => setFormData({ ...formData, prizePool: parseFloat(e.target.value) || 0 })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium"
                />
              </div>

              {/* Prize Distribution */}
              <div>
                <label className="block text-sm font-bold text-slate-900 mb-2">
                  Distribuição de Prêmios
                </label>
                <textarea
                  value={formData.prizeDistribution}
                  onChange={(e) => setFormData({ ...formData, prizeDistribution: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 font-medium resize-none"
                  placeholder="Ex: 1º lugar: 50%, 2º lugar: 30%, 3º lugar: 20%"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate(`/championship/${id}`)}
              className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
