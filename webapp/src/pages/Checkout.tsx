import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowUpRight, CheckCircle, ExternalLink, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAppStore } from '../store/db';

type PaymentStatus = 'idle' | 'waiting' | 'confirmed' | 'timeout';

const planCopy: Record<string, { name: string; price: string }> = {
  PRO: { name: 'Mensal', price: 'R$ 49,90' },
  TRIANNUAL: { name: 'Trimestral', price: 'R$ 149,90' },
  ANNUAL: { name: 'Anual', price: 'R$ 449,90' },
  VITALICIA: { name: 'Vitalício', price: 'R$ 999,00' },
  FREE: { name: 'Free', price: 'R$ 0,00' },
};

const checkoutLinks: Record<string, string | undefined> = {
  PRO: import.meta.env.VITE_CAKTO_CHECKOUT_PRO,
  TRIANNUAL: import.meta.env.VITE_CAKTO_CHECKOUT_TRIANNUAL,
  ANNUAL: import.meta.env.VITE_CAKTO_CHECKOUT_ANNUAL,
  VITALICIA: import.meta.env.VITE_CAKTO_CHECKOUT_VITALICIA,
  FREE: import.meta.env.VITE_CAKTO_CHECKOUT_FREE,
};

interface SubscriptionStatus {
  subscription: {
    id: number;
    tenantId: number;
    plan: string;
    status: string;
    caktoPurchaseId: number | null;
  } | null;
  tenant: {
    id: number;
    name: string;
    plan: string;
    status: string;
  } | null;
}

async function fetchSubscriptionStatus(userId: number): Promise<SubscriptionStatus | null> {
  try {
    const response = await fetch(`/api/subscription/${userId}`);
    if (!response.ok) return null;
    return response.json() as Promise<SubscriptionStatus>;
  } catch {
    return null;
  }
}

const Checkout = () => {
  const navigate = useNavigate();
  const { plan = 'PRO' } = useParams();
  const currentUser = useAppStore((state) => state.currentUser);
  const planKey = plan.toUpperCase();
  const selectedPlan = planCopy[planKey] ?? planCopy.PRO;
  const checkoutUrl = checkoutLinks[planKey];
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const startPolling = () => {
    if (!currentUser) return;
    setPaymentStatus('waiting');
    pollCountRef.current = 0;

    pollingRef.current = setInterval(async () => {
      pollCountRef.current += 1;

      // Timeout após ~2 minutos (12 polls a cada 10s)
      if (pollCountRef.current >= 12) {
        stopPolling();
        setPaymentStatus('timeout');
        return;
      }

      const data = await fetchSubscriptionStatus(currentUser.id);
      if (data?.subscription?.status === 'active' || data?.tenant?.status === 'Ativo') {
        stopPolling();
        setPaymentStatus('confirmed');
        toast.success('Assinatura confirmada!');
      }
    }, 10000);
  };

  // Limpa polling ao desmontar
  useEffect(() => {
    return () => stopPolling();
  }, []);

  const openCaktoCheckout = () => {
    if (!checkoutUrl) {
      toast.error('Configure o link da Cakto no .env');
      return;
    }

    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    startPolling();
  };

  // Estado de confirmação
  if (paymentStatus === 'confirmed') {
    return (
      <main className="screen app-screen">
        <header className="topbar">
          <button className="icon-button" onClick={() => navigate('/admin')} aria-label="Ir para admin">←</button>
          <strong>Assinatura Confirmada!</strong>
        </header>
        <section className="checkout-wrap center-screen">
          <div className="surface stack center-text" style={{ maxWidth: 480, padding: 32 }}>
            <div className="round-icon" style={{ background: '#dcfce7', color: '#16a34a', width: 80, height: 80 }}>
              <CheckCircle size={48} />
            </div>
            <h1>Pagamento aprovado!</h1>
            <p className="muted">
              Seu plano <strong>{selectedPlan.name}</strong> foi ativado com sucesso.
              Você já pode começar a usar o Despacha.
            </p>
            <button className="btn btn-primary" onClick={() => navigate('/admin')}>
              Ir para o Painel
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="screen app-screen">
      <header className="topbar">
        <button className="icon-button" onClick={() => navigate(-1)} aria-label="Voltar">←</button>
        <strong>Finalizar Assinatura</strong>
      </header>

      <section className="stack checkout-wrap">
        <div className="surface stack">
          <h2>Resumo do Pedido</h2>
          <div className="row-between">
            <span>Plano {selectedPlan.name}</span>
            <strong>{selectedPlan.price}</strong>
          </div>
          <div className="divider" />
          <div className="row-between total-row">
            <span>Total a pagar hoje</span>
            <strong>{selectedPlan.price}</strong>
          </div>
        </div>

        <div className="stack">
          <h2>Pagamento pela Cakto</h2>
          <div className="surface stack">
            <p className="muted secure-line">
              <ShieldCheck size={16} />
              Pix, cartão e boleto serão processados no checkout seguro da Cakto.
            </p>

            {paymentStatus === 'waiting' ? (
              <div className="stack center-text">
                <div className="round-icon" style={{ background: '#fff7ed', color: '#ea580c' }}>
                  <LoaderCircle size={32} className="spin" />
                </div>
                <strong>Aguardando confirmação do pagamento...</strong>
                <p className="muted">
                  O checkout foi aberto em outra aba. Assim que o pagamento for
                  confirmado pela Cakto, sua assinatura será ativada automaticamente.
                </p>
                <div className="button-row">
                  <button className="btn btn-secondary" onClick={startPolling}>
                    <RefreshCw size={16} /> Verificar novamente
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate('/admin')}>
                    Ir para o Painel
                  </button>
                </div>
              </div>
            ) : paymentStatus === 'timeout' ? (
              <div className="stack center-text">
                <strong>Pagamento ainda não identificado</strong>
                <p className="muted">
                  Se você já pagou, aguarde alguns minutos. A Cakto enviará
                  a confirmação automaticamente.
                </p>
                <div className="button-row">
                  <button className="btn btn-primary" onClick={startPolling}>
                    <RefreshCw size={16} /> Verificar novamente
                  </button>
                  {checkoutUrl && (
                    <button className="btn btn-secondary" onClick={openCaktoCheckout}>
                      Reabrir checkout <ExternalLink size={16} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {checkoutUrl ? (
                  <>
                    <button className="btn btn-primary" onClick={openCaktoCheckout}>
                      Abrir checkout Cakto <ExternalLink size={18} />
                    </button>
                    <p className="muted" style={{ fontSize: '0.82rem' }}>
                      Ao clicar, você será redirecionado ao ambiente seguro da Cakto
                      para pagamento via Pix, cartão ou boleto.
                    </p>
                  </>
                ) : (
                  <div className="stack compact">
                    <strong>Checkout Cakto ainda não configurado</strong>
                    <p className="muted">
                      Crie o produto/oferta na Cakto e preencha a variável{' '}
                      <code>VITE_CAKTO_CHECKOUT_{planKey}</code> com o link público.
                    </p>
                  </div>
                )}

                <button className="btn btn-secondary" onClick={() => navigate('/register')}>
                  Continuar cadastro <ArrowUpRight size={18} />
                </button>

                <p className="muted secure-line">
                  <CheckCircle size={14} />
                  A confirmação real da assinatura chega pelo webhook da Cakto.
                  Você pode acompanhar o status aqui após pagar.
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Checkout;
