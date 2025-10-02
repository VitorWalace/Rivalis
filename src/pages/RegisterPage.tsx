import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, UserIcon, SparklesIcon, CheckCircleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/authStore';
import { Logo } from '../components/Logo';
import { toast } from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos: 1 letra minúscula, 1 maiúscula e 1 número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const { register: registerUser, isAuthenticated, isLoading, error, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    clearError();
    // resetLoading(); // Temporariamente removido para debug
  }, [clearError]);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      toast.success('Conta criada com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar conta');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-700">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3Ccircle cx='27' cy='7' r='2'/%3E%3Ccircle cx='47' cy='7' r='2'/%3E%3Ccircle cx='7' cy='27' r='2'/%3E%3Ccircle cx='27' cy='27' r='2'/%3E%3Ccircle cx='47' cy='27' r='2'/%3E%3Ccircle cx='7' cy='47' r='2'/%3E%3Ccircle cx='27' cy='47' r='2'/%3E%3Ccircle cx='47' cy='47' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        
        {/* Floating Elements */}
        <div className="absolute top-1/6 left-1/6 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/2 right-1/6 w-36 h-36 bg-emerald-400/20 rounded-full blur-2xl animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/6 left-1/2 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/4 right-1/3 w-28 h-28 bg-purple-400/15 rounded-full blur-lg animate-pulse" style={{ animationDelay: '3s' }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="mb-8">
              <Logo size="xl" variant="light" showText={true} className="justify-center" />
            </div>
            <div className="flex items-center justify-center mt-6 space-x-2">
              <SparklesIcon className="h-5 w-5 text-emerald-300" />
              <span className="text-white/80 text-lg font-medium">Comece sua jornada esportiva agora</span>
              <SparklesIcon className="h-5 w-5 text-emerald-300" />
            </div>
          </div>

          {/* Register Form */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-10 space-y-8 relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-teal-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-purple-500/20 rounded-full blur-2xl"></div>
            
            <div className="text-center relative z-10">
              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Crie sua conta</h2>
              <p className="text-white/70 text-lg">Junte-se à comunidade Rivalis hoje mesmo</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-red-100 px-5 py-4 rounded-2xl relative z-10">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-3 animate-pulse"></div>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-7 relative z-10">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-white/90">
                  Nome completo
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                    placeholder="Seu nome completo"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-300 text-sm flex items-center">
                    <div className="w-1 h-1 bg-red-300 rounded-full mr-2"></div>
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-white/90">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                    placeholder="seu@email.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-300 text-sm flex items-center">
                    <div className="w-1 h-1 bg-red-300 rounded-full mr-2"></div>
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-white/90">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-white/10 rounded-r-xl transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-white/70 hover:text-white" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-white/70 hover:text-white" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-300 text-sm flex items-center">
                    <div className="w-1 h-1 bg-red-300 rounded-full mr-2"></div>
                    {errors.password.message}
                  </p>
                )}
                <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 mt-2">
                  <p className="text-white/60 text-xs">
                    <CheckCircleIcon className="inline h-3 w-3 mr-1" />
                    A senha deve conter pelo menos 6 caracteres, incluindo maiúscula, minúscula e número.
                  </p>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90">
                  Confirmar senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-white/50" />
                  </div>
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-white/10 rounded-r-xl transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-white/70 hover:text-white" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-white/70 hover:text-white" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-300 text-sm flex items-center">
                    <div className="w-1 h-1 bg-red-300 rounded-full mr-2"></div>
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-3 relative z-10">
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="text-lg">Criando conta...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center space-x-3 text-lg relative z-10">
                    <span>Criar conta gratuita</span>
                    <CheckCircleIcon className="w-6 h-6" />
                  </span>
                )}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="text-center relative z-10">
              <p className="text-white/70 text-lg">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-white font-bold hover:text-emerald-300 transition-colors underline underline-offset-4">
                  Faça login aqui
                </Link>
              </p>
            </div>

            {/* Terms and Privacy */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-5 mt-8 relative z-10">
              <p className="text-sm text-white/70 text-center leading-relaxed">
                <ShieldCheckIcon className="w-4 h-4 inline mr-2" />
                Ao criar uma conta, você concorda com nossos{' '}
                <a href="/terms" className="text-white/90 hover:text-white underline underline-offset-2 font-medium">
                  Termos de Uso
                </a>{' '}
                e{' '}
                <a href="/privacy" className="text-white/90 hover:text-white underline underline-offset-2 font-medium">
                  Política de Privacidade
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}