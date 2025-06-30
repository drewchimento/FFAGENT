import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth.jsx'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Preferences from './components/Preferences'
import DraftRoom from './components/DraftRoom'
import './App.css'

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewParams, setViewParams] = useState(null);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'

  const handleNavigate = (view, params = null) => {
    setCurrentView(view);
    setViewParams(params);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FFAgent...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <Register onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  // Render authenticated views
  switch (currentView) {
    case 'preferences':
      return <Preferences onNavigate={handleNavigate} />;
    case 'draft':
      return (
        <DraftRoom 
          draftId={viewParams} 
          onExit={() => handleNavigate('dashboard')} 
        />
      );
    case 'add-league':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add League</h2>
            <p className="text-gray-600">League management interface coming soon!</p>
          </div>
        </div>
      );
    case 'players':
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Player Research</h2>
            <p className="text-gray-600">Player analysis interface coming soon!</p>
          </div>
        </div>
      );
    default:
      return <Dashboard onNavigate={handleNavigate} />;
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
