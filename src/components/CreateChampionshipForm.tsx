import React, { useState } from 'react';
import { Trophy, Upload, Calendar, Users, Settings, ChevronRight, ChevronLeft, Save } from 'lucide-react';

interface ChampionshipFormData {
  name: string;
  modality: string;
  description: string;
  banner: File | null;
  bannerPreview: string;
  format: string;
  startDate: string;
  endDate: string;
  registrationStart: string;
  registrationEnd: string;
  maxTeams: number;
  minPlayersPerTeam: number;
  maxPlayersPerTeam: number;
  rules: string;
}

const MODALITIES = [
  'Futebol',
  'Futsal',
  'Vôlei',
  'Basquete',
  'Tênis',
  'Tênis de Mesa',
  'Handebol',
  'E-Sports',
  'Outro'
];

const FORMATS = [
  { value: 'round-robin', label: 'Todos contra Todos' },
  { value: 'knockout', label: 'Eliminatória Simples' },
  { value: 'groups', label: 'Fase de Grupos + Mata-mata' },
  { value: 'league', label: 'Pontos Corridos' }
];

export default function CreateChampionshipForm({ onSubmit, onCancel }: {
  onSubmit: (data: ChampionshipFormData) => void;
  onCancel: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ChampionshipFormData>({
    name: '',
    modality: '',
    description: '',
    banner: null,
    bannerPreview: '',
    format: '',
    startDate: '',
    endDate: '',
    registrationStart: '',
    registrationEnd: '',
    maxTeams: 16,
    minPlayersPerTeam: 5,
    maxPlayersPerTeam: 11,
    rules: ''
  });

  const steps = [
    { id: 1, title: 'Informações Básicas', icon: Trophy },
    { id: 2, title: 'Banner e Visual', icon: Upload },
    { id: 3, title: 'Formato e Regras', icon: Settings },
    { id: 4, title: 'Cronograma', icon: Calendar },
    { id: 5, title: 'Inscrições', icon: Users }
  ];

  const handleInputChange = (field: keyof ChampionshipFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleInputChange('bannerPreview', e.target?.result as string);
      };
      reader.readAsDataURL(file);
      handleInputChange('banner', file);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nome do Campeonato *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: Copa Rivalis 2025"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Modalidade *
        </label>
        <select
          value={formData.modality}
          onChange={(e) => handleInputChange('modality', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Selecione uma modalidade</option>
          {MODALITIES.map(modality => (
            <option key={modality} value={modality}>{modality}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Descreva seu campeonato, premiação, objetivos..."
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Banner do Campeonato
        </label>
        <div className="mt-2">
          {formData.bannerPreview ? (
            <div className="relative">
              <img
                src={formData.bannerPreview}
                alt="Preview do banner"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={() => {
                  handleInputChange('banner', null);
                  handleInputChange('bannerPreview', '');
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Clique para fazer upload do banner
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleBannerUpload}
                  />
                </label>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                PNG, JPG até 5MB (Recomendado: 1200x400px)
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Formato do Campeonato *
        </label>
        <div className="grid grid-cols-1 gap-3">
          {FORMATS.map(format => (
            <label key={format.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="format"
                value={format.value}
                checked={formData.format === format.value}
                onChange={(e) => handleInputChange('format', e.target.value)}
                className="text-blue-600"
              />
              <span className="font-medium">{format.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min. Jogadores/Time
          </label>
          <input
            type="number"
            value={formData.minPlayersPerTeam}
            onChange={(e) => handleInputChange('minPlayersPerTeam', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max. Jogadores/Time
          </label>
          <input
            type="number"
            value={formData.maxPlayersPerTeam}
            onChange={(e) => handleInputChange('maxPlayersPerTeam', parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Regras Específicas
        </label>
        <textarea
          value={formData.rules}
          onChange={(e) => handleInputChange('rules', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Regras específicas do campeonato, tempo de jogo, etc..."
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Início *
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Término
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={formData.startDate}
          />
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Início das Inscrições *
          </label>
          <input
            type="date"
            value={formData.registrationStart}
            onChange={(e) => handleInputChange('registrationStart', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fim das Inscrições *
          </label>
          <input
            type="date"
            value={formData.registrationEnd}
            onChange={(e) => handleInputChange('registrationEnd', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min={formData.registrationStart}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número Máximo de Times
        </label>
        <input
          type="number"
          value={formData.maxTeams}
          onChange={(e) => handleInputChange('maxTeams', parseInt(e.target.value))}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="2"
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Resumo do Campeonato</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Nome:</strong> {formData.name || 'Não informado'}</li>
          <li><strong>Modalidade:</strong> {formData.modality || 'Não informado'}</li>
          <li><strong>Formato:</strong> {FORMATS.find(f => f.value === formData.format)?.label || 'Não informado'}</li>
          <li><strong>Max. Times:</strong> {formData.maxTeams}</li>
          <li><strong>Inscrições:</strong> {formData.registrationStart} até {formData.registrationEnd}</li>
        </ul>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() && formData.modality;
      case 2:
        return true; // Banner is optional
      case 3:
        return formData.format;
      case 4:
        return formData.startDate;
      case 5:
        return formData.registrationStart && formData.registrationEnd;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-xl">
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isActive ? 'border-blue-500 bg-blue-500 text-white' :
                  isCompleted ? 'border-green-500 bg-green-500 text-white' :
                  'border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <div className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' :
                    isCompleted ? 'text-green-600' :
                    'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-gray-600">
            Passo {currentStep} de {steps.length}
          </p>
        </div>

        {renderCurrentStep()}
      </div>

      {/* Action Buttons */}
      <div className="px-6 py-4 border-t bg-gray-50 flex justify-between">
        <div>
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Anterior
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          
          {currentStep < steps.length ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isStepValid()}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Criar Campeonato
            </button>
          )}
        </div>
      </div>
    </div>
  );
}