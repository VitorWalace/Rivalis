import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  console.log('ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('ProtectedRoute - user:', user);

  if (!isAuthenticated) {
    console.log('ProtectedRoute - Redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  console.log('ProtectedRoute - Renderizando children');
  return <>{children}</>;
}