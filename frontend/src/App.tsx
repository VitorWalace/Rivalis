import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import CreateChampionshipPage from './pages/CreateChampionshipPage';
import BrowseChampionshipsPage from './pages/BrowseChampionshipsPage';
import ChampionshipDetailPage from './pages/ChampionshipDetailPage';
import EditChampionshipPage from './pages/EditChampionshipPage';
import { PlayerProfilePage } from './pages/PlayerProfilePage';
import { MatchEditorPage } from './pages/MatchEditorPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ExtensionWarning } from './components/ExtensionWarning';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Inicializar autenticação ao carregar a aplicação
    const initialize = async () => {
      await initializeAuth();
      setIsInitialized(true);
    };
    initialize();
  }, [initializeAuth]);

  // Aguardar inicialização antes de renderizar rotas
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-secondary-600 to-purple-700">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/landing" element={<LandingPage />} />
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/landing" replace />
            } 
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/championships"
            element={
              <ProtectedRoute>
                <BrowseChampionshipsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/championships/explore" element={<Navigate to="/championships" replace />} />
          <Route
            path="/championship/create"
            element={
              <ProtectedRoute>
                <CreateChampionshipPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/championship/:id"
            element={
              <ProtectedRoute>
                <ChampionshipDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/championship/:id/edit"
            element={
              <ProtectedRoute>
                <EditChampionshipPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/championship/:championshipId/player/:playerId"
            element={
              <ProtectedRoute>
                <PlayerProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/match/editor"
            element={
              <ProtectedRoute>
                <MatchEditorPage />
              </ProtectedRoute>
            }
          />
        </Routes>
        
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10B981',
              },
            },
            error: {
              style: {
                background: '#EF4444',
              },
            },
          }}
        />
        <ExtensionWarning />
      </div>
    </Router>
  );
}

export default App;
