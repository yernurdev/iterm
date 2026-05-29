import { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Admin from './pages/Admin';
import Checker from './pages/Checker';
import Dictionary from './pages/Dictionary';
import Home from './pages/Home';
import AuthModal from './components/AuthModal';
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="page-shell py-10">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" />;

  return children;
};

function AppContent() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [lang, setLang] = useState(localStorage.getItem('iterm_lang') || 'kz');

  const changeLang = (nextLang) => {
    localStorage.setItem('iterm_lang', nextLang);
    setLang(nextLang);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar lang={lang} onLangChange={changeLang} onLoginClick={() => setAuthModalOpen(true)} />
      <main>
        <Routes>
          <Route path="/" element={<Home lang={lang} />} />
          <Route path="/checker" element={<Checker lang={lang} />} />
          <Route path="/dictionary" element={<Dictionary lang={lang} />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <Admin lang={lang} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {authModalOpen && <AuthModal lang={lang} onClose={() => setAuthModalOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
