import { Link } from 'react-router-dom';
import { 
  TrophyIcon, 
  StarIcon, 
  UsersIcon, 
  ChartBarIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';
import { Logo } from '../components/Logo';

export function LandingPage() {
  const features = [
    {
      icon: TrophyIcon,
      title: 'Gestão Completa',
      description: 'Organize campeonatos, gerencie times e acompanhe estatísticas em tempo real.'
    },
    {
      icon: UsersIcon,
      title: 'Sistema de Pontos XP',
      description: 'Gamificação que motiva jogadores com conquistas e ranking de desempenho.'
    },
    {
      icon: ChartBarIcon,
      title: 'Análises Avançadas',
      description: 'Relatórios detalhados e insights para melhorar o desempenho dos times.'
    },
    {
      icon: StarIcon,
      title: 'Interface Intuitiva',
      description: 'Design moderno e fácil de usar, otimizado para todos os dispositivos.'
    }
  ];

  const benefits = [
    'Organize torneios profissionalmente',
    'Motive jogadores com gamificação',
    'Acompanhe estatísticas em tempo real',
    'Interface responsiva e moderna',
    'Sistema de conquistas e medalhas',
    'Relatórios e análises detalhadas'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Logo size="md" variant="light" showText={true} />
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-white/80 hover:text-white transition-colors font-medium"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full border border-white/20 transition-all duration-200 font-medium"
              >
                Cadastrar
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          {/* Hero Content */}
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-sm font-medium border border-white/20">
                <SparklesIcon className="h-4 w-4 mr-2" />
                Nova Era dos Torneios Esportivos
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tight">
              Gerencie seus<br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Campeonatos
              </span><br />
              como um jogo
            </h1>
            
            <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              A plataforma mais moderna para organizar torneios esportivos. 
              Gamificação, estatísticas avançadas e gestão profissional em um só lugar.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
              <Link
                to="/register"
                className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                <span className="flex items-center space-x-3">
                  <span className="text-lg">Começar Gratuitamente</span>
                  <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              
              <button className="group flex items-center space-x-3 text-white/90 hover:text-white font-semibold py-4 px-8 rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-200">
                <PlayCircleIcon className="h-6 w-6" />
                <span>Ver Demonstração</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">1000+</div>
                <div className="text-white/60">Campeonatos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">50k+</div>
                <div className="text-white/60">Jogadores</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">99%</div>
                <div className="text-white/60">Satisfação</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
                <div className="text-white/60">Suporte</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="relative z-10 py-24 bg-white/5 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Tudo que você precisa
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Uma plataforma completa para transformar a gestão de torneios esportivos
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-white/40 transition-all duration-300 hover:transform hover:scale-105"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative z-10 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
                  Por que escolher o Rivalis?
                </h2>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircleIcon className="h-6 w-6 text-green-400 flex-shrink-0" />
                      <span className="text-white/80 text-lg">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-10">
                  <Link
                    to="/register"
                    className="inline-flex items-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-xl"
                  >
                    <span className="mr-3">Começar Agora</span>
                    <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
                  <div className="aspect-video bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center">
                    <div className="text-white/60 text-center">
                      <PlayCircleIcon className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg">Demonstração em Vídeo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 py-24 bg-gradient-to-r from-blue-600 to-purple-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Pronto para começar?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Junte-se a milhares de organizadores que já transformaram seus torneios com o Rivalis
            </p>
            <Link
              to="/register"
              className="inline-flex items-center bg-white hover:bg-gray-100 text-blue-600 font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              <span className="mr-3 text-lg">Criar Conta Gratuita</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900/50 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <Logo size="md" variant="light" showText={true} />
            <div className="mt-4 md:mt-0 text-white/60">
              <p>&copy; 2025 Rivalis. Todos os direitos reservados.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}