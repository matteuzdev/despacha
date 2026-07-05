import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, LayoutDashboard, MessageSquareOff, Package, Store, TrendingUp } from 'lucide-react';
import DespachaLogo from '../components/DespachaLogo';

const features = [
  ['Cardápio Digital Integrado', 'Seu depósito tem uma vitrine online para clientes comprarem a qualquer hora.', Store],
  ['Fim dos Erros pelo WhatsApp', 'Seus clientes preenchem os dados deles mesmos, evitando endereços errados.', MessageSquareOff],
  ['Organização Total', 'Painel que mostra novos pedidos e direciona para seus entregadores de forma fácil.', LayoutDashboard],
  ['Order Bump Inteligente', 'Aumente seu ticket médio oferecendo água e acessórios junto com o gás.', TrendingUp],
] as const;

const Landing = () => (
  <main className="screen marketing-screen">
    <header className="landing-nav">
      <Link to="/" className="brand-lockup">
        <DespachaLogo />
        <span>Gás e água no piloto automático</span>
      </Link>
      <Link to="/portal" className="btn btn-secondary">Acessar Plataforma</Link>
    </header>

    <section className="hero-section">
      <div className="round-icon hero-icon"><Package /></div>
      <h1>O Sistema de Pedidos Automático para o seu Depósito</h1>
      <p>
        Venda gás e água no piloto automático. Sem ligações perdidas, sem erros no endereço.
        Um link, múltiplos pedidos.
      </p>
      <Link to="/pricing" className="btn btn-primary hero-cta">
        Começar Agora - Escolha seu Plano <ArrowRight size={20} />
      </Link>
    </section>

    <section className="content stack">
      <h2>Vantagens do Despacha</h2>
      <div className="feature-list">
        {features.map(([title, desc, Icon]) => (
          <article className="surface feature-row" key={title}>
            <Icon size={28} />
            <div>
              <h3><CheckCircle size={18} /> {title}</h3>
              <p className="muted">{desc}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  </main>
);

export default Landing;
