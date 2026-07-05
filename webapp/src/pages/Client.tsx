import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Home, Minus, Plus, Receipt, ShoppingCart } from 'lucide-react';
import DespachaLogo from '../components/DespachaLogo';
import type { Neighborhood, Order, Product, Tenant } from '../store/db';
import { formatCurrency, formatDateTime, phoneMask, useAppStore } from '../store/db';
import { api } from '../store/api';

type ClientTab = 'catalog' | 'favorites' | 'history' | 'cart' | 'checkout' | 'success';

const Client = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const {
    tenants,
    products,
    neighborhoods,
    orders,
    cartItems,
    addToCart,
    toggleFavorite,
    placeOrder,
  } = useAppStore();
  const [tab, setTab] = useState<ClientTab>('catalog');
  const [slugTenant, setSlugTenant] = useState<{ tenant: Tenant; products: Product[]; neighborhoods: Neighborhood[] } | null>(null);
  const [slugLoading, setSlugLoading] = useState(true);
  const [slugError, setSlugError] = useState('');

  // Se tem slug na URL, carrega dados daquele tenant via API
  useEffect(() => {
    if (slug) {
      setSlugLoading(true);
      setSlugError('');
      api.getTenantBySlug(slug)
        .then((data) => {
          setSlugTenant(data);
          setSlugLoading(false);
        })
        .catch((err) => {
          setSlugError(err.message || 'Loja não encontrada');
          setSlugLoading(false);
        });
    } else {
      // Sem slug? tenta pegar o primeiro tenant (fallback pra /client)
      if (tenants.length > 0) {
        const first = tenants[0];
        setSlugTenant({
          tenant: first,
          products: products.filter((p) => p.tenantId === first.id && p.isAvailable),
          neighborhoods: neighborhoods.filter((n) => n.tenantId === first.id && n.status !== 'unavailable'),
        });
      }
      setSlugLoading(false);
    }
  }, [slug, tenants, products, neighborhoods]);

  if (slugLoading) {
    return (
      <main className="screen center-screen">
        <div className="surface stack narrow center-text" style={{ padding: 32 }}>
          <div className="spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', margin: '0 auto' }} />
          <p className="muted">Carregando loja...</p>
        </div>
      </main>
    );
  }

  if (slugError || !slugTenant) {
    return (
      <main className="screen center-screen">
        <div className="surface stack narrow center-text">
          <h2>Loja não encontrada</h2>
          <p className="muted">{slugError || 'O link que você acessou não existe.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  const tenant = slugTenant.tenant;
  const tenantProducts = slugTenant.products || [];
  const tenantNeighborhoods = slugTenant.neighborhoods || [];
  const tenantOrders = orders.filter((order) => order.tenantId === tenant.id);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const showStoreHeader = tab === 'catalog' || tab === 'favorites' || tab === 'history';
  const goToCheckout = () => {
    if (!cartItems.length) return;
    setTab('checkout');
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  return (
    <main
      className="screen app-screen client-screen"
      style={{
        '--tenant-color': tenant.colorHex,
        '--tenant-secondary': tenant.secondaryColorHex ?? '#00b4ff',
      } as CSSProperties}
    >
      {showStoreHeader && (
        <header className="store-header">
          <div className="store-cover">
            {tenant.coverUrl ? <img src={tenant.coverUrl} alt="Capa da loja" /> : null}
            <button className="icon-button back-floating" onClick={() => navigate('/portal')} aria-label="Voltar">←</button>
            <button className="cart-floating" onClick={() => setTab('cart')} aria-label="Carrinho">
              <ShoppingCart size={20} />
              {cartCount > 0 && <span>{cartCount}</span>}
            </button>
          </div>
          <div className="store-info">
            <div className="store-logo">{tenant.logoUrl ? <img src={tenant.logoUrl} alt="Logo" /> : <DespachaLogo compact />}</div>
            <h1>{tenant.businessName}</h1>
            <p>{tenant.address}</p>
          </div>
        </header>
      )}

      <section className="content stack">
        {tab === 'catalog' && (
          <Catalog
            products={tenantProducts}
            onAdd={(productId) => {
              const product = tenantProducts.find((item) => item.id === productId);
              if (product) addToCart(product, 1);
            }}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {tab === 'favorites' && (
          <Catalog
            title="Favoritos"
            emptyText="Você ainda não adicionou favoritos."
            products={tenantProducts.filter((product) => product.isFavorite)}
            onAdd={(productId) => {
              const product = tenantProducts.find((item) => item.id === productId);
              if (product) addToCart(product, 1);
            }}
            onToggleFavorite={toggleFavorite}
          />
        )}

        {tab === 'history' && <History orders={tenantOrders} />}

        {tab === 'cart' && (
          <Cart
            onBack={() => setTab('catalog')}
            onCheckout={goToCheckout}
          />
        )}

        {tab === 'checkout' && (
          <CheckoutForm
            neighborhoods={tenantNeighborhoods}
            onBack={() => setTab('cart')}
            onSubmit={async (payload) => {
              const order = await placeOrder(payload, tenant.id);
              if (order) setTab('success');
            }}
          />
        )}

        {tab === 'success' && (
          <div className="success-state surface stack center-text">
            <div className="round-icon"><Receipt /></div>
            <h1>Pedido Recebido!</h1>
            <p className="muted">Obrigado pelo seu pedido. Agora é só aguardar a confirmação de entrega.</p>
            <button className="btn btn-primary" onClick={() => setTab('catalog')}>Voltar à Loja</button>
          </div>
        )}
      </section>

      {tab !== 'cart' && tab !== 'checkout' && tab !== 'success' && (
        <nav className="bottom-nav">
          <button type="button" className={tab === 'catalog' ? 'active' : ''} onClick={() => setTab('catalog')}><Home /> Início</button>
          <button type="button" className={tab === 'favorites' ? 'active' : ''} onClick={() => setTab('favorites')}><Heart /> Favoritos</button>
          <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}><Receipt /> Pedidos</button>
        </nav>
      )}
    </main>
  );
};

interface CatalogProps {
  title?: string;
  emptyText?: string;
  products: ReturnType<typeof useAppStore.getState>['products'];
  onAdd: (productId: number) => void;
  onToggleFavorite: (productId: number) => void;
}

const Catalog = ({ title, emptyText = 'Nenhum produto disponível.', products, onAdd, onToggleFavorite }: CatalogProps) => {
  const grouped = useMemo(() => products.reduce<Record<string, typeof products>>((acc, product) => {
    (acc[product.category] = acc[product.category] ?? []).push(product);
    return acc;
  }, {}), [products]);

  if (!products.length) return <p className="muted empty-state">{emptyText}</p>;

  return (
    <div className="stack">
      {title && <h2>{title}</h2>}
      {Object.entries(grouped).map(([category, items]) => (
        <section className="stack compact" key={category}>
          <h2>{category}</h2>
          {items.map((product) => (
            <article className="surface product-card" key={product.id}>
              <div className="product-thumb">
                {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <ShoppingCart />}
              </div>
              <div className="product-copy">
                <div className="row-between">
                  <h3>{product.name}</h3>
                  <button type="button" className={`icon-button ${product.isFavorite ? 'favorite' : ''}`} onClick={() => onToggleFavorite(product.id)} aria-label="Favorito">
                    <Heart size={18} />
                  </button>
                </div>
                <p className="muted">{product.description}</p>
                <strong>{formatCurrency(product.price)}</strong>
              </div>
              <button type="button" className="btn btn-primary add-button" onClick={() => onAdd(product.id)}>Adicionar</button>
            </article>
          ))}
        </section>
      ))}
    </div>
  );
};

const Cart = ({ onBack, onCheckout }: { onBack: () => void; onCheckout: () => void }) => {
  const { cartItems, products, addToCart, updateCartQuantity } = useAppStore();
  const cartProductIds = cartItems.map((item) => item.productId);
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const orderBumps = products
    .filter((product) => !cartProductIds.includes(product.id) && product.isAvailable)
    .sort((a, b) => Number(b.isOrderBump) - Number(a.isOrderBump))
    .slice(0, 2);

  return (
    <div className="stack cart-view">
      <header className="subheader">
        <button className="icon-button" onClick={onBack} aria-label="Voltar">←</button>
        <h1>Carrinho</h1>
      </header>

      {!cartItems.length ? (
        <p className="muted empty-state">Seu carrinho está vazio</p>
      ) : (
        <>
          {cartItems.map((item) => (
            <article className="surface list-row" key={item.productId}>
              <div>
                <strong>{item.productName}</strong>
                <p className="muted">{formatCurrency(item.unitPrice)}</p>
              </div>
              <div className="quantity-control">
                <button type="button" onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}><Minus size={16} /></button>
                <span>{item.quantity}</span>
                <button type="button" onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}><Plus size={16} /></button>
              </div>
            </article>
          ))}

          {orderBumps.length > 0 && (
            <section className="stack compact">
              <h2>Aproveite e leve também:</h2>
              {orderBumps.map((product) => (
                <article className="surface bump-row" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <p className="muted">+ {formatCurrency(product.price)}</p>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={() => addToCart(product, 1)}>Adicionar</button>
                </article>
              ))}
            </section>
          )}

          <div className="surface sticky-summary">
            <div className="row-between total-row"><span>Total</span><strong>{formatCurrency(subtotal)}</strong></div>
            <button type="button" className="btn btn-primary" onClick={onCheckout}>Finalizar Pedido</button>
          </div>
        </>
      )}
    </div>
  );
};

interface CheckoutFormProps {
  neighborhoods: Neighborhood[];
  onBack: () => void;
  onSubmit: (payload: Parameters<ReturnType<typeof useAppStore.getState>['placeOrder']>[0]) => void;
}

const CheckoutForm = ({ neighborhoods, onBack, onSubmit }: CheckoutFormProps) => {
  const cartItems = useAppStore((state) => state.cartItems);
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const handlePhone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setPhone(phoneMask(digits));
  };
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [reference, setReference] = useState('');
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod']>('Pix');
  const [changeFor, setChangeFor] = useState('');
  const selectedNeighborhood = neighborhoods.find((item) => String(item.id) === neighborhoodId);
  const total = subtotal + (selectedNeighborhood?.deliveryFee ?? 0);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedNeighborhood) return;
    onSubmit({
      customerName: name,
      customerPhone: phone,
      addressStreet: street,
      addressNumber: number,
      addressNeighborhood: selectedNeighborhood,
      addressComplement: complement,
      addressReference: reference,
      paymentMethod,
      changeFor: Number(changeFor.replace(',', '.')) || 0,
    });
  };

  return (
    <form className="stack checkout-form" onSubmit={submit}>
      <header className="subheader">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Voltar">←</button>
        <h1>Finalizar Pedido</h1>
      </header>

      <section className="surface stack">
        <h2>Dados do Cliente</h2>
        <input className="input-field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome Completo" required />
        <input className="input-field" value={phone} onChange={(event) => handlePhone(event.target.value)} placeholder="(DDD) 99999-9999" type="tel" required />
      </section>

      <section className="surface stack">
        <h2>Endereço de Entrega</h2>
        <input className="input-field" value={street} onChange={(event) => setStreet(event.target.value)} placeholder="Rua" required />
        <div className="field-row">
          <input className="input-field" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="Número" required />
          <input className="input-field" value={complement} onChange={(event) => setComplement(event.target.value)} placeholder="Complemento" />
        </div>
        <select className="input-field" value={neighborhoodId} onChange={(event) => setNeighborhoodId(event.target.value)} required>
          <option value="">Selecione o Bairro</option>
          {neighborhoods.map((item) => (
            <option value={item.id} key={item.id}>{item.name} (Taxa: {formatCurrency(item.deliveryFee)})</option>
          ))}
        </select>
        <input className="input-field" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Ponto de Referência" />
      </section>

      <section className="surface stack">
        <h2>Pagamento</h2>
        <div className="segmented">
          {(['Pix', 'Dinheiro', 'Cartão'] as const).map((method) => (
            <button type="button" className={paymentMethod === method ? 'active' : ''} onClick={() => setPaymentMethod(method)} key={method}>{method}</button>
          ))}
        </div>
        {paymentMethod === 'Dinheiro' && (
          <input className="input-field" value={changeFor} onChange={(event) => setChangeFor(event.target.value)} placeholder="Troco para quanto?" />
        )}
      </section>

      <section className="surface stack">
        <div className="row-between"><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
        <div className="row-between"><span>Taxa de Entrega</span><strong>{formatCurrency(selectedNeighborhood?.deliveryFee ?? 0)}</strong></div>
        <div className="divider" />
        <div className="row-between total-row"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
      </section>

      <button className="btn btn-primary sticky-action" disabled={!name || !phone || !street || !selectedNeighborhood} type="submit">Confirmar Pedido</button>
    </form>
  );
};

const History = ({ orders }: { orders: Order[] }) => {
  if (!orders.length) return <p className="muted empty-state">Você ainda não fez nenhum pedido no dispositivo.</p>;

  return (
    <div className="stack">
      <h2>Histórico de Pedidos</h2>
      {orders.map((order) => (
        <article className="surface order-card" key={order.id}>
          <div className="row-between">
            <strong>Pedido: {order.orderNumber}</strong>
            <span className="status-chip">{order.status}</span>
          </div>
          <p className="muted">Data: {formatDateTime(order.createdAt)}</p>
          {order.items.map((item) => (
            <div className="row-between" key={`${order.id}-${item.productId}`}>
              <span>{item.quantity}x {item.productName}</span>
              <span>{formatCurrency(item.totalPrice)}</span>
            </div>
          ))}
          <div className="divider" />
          <div className="row-between total-row"><span>Total</span><strong>{formatCurrency(order.total)}</strong></div>
        </article>
      ))}
    </div>
  );
};

export default Client;
