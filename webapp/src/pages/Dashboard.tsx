import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Home, Package, Users } from 'lucide-react';

interface DashboardProps {
  role: 'admin' | 'client' | 'delivery';
}

const Dashboard: React.FC<DashboardProps> = ({ role }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-gradient-start)' }}>
      {/* Sidebar */}
      <div className="glass" style={{ width: '250px', padding: '24px', display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--surface-border)', borderRadius: 0, height: '100vh', position: 'fixed' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: '40px' }}>Despacha App</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', cursor: 'pointer' }}>
            <Home size={20} /> Início
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <Package size={20} /> Entregas
          </div>
          {role === 'admin' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <Users size={20} /> Usuários
            </div>
          )}
        </div>

        <button onClick={handleLogout} className="btn" style={{ background: 'transparent', color: 'var(--danger)', display: 'flex', justifyContent: 'flex-start', padding: '12px' }}>
          <LogOut size={20} /> Sair
        </button>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: '250px', padding: '40px', width: '100%' }} className="animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1>Dashboard <span style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>{role}</span></h1>
          <div style={{ background: 'var(--surface)', padding: '8px 16px', borderRadius: '20px', border: '1px solid var(--surface-border)' }}>
            Status: Online
          </div>
        </div>

        <div className="grid-cards">
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--text-muted)', margin: '0 0 8px 0' }}>Entregas Ativas</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>12</div>
          </div>
          <div className="glass" style={{ padding: '24px' }}>
            <h3 style={{ color: 'var(--text-muted)', margin: '0 0 8px 0' }}>Faturamento (Hoje)</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>R$ 450,00</div>
          </div>
          {role === 'admin' && (
            <div className="glass" style={{ padding: '24px' }}>
              <h3 style={{ color: 'var(--text-muted)', margin: '0 0 8px 0' }}>Entregadores Disponíveis</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>4</div>
            </div>
          )}
        </div>

        <div className="glass" style={{ marginTop: '40px', padding: '24px' }}>
          <h3>Últimas Atividades</h3>
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma atividade recente.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
