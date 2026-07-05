import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Auth from './pages/Auth';
import Admin from './pages/Admin';
import Client from './pages/Client';
import Delivery from './pages/Delivery';
import Portal from './pages/Portal';
import Checkout from './pages/Checkout';
import SuperAdmin from './pages/SuperAdmin';
import { useAppStore } from './store/db';

function App() {
  const { isBackendReady, backendError, hydrateFromBackend } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrateFromBackend()
      .catch(() => { /* erro definido na store */ })
      .finally(() => setLoading(false));
  }, [hydrateFromBackend]);

  if (loading) {
    return (
      <main className="screen center-screen">
        <div className="surface stack narrow center-text" style={{ padding: 32 }}>
          <div className="spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
          <p className="muted">Conectando ao servidor...</p>
        </div>
      </main>
    );
  }

  if (!isBackendReady) {
    return (
      <main className="screen center-screen">
        <div className="surface stack narrow center-text">
          <h2>Servidor indisponível</h2>
          <p className="muted">{backendError || 'Não foi possível conectar ao backend.'}</p>
          <p className="muted" style={{ fontSize: '0.84rem' }}>Certifique-se de que o servidor está rodando (npm run api) e tente novamente.</p>
          <button className="btn btn-primary" onClick={() => {
            setLoading(true);
            hydrateFromBackend().catch(() => {}).finally(() => setLoading(false));
          }}>
            <RefreshCw size={18} /> Tentar novamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/portal" element={<Portal />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/checkout/:plan" element={<Checkout />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/superadmin" element={<SuperAdmin />} />
          <Route path="/client" element={<Client />} />
          <Route path="/:slug/client" element={<Client />} />
          <Route path="/:slug" element={<Client />} />
          <Route path="/delivery" element={<Delivery />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
