import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const plans = [
  {
    code: 'PRO',
    title: 'Plano Mensal (Pro)',
    price: 'R$ 49,90',
    suffix: '/mês',
    description: 'O poder total do sistema para depósitos em crescimento.',
    features: ['Pedidos Ilimitados', 'Personalização Total (Cores e Logo)', 'Gestão Completa de Entregadores', 'Suporte Prioritário'],
    button: 'Assinar Mensal',
    featured: true,
  },
  {
    code: 'TRIANNUAL',
    title: 'Plano Trimestral',
    price: 'R$ 149,90',
    suffix: '/trimestre',
    description: 'Mais vantajoso que o mensal, ideal para lojistas que querem crescer.',
    features: ['Todas as vantagens do Mensal', 'Sai por apenas R$ 49,97/mês', 'Desconto especial'],
    button: 'Assinar Trimestral',
  },
  {
    code: 'ANNUAL',
    title: 'Plano Anual',
    price: 'R$ 449,90',
    suffix: '/ano',
    description: 'A escolha dos grandes lojistas. Pague 1 vez, venda o ano todo.',
    features: ['Todas as vantagens do Mensal', 'Sai por apenas R$ 37,49/mês', 'Desconto de 25%'],
    button: 'Assinar Anual',
  },
  {
    code: 'FREE',
    title: 'Plano Free (Teste)',
    price: 'R$ 0',
    suffix: ' por 14 dias',
    description: 'Ideal para validar a solução.',
    features: ['Teste a plataforma sem compromisso', 'Limites de funções', 'Exclusão dos dados após o teste'],
    button: 'Começar Grátis',
  },
] as const;

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <main className="screen app-screen">
      <header className="topbar">
        <button className="icon-button" onClick={() => navigate(-1)} aria-label="Voltar">←</button>
        <strong>Escolha seu Plano</strong>
      </header>

      <section className="content stack">
        <div>
          <h1>Pare de perder vendas pelo WhatsApp. Automatize seu depósito.</h1>
          <p className="muted">Selecione um plano abaixo e veja como o Despacha facilita sua rotina e aumenta seus lucros.</p>
        </div>

        <div className="pricing-grid">
          {plans.map((plan) => (
            <article className={`surface pricing-card ${'featured' in plan && plan.featured ? 'featured' : ''}`} key={plan.code}>
              {'featured' in plan && plan.featured && <span className="recommended">Recomendado</span>}
              <h2>{plan.title}</h2>
              <strong className="plan-price">{plan.price}<span>{plan.suffix}</span></strong>
              <p className="muted">{plan.description}</p>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}><CheckCircle size={18} /> {feature}</li>
                ))}
              </ul>
              <button className={'featured' in plan && plan.featured ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => navigate(`/checkout/${plan.code}`)}>
                {plan.button}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Pricing;
