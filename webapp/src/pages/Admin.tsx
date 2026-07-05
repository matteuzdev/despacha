import type { CSSProperties, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fragment, useState } from 'react';
import { BookOpen, Check, ClipboardList, CreditCard, Crown, HelpCircle, Info, Lightbulb, MapPin, Package, Palette, Plus, Send, Store, Trash2, Users, X, Smartphone, ExternalLink, Sparkles, TrendingUp, Clock, LayoutGrid, List } from 'lucide-react';
import type { Customer, Neighborhood, NeighborhoodStatus, Product } from '../store/db';
import { campaignTexts, extractCustomers, formatCurrency, useAppStore, whatsAppUrl } from '../store/db';
import DespachaLogo from '../components/DespachaLogo';

type AdminTab = 'dashboard' | 'products' | 'neighborhoods' | 'customers' | 'settings' | 'help' | 'plans';

const emptyProduct = (tenantId: number): Omit<Product, 'id'> => ({
  name: '',
  description: '',
  price: 0,
  category: 'Gás',
  imageUrl: '',
  isAvailable: true,
  isFavorite: false,
  isOrderBump: false,
  tenantId,
});

const Admin = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    orders,
    products,
    neighborhoods,
    tenants,
    insertProduct,
    updateProduct,
    deleteProduct,
    insertNeighborhood,
    updateNeighborhood,
    deleteNeighborhood,
    updateTenant,
    updateOrderStatus,
  } = useAppStore();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(currentUser?.isFirstLogin ?? false);
  const tenantId = currentUser?.tenantId;
  const tenant = tenantId ? tenants.find((item) => item.id === tenantId) : undefined;

  const storeSlug = tenant?.slug || 'loja';

  const closeOnboarding = () => {
    setShowOnboarding(false);
    if (currentUser) {
      useAppStore.setState((state) => ({
        currentUser: state.currentUser ? { ...state.currentUser, isFirstLogin: false } : null,
        users: state.users.map((u) =>
          u.id === currentUser.id ? { ...u, isFirstLogin: false } : u
        ),
      }));
    }
  };
  const tenantOrders = orders.filter((order) => order.tenantId === tenantId);
  const tenantProducts = products.filter((product) => product.tenantId === tenantId);
  const tenantNeighborhoods = neighborhoods.filter((item) => item.tenantId === tenantId);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <main className="screen center-screen">
        <div className="surface stack narrow center-text">
          <h1>Acesso negado</h1>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Fazer Login</button>
        </div>
      </main>
    );
  }

  return (
    <main className="screen app-screen">
      <header className="topbar admin-topbar">
        <button className="icon-button" onClick={() => { logout(); navigate('/portal'); }} aria-label="Sair">←</button>
        <strong>Área de Gestão</strong>
        <button className="icon-button" onClick={() => setNavCollapsed(!navCollapsed)} aria-label={navCollapsed ? 'Expandir menu' : 'Recolher menu'}>
          {navCollapsed ? <LayoutGrid size={18} /> : <List size={18} />}
        </button>
      </header>

      <nav className={`mobile-tabs ${navCollapsed ? 'collapsed' : ''}`}>
        <button className={tab === 'dashboard' ? 'active' : ''} onClick={() => setTab('dashboard')}><ClipboardList /> {!navCollapsed && <span>Pedidos</span>}</button>
        <button className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}><Users /> {!navCollapsed && <span>Clientes</span>}</button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}><Package /> {!navCollapsed && <span>Catálogo</span>}</button>
        <button className={tab === 'neighborhoods' ? 'active' : ''} onClick={() => setTab('neighborhoods')}><MapPin /> {!navCollapsed && <span>Bairros</span>}</button>
        <button className={tab === 'plans' ? 'active' : ''} onClick={() => setTab('plans')}><Crown /> {!navCollapsed && <span>Plano</span>}</button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}><Palette /> {!navCollapsed && <span>Loja</span>}</button>
        <button className={tab === 'help' ? 'active' : ''} onClick={() => setTab('help')}><HelpCircle /> {!navCollapsed && <span>Ajuda</span>}</button>
      </nav>

      <section className="content stack">
        {tab === 'dashboard' && (
          <>
            <div
              className="hero-panel"
              style={{
                '--tenant-color': tenant?.colorHex ?? '#ff5722',
                '--tenant-secondary': tenant?.secondaryColorHex ?? '#00b4ff',
              } as CSSProperties}
            >
              <div className="row-between">
                <div>
                  <h1>Olá, Administrador!</h1>
                  <p>Acompanhe o desempenho da sua loja pelo Despacha.</p>
                </div>
                {tenant && (
                  <span className="status-chip" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                    {tenant.plan}
                  </span>
                )}
              </div>
            </div>

            <div className="metric-grid">
              <div className="surface metric-card"><span>Pedidos Recentes</span><strong>{tenantOrders.length}</strong></div>
              <div className="surface metric-card"><span>Em entrega</span><strong>{tenantOrders.filter((order) => order.status === 'Saiu').length}</strong></div>
              <div className="surface metric-card"><span>Faturado</span><strong>{formatCurrency(tenantOrders.filter((order) => order.status === 'Entregue').reduce((sum, order) => sum + order.total, 0))}</strong></div>
            </div>

            <div className="stack">
              <h2>Pedidos Recentes ({tenantOrders.length})</h2>
              {tenantOrders.map((order) => (
                <article className="surface order-card" key={order.id}>
                  <div className="row-between">
                    <strong>{order.orderNumber}</strong>
                    <span className="status-chip">{order.status}</span>
                  </div>
                  <p>Cliente: {order.customerName}</p>
                  <p className="muted">Endereço: {order.addressStreet}, {order.addressNumber} - {order.addressNeighborhood}</p>
                  <strong>{formatCurrency(order.total)}</strong>
                  <div className="button-row">
                    <button className="btn btn-secondary" disabled={!['Novo', 'Aguardando análise'].includes(order.status)} onClick={() => updateOrderStatus(order.id, 'Confirmado')}><Check size={16} /> Confirmar</button>
                    <button className="btn btn-primary" disabled={order.status !== 'Confirmado'} onClick={() => updateOrderStatus(order.id, 'Saiu')}><Send size={16} /> Enviar</button>
                    <button className="btn danger-btn" disabled={['Entregue', 'Cancelado'].includes(order.status)} onClick={() => updateOrderStatus(order.id, 'Cancelado')}><X size={16} /> Cancelar</button>
                  </div>
                </article>
              ))}
              {!tenantOrders.length && <p className="muted">Nenhum pedido encontrado.</p>}
            </div>
          </>
        )}

        {tab === 'products' && tenantId && (
          <ProductManager
            tenantId={tenantId}
            products={tenantProducts}
            onCreate={insertProduct}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
          />
        )}

        {tab === 'customers' && tenantId && (
          <CustomerManager
            orders={tenantOrders}
          />
        )}

        {tab === 'neighborhoods' && tenantId && (
          <NeighborhoodManager
            tenantId={tenantId}
            neighborhoods={tenantNeighborhoods}
            onCreate={insertNeighborhood}
            onUpdate={updateNeighborhood}
            onDelete={deleteNeighborhood}
          />
        )}

        {tab === 'plans' && tenant && (
          <PlansManager tenant={tenant} />
        )}

        {tab === 'help' && (
          <HelpCenter />
        )}

        {tab === 'settings' && tenant && (
          <TenantSettings
            tenant={tenant}
            onSave={(businessName, address, colorHex, secondaryColorHex, logoUrl, coverUrl) => {
              updateTenant({ ...tenant, businessName, name: businessName, address, colorHex, secondaryColorHex, logoUrl, coverUrl });
              setTab('dashboard');
            }}
          />
        )}
      </section>

      {showOnboarding && (
        <OnboardingWizard onDone={closeOnboarding} onGoToTab={(t) => { closeOnboarding(); setTab(t); }} storeSlug={storeSlug} />
      )}
    </main>
  );
};

// ── Onboarding ───────────────────────────────────────────

const ONBOARDING_STEPS = [
  {
    icon: <Palette size={24} />,
    title: 'Personalize sua Loja',
    desc: 'Coloque o nome, logo e cores do seu negócio. Seus clientes vão te reconhecer de cara!',
    action: 'Ir para Configurações',
    tab: 'settings' as AdminTab,
  },
  {
    icon: <MapPin size={24} />,
    title: 'Adicione os Bairros de Entrega',
    desc: 'Cadastre os bairros que você atende e defina a taxa de entrega para cada um.',
    action: 'Ir para Bairros',
    tab: 'neighborhoods' as AdminTab,
  },
  {
    icon: <Package size={24} />,
    title: 'Crie seu Catálogo',
    desc: 'Adicione os produtos que você vende: botijão de gás, água, acessórios. Com fotos fica ainda melhor!',
    action: 'Ir para Catálogo',
    tab: 'products' as AdminTab,
  },
  {
    icon: <Smartphone size={24} />,
    title: 'Compartilhe o Link!',
    desc: 'Pronto! Agora é só enviar o link da sua loja para os clientes no WhatsApp. Eles fazem o pedido sozinhos! 🎉',
    action: 'Copiar Link da Loja',
    copyLink: true,
    tab: 'dashboard' as AdminTab,
  },
];

const OnboardingWizard = ({ onDone, onGoToTab, storeSlug }: { onDone: () => void; onGoToTab: (tab: AdminTab) => void; storeSlug: string }) => {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const current = ONBOARDING_STEPS[step];

  const handleAction = () => {
    if ('copyLink' in current && current.copyLink) {
      navigator.clipboard.writeText(`${window.location.origin}/${storeSlug}`).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }
    onGoToTab(current.tab);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'grid', placeItems: 'center',
      background: 'rgba(0,0,0,0.6)',
      padding: 20,
    }}>
      <div className="surface stack" style={{ maxWidth: 460, width: '100%', padding: 28, textAlign: 'center' }}>
        <div className="round-icon" style={{ margin: '0 auto' }}>{current.icon}</div>
        <h2>{current.title}</h2>
        <p className="muted">{current.desc}</p>

        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step ? 'var(--primary)' : 'var(--border)',
            }} />
          ))}
        </div>

        <div className="button-row" style={{ justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={onDone}>Pular tutorial</button>
          <button className="btn btn-primary" onClick={handleAction}>
            {copied ? '✅ Link copiado!' : current.action}
          </button>
          {step < ONBOARDING_STEPS.length - 1 && (
            <button className="btn btn-secondary" onClick={() => { setStep(step + 1); setCopied(false); }}>Próximo →</button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Help Center / Tutoriais ──────────────────────────────

interface TutorialCard {
  icon: React.ReactNode;
  title: string;
  summary: string;
  steps: string[];
  tip?: string;
}

const TUTORIALS: TutorialCard[] = [
  {
    icon: <Store size={24} />,
    title: 'Configurar Minha Loja',
    summary: 'Deixe sua loja com a sua cara: nome, cores, logo e endereço.',
    steps: [
      'Vá na aba "Loja" (ícone de paleta)',
      'Escolha um nome bonito pro seu negócio',
      'Selecione as cores da sua loja (combina com sua marca)',
      'Adicione sua logo se tiver (foto quadrada fica melhor)',
      'Clique em "Salvar Preferências"',
    ],
    tip: 'Depois de salvar, olhe a prévia da loja ali em cima — é exatamente assim que seus clientes vão ver!',
  },
  {
    icon: <MapPin size={24} />,
    title: 'Cadastrar Bairros de Entrega',
    summary: 'Defina para quais bairros você entrega e quanto cobra de frete.',
    steps: [
      'Vá na aba "Bairros" (ícone de mapa)',
      'Clique em "Novo Bairro" e digite o nome',
      'Coloque o valor da taxa de entrega (ex: 5,00)',
      'Escolha o status: "Disponível", "Sob Consulta" ou "Indisponível"',
      'Repita para cada bairro que você atende',
    ],
    tip: 'Use "Sob Consulta" para bairros que você entrega mas precisa confirmar antes. Use "Indisponível" para não aparecer.',
  },
  {
    icon: <Package size={24} />,
    title: 'Gerenciar Produtos',
    summary: 'Adicione os produtos que você vende: gás, água, acessórios.',
    steps: [
      'Vá na aba "Catálogo" (ícone de caixa)',
      'Preencha: nome do produto, descrição e preço',
      'Escolha a categoria (Gás, Água, Acessórios...)',
      'Marque "Disponível" para aparecer na loja',
      'Marque "Order Bump" para sugerir esse produto na finalização',
      'Clique em "Salvar"',
    ],
    tip: 'Produtos marcados como "Favoritos" aparecem primeiro. Use o coração ao lado do produto para favoritar!',
  },
  {
    icon: <Smartphone size={24} />,
    title: 'Campanhas de Clientes',
    summary: 'Envie mensagens no WhatsApp para seus clientes e aumente as vendas.',
    steps: [
      'Vá na aba "Clientes" (ícone de pessoas)',
      'Veja a lista de quem já pediu com você',
      'Clique em "Falar" para mandar uma mensagem rápida',
      'Clique em "Campanha" para escolher um textinho pronto',
      'Escolha entre: lembrança, promoção, ou mensagem personalizada',
      'Edite o texto se quiser e clique em "Abrir no WhatsApp"',
    ],
    tip: 'Clientes que não compram há mais de 25 dias aparecem em destaque — são ótimas oportunidades de venda!',
  },
  {
    icon: <CreditCard size={24} />,
    title: 'Receber Pagamentos Online',
    summary: 'Seus clientes podem pagar por PIX na hora do pedido — tudo automático!',
    steps: [
      'Vá na aba "Loja" (ícone de paleta)',
      'Na seção "Pagamentos", ative a chave "Aceitar pagamento online"',
      'Pronto! Agora seus clientes podem pagar via PIX na finalização',
      'O pagamento vai direto pra sua conta, sem você fazer nada',
      'Você recebe a confirmação automática no painel de pedidos',
    ],
    tip: 'O pagamento online é processado de forma segura. Você não precisa configurar nada, está tudo pronto!',
  },
];

const HelpCenter = () => {
  const [openTutorial, setOpenTutorial] = useState<number | null>(null);

  return (
    <div className="stack">
      <div className="subheader">
        <BookOpen size={24} />
        <div>
          <h1>Tutoriais e Ajuda</h1>
          <p className="muted">Tudo que você precisa saber pra usar o Despacha.</p>
        </div>
      </div>

      {TUTORIALS.map((tutorial, index) => {
        const isOpen = openTutorial === index;
        return (
          <article
            className="surface"
            key={index}
            style={{ cursor: 'pointer' }}
            onClick={() => setOpenTutorial(isOpen ? null : index)}
          >
            <div className="list-row">
              <div className="subheader">
                <div className="round-icon" style={{ width: 44, height: 44 }}>{tutorial.icon}</div>
                <div>
                  <strong>{tutorial.title}</strong>
                  <p className="muted">{tutorial.summary}</p>
                </div>
              </div>
              <span className={isOpen ? 'danger' : 'muted'} style={{ fontSize: '1.4rem' }}>
                {isOpen ? '−' : '+'}
              </span>
            </div>

            {isOpen && (
              <div className="stack" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tutorial.steps.map((step, i) => (
                    <li key={i} style={{ lineHeight: 1.5 }}>{step}</li>
                  ))}
                </ol>
                {tutorial.tip && (
                  <div className="surface" style={{
                    background: 'rgba(255, 87, 34, 0.08)',
                    border: '1px solid rgba(255, 87, 34, 0.2)',
                    padding: '10px 14px',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                  }}>
                    <Lightbulb size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: '0.88rem', margin: 0 }}>{tutorial.tip}</p>
                  </div>
                )}
              </div>
            )}
          </article>
        );
      })}

      <div className="surface" style={{ background: 'var(--surface-soft)', border: '1px dashed var(--border)', padding: 20 }}>
        <div className="subheader">
          <HelpCircle size={20} />
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            Ainda com dúvidas? Fale com o suporte do Despacha pelo WhatsApp e a gente te ajuda!
          </p>
        </div>
      </div>
    </div>
  );
};

// ── Plans Manager ───────────────────────────────────────

const PLAN_LABELS: Record<string, { label: string; price: string; period: string; features: string[] }> = {
  FREE: { label: 'Free (Teste)', price: 'Grátis', period: '', features: ['Catálogo ilimitado', 'Pedidos ilimitados', 'Clientes ilimitados', 'Suporte via WhatsApp'] },
  PRO: { label: 'PRO', price: 'R$ 49,90', period: '/mês', features: ['Tudo do Free', 'Personalização de loja', 'Campanhas WhatsApp', 'Suporte prioritário', 'SEO'] },
  TRIANNUAL: { label: 'Trimestral', price: 'R$ 149,90', period: '/3 meses', features: ['Tudo do PRO', 'Preço reduzido (R$ 49,97/mês)', 'Pagamento único'] },
  ANNUAL: { label: 'Anual', price: 'R$ 449,90', period: '/12 meses', features: ['Tudo do PRO', 'Preço reduzido (R$ 37,49/mês)', 'Pagamento único'] },
  VITALICIA: { label: 'Vitalício', price: 'R$ 999,00', period: '· única vez', features: ['Tudo do PRO', 'Pagamento único vitalício', 'Sem mensalidades', 'Suporte VIP'] },
};

const PlansManager = ({ tenant }: { tenant: ReturnType<typeof useAppStore.getState>['tenants'][number] }) => {
  const navigate = useNavigate();
  const planInfo = PLAN_LABELS[tenant.plan];
  const isFree = tenant.plan === 'FREE';
  const isVitalicio = tenant.plan === 'VITALICIA';

  return (
    <div className="stack">
      <div className="subheader">
        <Crown size={24} />
        <div>
          <h1>Meu Plano</h1>
          <p className="muted">Veja os detalhes do seu plano atual e faça upgrade.</p>
        </div>
      </div>

      {/* Plano Atual */}
      <div className="surface" style={{ border: isFree ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
        <div className="row-between">
          <div>
            <span className="muted" style={{ fontSize: '0.84rem' }}>Plano Atual</span>
            <div className="subheader" style={{ marginTop: 4 }}>
              <h2>{planInfo?.label || tenant.plan}</h2>
              <span className="status-chip">{planInfo?.price}{planInfo?.period}</span>
            </div>
          </div>
          {isVitalicio && <span className="status-chip" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.9rem' }}>⭐ Cliente VIP</span>}
        </div>

        {planInfo?.features && (
          <div className="stack compact" style={{ marginTop: 12 }}>
            {planInfo.features.map((f, i) => (
              <div className="check-line" key={i} style={{ color: 'var(--text-main)' }}>
                <Check size={16} style={{ color: 'var(--success)' }} /> {f}
              </div>
            ))}
          </div>
        )}

        {isFree && (
          <div className="button-row" style={{ marginTop: 16 }}>
            <button className="btn btn-primary" onClick={() => navigate('/pricing')}>
              <Sparkles size={16} /> Fazer Upgrade Agora
            </button>
          </div>
        )}
      </div>

      {/* Comparação */}
      {!isVitalicio && (
        <>
          <h2>Outros Planos</h2>
          <div className="pricing-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {Object.entries(PLAN_LABELS).map(([key, info]) => {
              if (key === tenant.plan) return null;
              const isFeatured = key === 'PRO';
              return (
                <div className={`surface pricing-card ${isFeatured ? 'featured' : ''}`} key={key} style={{ padding: 18 }}>
                  {isFeatured && <span className="recommended" style={{ alignSelf: 'flex-start' }}>Mais popular</span>}
                  <h3>{info.label}</h3>
                  <div className="plan-price">{info.price}<span>{info.period}</span></div>
                  <ul>
                    {info.features.map((f, i) => (
                      <li key={i}><Check size={16} style={{ color: 'var(--success)', flexShrink: 0 }} /> {f}</li>
                    ))}
                  </ul>
                  <button className={`btn ${isFeatured ? 'btn-primary' : 'btn-secondary'}`} onClick={() => navigate('/pricing')}>
                    {key === 'FREE' ? 'Downgrade' : 'Ver Preço'}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

// ── Customer / Campaign Manager ─────────────────────────

const CustomerManager = ({ orders }: { orders: ReturnType<typeof useAppStore.getState>['orders'] }) => {
  const [search, setSearch] = useState('');
  const [campaignClient, setCampaignClient] = useState<Customer | null>(null);
  const [customText, setCustomText] = useState('');
  const [selectedIntent, setSelectedIntent] = useState('');
  const customers = extractCustomers(orders);
  const filtered = search
    ? customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
    : customers;

  const totalRevenue = customers.reduce((sum, c) => sum + c.lastOrder.total, 0);
  const atRisk = customers.filter((c) => c.lastOrderDays > 30).length;
  const warm = customers.filter((c) => c.lastOrderDays > 15 && c.lastOrderDays <= 30).length;

  const selectCampaign = (customer: Customer) => {
    setCampaignClient(customer);
    setCustomText('');
    setSelectedIntent('');
  };

  return (
    <div className="stack">
      {/* Métricas de marketing */}
      <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="surface metric-card" style={{ padding: 14 }}>
          <TrendingUp size={20} />
          <span className="muted" style={{ fontSize: '0.78rem' }}>Receita Total</span>
          <strong>{formatCurrency(totalRevenue)}</strong>
        </div>
        <div className="surface metric-card" style={{ padding: 14 }}>
          <Clock size={20} className={atRisk > 0 ? 'danger' : ''} />
          <span className="muted" style={{ fontSize: '0.78rem' }}>Em Risco (+30d)</span>
          <strong className={atRisk > 0 ? 'danger' : ''}>{atRisk}</strong>
        </div>
        <div className="surface metric-card" style={{ padding: 14 }}>
          <Users size={20} />
          <span className="muted" style={{ fontSize: '0.78rem' }}>Aquecer (+15d)</span>
          <strong>{warm}</strong>
        </div>
      </div>

      {/* Busca */}
      <div className="subheader">
        <h2>Clientes ({customers.length})</h2>
        <input
          className="input-field"
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />
      </div>

      {!customers.length && (
        <div className="surface stack center-text empty-state">
          <Users size={40} className="muted" />
          <p className="muted">Nenhum pedido realizado ainda. Os clientes aparecerão aqui após o primeiro pedido.</p>
        </div>
      )}

      {/* Tabela */}
      <div className="surface" style={{ overflow: 'auto', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Cliente</th>
              <th style={{ textAlign: 'left', padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Contato</th>
              <th style={{ textAlign: 'center', padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Pedidos</th>
              <th style={{ textAlign: 'center', padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Última Compra</th>
              <th style={{ textAlign: 'center', padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Status</th>
              <th style={{ textAlign: 'center', padding: '12px 10px', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((customer) => {
              const lastProduct = customer.lastOrder.items[0]?.productName || 'produto';
              const statusLabel =
                customer.lastOrderDays === 0 ? 'Hoje' :
                customer.lastOrderDays <= 7 ? 'Esta semana' :
                customer.lastOrderDays <= 15 ? 'Há 15d' :
                customer.lastOrderDays <= 30 ? 'Há 30d' :
                customer.lastOrderDays <= 45 ? '⚠️ 45d' :
                '🔴 45d+';
              const statusColor =
                customer.lastOrderDays <= 7 ? '#16a34a' :
                customer.lastOrderDays <= 15 ? '#ca8a04' :
                customer.lastOrderDays <= 30 ? '#ea580c' :
                '#dc2626';

              return (
                <Fragment key={customer.phone || customer.name}>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--surface-soft)',
                          display: 'grid', placeItems: 'center',
                          fontSize: '0.78rem', fontWeight: 700,
                          color: 'var(--text-muted)',
                        }}>
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        {customer.name}
                      </div>
                    </td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{customer.phone}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{customer.orderCount}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{formatCurrency(customer.lastOrder.total)}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 999,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: `${statusColor}18`,
                        color: statusColor,
                      }}>
                        {statusLabel}
                      </span>
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <a
                          href={whatsAppUrl(customer.phone, `Olá ${customer.name.split(' ')[0]}! Tudo bem?`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', minHeight: 32, fontSize: '0.78rem' }}
                          title="Falar no WhatsApp"
                        >
                          <Smartphone size={14} />
                        </a>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', minHeight: 32, fontSize: '0.78rem' }}
                          onClick={() => selectCampaign(customer)}
                          title="Campanha de Marketing"
                        >
                          <Send size={14} /> Campanha
                        </button>
                      </div>
                    </td>
                  </tr>
                  {/* Campaign Panel — linha separada (fora do <tr> principal!) */}
                  {campaignClient === customer && (
                    <tr key={`${customer.phone}-campaign`}>
                      <td colSpan={6} style={{ padding: '0 10px 12px' }}>
                        <div className="stack" style={{ padding: 12, background: 'var(--surface-soft)', borderRadius: 'var(--radius)' }}>
                          <div className="row-between">
                            <strong>🎯 Campanha para {customer.name}</strong>
                            <button className="icon-button" onClick={() => setCampaignClient(null)}><X size={16} /></button>
                          </div>
                          <p className="muted" style={{ fontSize: '0.84rem' }}>
                            {customer.lastOrderDays > 25
                              ? `⚠️ Cliente não compra há ${customer.lastOrderDays} dias. ${customer.lastOrderDays > 45 ? '🔴 Risco de perda! Reative agora.' : 'Cliente quente para remarketing!'}`
                              : `✅ Cliente comprou há ${customer.lastOrderDays} dias. Mantenha o relacionamento!`}
                          </p>
                          <p className="muted" style={{ fontSize: '0.78rem' }}>
                            Último pedido: {customer.lastOrder.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')} · {formatCurrency(customer.lastOrder.total)}
                          </p>
                          <div className="segmented" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))' }}>
                            {campaignTexts(customer.name, customer.lastOrderDays, lastProduct).map((opt) => (
                              <button
                                key={opt.label}
                                className={selectedIntent === opt.intent ? 'active' : ''}
                                onClick={() => { setCustomText(opt.text); setSelectedIntent(opt.intent); }}
                                style={{ fontSize: '0.75rem', minHeight: 36 }}
                                title={opt.intent}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                          <textarea
                            className="input-field"
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            placeholder="Edite a mensagem..."
                            rows={2}
                          />
                          <div className="button-row">
                            <a
                              className="btn btn-primary"
                              href={whatsAppUrl(customer.phone, customText)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink size={16} /> Abrir no WhatsApp
                            </a>
                            <span className="muted" style={{ fontSize: '0.75rem' }}>
                              {selectedIntent && `Estratégia: ${selectedIntent}`}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface ProductManagerProps {
  tenantId: number;
  products: Product[];
  onCreate: (product: Omit<Product, 'id'>) => void;
  onUpdate: (product: Product) => void;
  onDelete: (id: number) => void;
}

const ProductManager = ({ tenantId, products, onCreate, onUpdate, onDelete }: ProductManagerProps) => {
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Omit<Product, 'id'>>(emptyProduct(tenantId));

  const startNew = () => {
    setEditing(null);
    setDraft(emptyProduct(tenantId));
  };

  const startEdit = (product: Product) => {
    setEditing(product);
    setDraft(product);
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim()) return;
    if (editing) onUpdate({ ...draft, id: editing.id });
    else onCreate(draft);
    startNew();
  };

  return (
    <div className="admin-grid">
      <form className="surface stack" onSubmit={save}>
        <h2>{editing ? 'Editar Produto' : 'Novo Produto'}</h2>
        <input className="input-field" placeholder="Nome" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        <textarea className="input-field" placeholder="Descrição" value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        <input className="input-field" placeholder="Preço" inputMode="decimal" value={draft.price || ''} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value.replace(',', '.')) || 0 })} />
        <input className="input-field" placeholder="Categoria" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
        <input className="input-field" placeholder="URL da imagem (opcional)" value={draft.imageUrl} onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })} />
        <label className="check-line"><input type="checkbox" checked={draft.isAvailable} onChange={(event) => setDraft({ ...draft, isAvailable: event.target.checked })} /> Disponível</label>
        <label className="check-line"><input type="checkbox" checked={draft.isOrderBump} onChange={(event) => setDraft({ ...draft, isOrderBump: event.target.checked })} /> Destacar como Order Bump</label>
        <button className="btn btn-primary" type="submit"><Plus size={18} /> Salvar</button>
      </form>

      <div className="stack">
        <h2>Gerenciar Catálogo</h2>
        {products.map((product) => (
          <article className="surface list-row" key={product.id}>
            <div>
              <strong>{product.name}</strong>
              <p className="muted">{product.description}</p>
              <span>{formatCurrency(product.price)} · {product.category}</span>
            </div>
            <div className="row-actions">
              <button className="btn btn-secondary" onClick={() => startEdit(product)}>Editar</button>
              <button className="icon-button danger" onClick={() => onDelete(product.id)} aria-label="Excluir produto"><Trash2 size={18} /></button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

interface NeighborhoodManagerProps {
  tenantId: number;
  neighborhoods: Neighborhood[];
  onCreate: (neighborhood: Omit<Neighborhood, 'id'>) => void;
  onUpdate: (neighborhood: Neighborhood) => void;
  onDelete: (id: number) => void;
}

const statusLabels: Record<NeighborhoodStatus, string> = {
  available: 'Disponível',
  consult: 'Sob Consulta',
  unavailable: 'Indisponível',
};

const NeighborhoodManager = ({ tenantId, neighborhoods, onCreate, onUpdate, onDelete }: NeighborhoodManagerProps) => {
  const [editing, setEditing] = useState<Neighborhood | null>(null);
  const [name, setName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [status, setStatus] = useState<NeighborhoodStatus>('available');

  const reset = () => {
    setEditing(null);
    setName('');
    setDeliveryFee('');
    setStatus('available');
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    const payload = { name, deliveryFee: Number(deliveryFee.replace(',', '.')) || 0, status, tenantId };
    if (editing) onUpdate({ ...payload, id: editing.id });
    else onCreate(payload);
    reset();
  };

  return (
    <div className="admin-grid">
      <form className="surface stack" onSubmit={save}>
        <h2>{editing ? 'Editar Bairro' : 'Novo Bairro'}</h2>
        <input className="input-field" placeholder="Nome do Bairro" value={name} onChange={(event) => setName(event.target.value)} />
        <input className="input-field" placeholder="Taxa (ex: 5.00)" value={deliveryFee} onChange={(event) => setDeliveryFee(event.target.value)} />
        <select className="input-field" value={status} onChange={(event) => setStatus(event.target.value as NeighborhoodStatus)}>
          <option value="available">Disponível</option>
          <option value="consult">Sob Consulta</option>
          <option value="unavailable">Indisponível</option>
        </select>
        <button className="btn btn-primary" type="submit"><Plus size={18} /> Salvar</button>
      </form>

      <div className="stack">
        <h2>Taxas de Entrega</h2>
        {neighborhoods.map((neighborhood) => (
          <article className="surface list-row" key={neighborhood.id}>
            <div>
              <strong>{neighborhood.name}</strong>
              <p className="muted">Taxa: {formatCurrency(neighborhood.deliveryFee)}</p>
              <span>Status: {statusLabels[neighborhood.status]}</span>
            </div>
            <div className="row-actions">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(neighborhood);
                  setName(neighborhood.name);
                  setDeliveryFee(String(neighborhood.deliveryFee));
                  setStatus(neighborhood.status);
                }}
              >
                Editar
              </button>
              <button className="icon-button danger" onClick={() => onDelete(neighborhood.id)} aria-label="Excluir bairro"><Trash2 size={18} /></button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

interface TenantSettingsProps {
  tenant: ReturnType<typeof useAppStore.getState>['tenants'][number];
  onSave: (businessName: string, address: string, colorHex: string, secondaryColorHex: string, logoUrl?: string, coverUrl?: string) => void;
}

const TenantSettings = ({ tenant, onSave }: TenantSettingsProps) => {
  const [businessName, setBusinessName] = useState(tenant.businessName);
  const [address, setAddress] = useState(tenant.address);
  const [colorHex, setColorHex] = useState(tenant.colorHex);
  const [secondaryColorHex, setSecondaryColorHex] = useState(tenant.secondaryColorHex ?? '#00b4ff');
  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl ?? '');
  const [coverUrl, setCoverUrl] = useState(tenant.coverUrl ?? '');
  const readImage = (file: File | undefined, onLoad: (value: string) => void) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onLoad(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form className="surface stack settings-form" onSubmit={(event) => {
      event.preventDefault();
      onSave(businessName, address, colorHex, secondaryColorHex, logoUrl || undefined, coverUrl || undefined);
    }}>
      {/* Personalização */}
      <div>
        <h2>Personalização da Loja</h2>
        <p className="muted">Ajuste a vitrine que seus clientes veem no link de pedidos.</p>
      </div>

      <div
        className="store-preview"
        style={{
          '--tenant-color': colorHex,
          '--tenant-secondary': secondaryColorHex,
        } as CSSProperties}
      >
        <div className="store-preview-cover">
          {coverUrl ? <img src={coverUrl} alt="Prévia da capa" /> : null}
        </div>
        <div className="store-preview-body">
          <div className="store-preview-logo">
            {logoUrl ? <img src={logoUrl} alt="Prévia da logo" /> : <DespachaLogo compact />}
          </div>
          <strong>{businessName || 'Nome da sua loja'}</strong>
          <span>{address || 'Endereço da loja'}</span>
        </div>
      </div>

      <div className="form-grid two">
        <label>
          <span>Nome do negócio</span>
          <input className="input-field" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Nome do Negócio" />
        </label>
        <label>
          <span>Endereço completo</span>
          <input className="input-field" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Endereço Completo" />
        </label>
      </div>

      <div className="form-grid two color-grid">
        <label>
          <span>Cor primária</span>
          <input className="color-input" type="color" value={colorHex} onChange={(event) => setColorHex(event.target.value)} />
        </label>
        <label>
          <span>Cor secundária</span>
          <input className="color-input" type="color" value={secondaryColorHex} onChange={(event) => setSecondaryColorHex(event.target.value)} />
        </label>
      </div>

      <div className="form-grid two">
        <label className="upload-box">
          <span className="label-with-help">
            Logo da loja
            <span className="tooltip-wrap">
              <Info size={15} aria-hidden="true" />
              <span className="tooltip">Use imagem quadrada, ideal 512 x 512 px. PNG ou JPG.</span>
            </span>
          </span>
          <input type="file" accept="image/*" onChange={(event) => readImage(event.target.files?.[0], setLogoUrl)} />
          <strong>{logoUrl ? 'Logo selecionada' : 'Enviar imagem'}</strong>
        </label>
        <label className="upload-box">
          <span className="label-with-help">
            Capa da vitrine
            <span className="tooltip-wrap">
              <Info size={15} aria-hidden="true" />
              <span className="tooltip">Use imagem horizontal, ideal 1440 x 540 px. Área segura central: 1200 x 420 px.</span>
            </span>
          </span>
          <input type="file" accept="image/*" onChange={(event) => readImage(event.target.files?.[0], setCoverUrl)} />
          <strong>{coverUrl ? 'Capa selecionada' : 'Enviar imagem'}</strong>
        </label>
      </div>

      <button className="btn btn-primary" type="submit">Salvar Preferências</button>
    </form>
  );
};

export default Admin;
