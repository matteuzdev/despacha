import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, LayoutGrid, List, Plus, Settings, Trash2, Users, X } from 'lucide-react';
import { formatCurrency, useAppStore } from '../store/db';

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { currentUser, tenants, addTenant, deleteTenant } = useAppStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [plan, setPlan] = useState<'FREE' | 'PRO' | 'TRIANNUAL' | 'ANNUAL' | 'VITALICIA'>('PRO');
  const [isMrr, setIsMrr] = useState(true);
  const [deletingTenant, setDeletingTenant] = useState<{ id: number; name: string } | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [navCollapsed, setNavCollapsed] = useState(false);

  if (!currentUser || currentUser.role !== 'superAdmin') {
    return (
      <main className="screen center-screen">
        <div className="surface stack narrow center-text">
          <h1>Acesso negado</h1>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Fazer login</button>
        </div>
      </main>
    );
  }

  const PLAN_VALUES: Record<string, number> = {
    FREE: 0,
    PRO: 49.9,
    TRIANNUAL: 149.9 / 3,
    ANNUAL: 449.9 / 12,
    VITALICIA: 999 / 12,
  };
  const mrr = tenants.reduce((sum, tenant) => sum + (PLAN_VALUES[tenant.plan] ?? 0), 0);

  return (
    <main className="screen app-screen">
      <header className="topbar">
        <button className="icon-button" onClick={() => navigate('/portal')} aria-label="Voltar">←</button>
        <strong>Dashboard Super Admin</strong>
        <button className="icon-button" onClick={() => setNavCollapsed(!navCollapsed)} aria-label={navCollapsed ? 'Expandir menu' : 'Recolher menu'}>
          {navCollapsed ? <LayoutGrid size={18} /> : <List size={18} />}
        </button>
      </header>

      <section className="content stack">
        <div>
          <h1>Visão Geral do SaaS</h1>
          <p className="muted">Controle tenants, planos e receita estimada do Despacha.</p>
        </div>

        <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="surface metric-card">
            <span>Tenants Ativos</span>
            <strong>{tenants.length}</strong>
          </div>
          <div className="surface metric-card">
            <span>MRR Estimado</span>
            <strong>{formatCurrency(mrr)}</strong>
          </div>
          <div className="surface metric-card">
            <span>Não-MRR (Grátis)</span>
            <strong style={{ color: 'var(--text-muted)' }}>{tenants.filter((t) => !t.isMrr).length}</strong>
          </div>
        </div>          <form
          className="surface form-grid"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim() || !email.trim() || !password.trim()) return;
            try {
              await addTenant({ name, email, password, plan, isMrr });
              setName('');
              setEmail('');
              setPassword('');
              setPlan('PRO');
              setIsMrr(true);
            } catch (error) {
              alert(error instanceof Error ? error.message : 'Erro ao criar tenant');
            }
          }}
        >
          <input className="input-field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome do Negócio" />
          <input className="input-field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email do Proprietário" type="email" />
          <input className="input-field" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha de acesso" type="password" />
          <select className="input-field" value={plan} onChange={(event) => setPlan(event.target.value as 'FREE' | 'PRO' | 'TRIANNUAL' | 'ANNUAL' | 'VITALICIA')}>
            <option value="PRO">PRO (R$ 49,90/mês)</option>
            <option value="TRIANNUAL">Trimestral (R$ 149,90)</option>
            <option value="ANNUAL">Anual (R$ 449,90)</option>
            <option value="VITALICIA">🔥 VITALÍCIA (R$ 999,00) · Sob consulta</option>
            <option value="FREE">FREE (Teste)</option>
          </select>
          <label className="check-line">
            <input type="checkbox" checked={isMrr} onChange={(event) => setIsMrr(event.target.checked)} />
            Incluir no MRR (receita mensal recorrente)
          </label>
          <button className="btn btn-primary" type="submit"><Plus size={18} /> Adicionar</button>
        </form>

        <div className="stack">
          <h2>Lojas e Depósitos Cadastrados</h2>
          {tenants.map((tenant) => (
            <article className="surface list-row" key={tenant.id}>
              <div>
                <strong>{tenant.name}</strong>
                <p className="muted" style={{ fontSize: '0.82rem' }}>
                  <code style={{ background: 'var(--surface-soft)', padding: '2px 6px', borderRadius: 4 }}>{tenant.slug}</code>
                  {' · '}Plano {tenant.plan} · {tenant.ownerEmail}
                  {!tenant.isMrr && <span className="status-chip" style={{ marginLeft: 6, background: '#fef3c7', color: '#92400e' }}>Grátis</span>}
                </p>
              {tenant.plan === 'VITALICIA' && <span className="status-chip" style={{ background: '#fef3c7', color: '#92400e' }}>⭐ Vitalício</span>}
              </div>
              <div className="row-actions">
                <span className="status-chip">{tenant.status}</span>
                <button className="icon-button danger" onClick={() => { setDeletingTenant({ id: tenant.id, name: tenant.name }); setConfirmName(''); }} aria-label="Excluir tenant">
                  <Trash2 size={18} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Bottom Navigation */}
      <nav className={`bottom-nav ${navCollapsed ? 'collapsed' : ''}`}>
        <button className="active"><LayoutGrid size={20} />{!navCollapsed && <span>Dashboard</span>}</button>
        <button onClick={() => navigate('/portal')}><Users size={20} />{!navCollapsed && <span>Portal</span>}</button>
        <button onClick={() => { /* futuro */ }}><Settings size={20} />{!navCollapsed && <span>Config</span>}</button>
      </nav>

      {deletingTenant && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'grid', placeItems: 'center',
          background: 'rgba(0,0,0,0.5)',
          padding: 20,
        }} onClick={() => setDeletingTenant(null)}
        onKeyDown={(e) => { if (e.key === 'Escape') setDeletingTenant(null); }}>
          <div className="surface stack" style={{ maxWidth: 420, width: '100%', padding: 24 }}
            onClick={(e) => e.stopPropagation()}>
            <div className="row-between">
              <div className="subheader">
                <AlertTriangle size={22} className="danger" />
                <strong>Excluir Instância</strong>
              </div>
              <button className="icon-button" onClick={() => setDeletingTenant(null)}>
                <X size={18} />
              </button>
            </div>
            <p>
              Esta ação é <strong className="danger">irreversível</strong>. Todos os dados
              da instância <strong>"{deletingTenant.name}"</strong> serão removidos permanentemente.
            </p>
            <div className="form-grid">
              <label>
                Digite <strong>{deletingTenant.name}</strong> abaixo para confirmar:
                <input
                  className="input-field"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Digite o nome da instância"
                  autoFocus
                />
              </label>
              <div className="button-row">
                <button className="btn btn-secondary" onClick={() => setDeletingTenant(null)}>
                  Cancelar
                </button>
                <button
                  className="btn danger-btn"
                  disabled={confirmName !== deletingTenant.name}
                  onClick={() => {
                    deleteTenant(deletingTenant.id);
                    setDeletingTenant(null);
                    setConfirmName('');
                  }}
                >
                  <Trash2 size={18} /> Excluir Permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default SuperAdmin;
