import { Link } from 'react-router-dom';
import { Lock, Store, UserRound } from 'lucide-react';
import DespachaLogo from '../components/DespachaLogo';

const Portal = () => (
  <main className="screen center-screen portal-screen">
    <section className="stack narrow">
      <div className="brand-lockup">
        <DespachaLogo />
        <span>Pedidos para gás e água</span>
      </div>

      <div className="surface stack portal-card">
        <div>
          <h1>Bem-vindo ao Despacha</h1>
          <p className="muted">Selecione como deseja acessar.</p>
        </div>

        <Link to="/client" className="choice-button primary">
          <UserRound />
          <span>Acessar Loja (Visão do Cliente)</span>
        </Link>

        <Link to="/login" className="choice-button">
          <Store />
          <span>Fazer Login (Lojista/Time)</span>
          <Lock className="choice-tail" />
        </Link>
      </div>
    </section>
  </main>
);

export default Portal;
