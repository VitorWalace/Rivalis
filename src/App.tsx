import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateChampionshipPage } from './pages/CreateChampionshipPage';
import { ChampionshipPage } from './pages/ChampionshipPage';
import { PlayerProfilePage } from './pages/PlayerProfilePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

function App() {
  const { isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Inicializar autenticação ao carregar a aplicação
    initializeAuth();
  }, [initializeAuth]);

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
                <ChampionshipPage />
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
      </div>
    </Router>
  );
}

export default App;
