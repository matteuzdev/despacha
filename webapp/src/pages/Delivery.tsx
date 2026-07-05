import type { FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LayoutGrid, List, LogOut, PersonStanding, Truck } from 'lucide-react';
import { formatCurrency, useAppStore } from '../store/db';

const Delivery = () => {
  const navigate = useNavigate();
  const { currentUser, logout, orders, updateOrderStatus } = useAppStore();
  const [onboarded, setOnboarded] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? '');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState<'Moto' | 'Carro' | 'Bicicleta'>('Moto');
  const [navCollapsed, setNavCollapsed] = useState(false);

  if (!currentUser || currentUser.role !== 'delivery') {
    return (
      <main className="screen center-screen">
        <div className="surface stack narrow center-text">
          <h1>Acesso negado</h1>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Fazer Login</button>
        </div>
      </main>
    );
  }

  const submitProfile = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim() && phone.trim()) setOnboarded(true);
  };

  const deliveryOrders = orders.filter((order) => order.tenantId === currentUser.tenantId && ['Saiu', 'Confirmado'].includes(order.status));

  if (!onboarded) {
    return (
      <main className="screen app-screen">
        <header className="topbar">
          <button className="icon-button" onClick={() => { logout(); navigate('/portal'); }} aria-label="Voltar">←</button>
          <strong>Perfil do Entregador</strong>
        </header>
        <form className="content surface stack delivery-profile" onSubmit={submitProfile}>
          <div className="round-icon"><PersonStanding /></div>
          <h1>Crie seu perfil de entregador</h1>
          <p className="muted">Os clientes verão seu nome durante a entrega.</p>
          <input className="input-field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nome Completo" required />
          <input className="input-field" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="WhatsApp (Para contato)" required />
          <div className="segmented">
            {(['Moto', 'Carro', 'Bicicleta'] as const).map((item) => (
              <button type="button" className={vehicle === item ? 'active' : ''} onClick={() => setVehicle(item)} key={item}>{item}</button>
            ))}
          </div>
          <button className="btn btn-primary" type="submit">Concluir e Ver Entregas</button>
        </form>
      </main>
    );
  }

  return (
    <main className="screen app-screen">
      <header className="topbar">
        <button className="icon-button" onClick={() => setNavCollapsed(!navCollapsed)} aria-label={navCollapsed ? 'Expandir menu' : 'Recolher menu'}>
          {navCollapsed ? <LayoutGrid size={18} /> : <List size={18} />}
        </button>
      </header>

      <section className="content stack">
        <div className="hero-panel">
          <Truck />
          <h1>Entregas Pendentes ({deliveryOrders.length})</h1>
          <p>{name} · {vehicle}</p>
        </div>

        {!deliveryOrders.length ? (
          <p className="muted empty-state">Nenhuma entrega no momento.</p>
        ) : (
          deliveryOrders.map((order) => (
            <article className="surface order-card" key={order.id}>
              <div className="row-between">
                <strong>{order.orderNumber}</strong>
                <span className="status-chip">{order.status}</span>
              </div>
              <p>Cliente: {order.customerName} ({order.customerPhone})</p>
              <p className="muted">Endereço: {order.addressStreet}, {order.addressNumber}</p>
              <p className="muted">Bairro: {order.addressNeighborhood}</p>
              {order.addressComplement && <p className="muted">Compl: {order.addressComplement}</p>}
              <strong>Pagamento: {order.paymentMethod} · {formatCurrency(order.total)}</strong>
              {order.changeFor > 0 && <p className="danger-text">Levar troco para: {formatCurrency(order.changeFor)}</p>}
              <button className="btn btn-primary" onClick={() => updateOrderStatus(order.id, 'Entregue')}>
                <Check size={18} /> Marcar como Entregue
              </button>
            </article>
          ))
        )}
      </section>

      <nav className={`bottom-nav ${navCollapsed ? 'collapsed' : ''}`}>
        <button className="active"><Truck size={20} />{!navCollapsed && <span>Entregas</span>}</button>
        <button onClick={() => navigate('/portal')}><LayoutGrid size={20} />{!navCollapsed && <span>Portal</span>}</button>
        <button onClick={() => { logout(); navigate('/portal'); }}><LogOut size={20} />{!navCollapsed && <span>Sair</span>}</button>
      </nav>
    </main>
  );
};

export default Delivery;
