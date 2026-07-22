import { create } from 'zustand';
import { api } from './api';

export type Role = 'superAdmin' | 'admin' | 'delivery' | 'client';

export interface Customer {
  name: string;
  phone: string;
  lastOrder: Order;
  orderCount: number;
  lastOrderDays: number;
}

export function extractCustomers(orders: Order[]): Customer[] {
  const map = new Map<string, { name: string; lastOrder: Order; count: number }>();
  for (const order of orders) {
    const key = order.customerPhone || order.customerName;
    const existing = map.get(key);
    if (!existing || order.createdAt > existing.lastOrder.createdAt) {
      map.set(key, {
        name: order.customerName,
        lastOrder: order,
        count: (existing?.count ?? 0) + 1,
      });
    } else {
      map.set(key, { ...existing, count: existing.count + 1 });
    }
  }
  const now = Date.now();
  return Array.from(map.values())
    .map(({ name, lastOrder, count }) => ({
      name,
      phone: lastOrder.customerPhone,
      lastOrder,
      orderCount: count,
      lastOrderDays: Math.floor((now - lastOrder.createdAt) / (1000 * 60 * 60 * 24)),
    }))
    .sort((a, b) => a.lastOrderDays - b.lastOrderDays);
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const hasCountry = digits.startsWith('55');
  const local = hasCountry ? digits.slice(2) : digits;
  if (local.length < 10 || local.length > 11) return digits;
  return `55${local}`;
}

export function whatsAppUrl(phone: string, text: string): string {
  const formatted = formatPhone(phone);
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
}

export function phoneMask(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function campaignTexts(
  clientName: string,
  daysSinceLast: number,
  lastProduct?: string,
): { label: string; text: string; intent: string }[] {
  const name = clientName.split(' ')[0];
  const product = lastProduct || 'gás ou água';
  const isUrgent = daysSinceLast > 40;

  return [
    {
      label: isUrgent ? '🔴 Reativar Cliente' : '⚠️ Está precisando?',
      text: `Olá ${name}! Tudo bem? Notamos que já faz ${daysSinceLast} dias desde seu último pedido de ${product}. Está precisando repor? É só responder que já preparamos tudo! 💨💧`,
      intent: 'Reativação',
    },
    {
      label: '📦 Promoção especial',
      text: `Oi ${name}! Temos uma oferta especial para você! Frete grátis na próxima compra de ${product}. Chama aqui que a gente acerta os detalhes 🔥`,
      intent: 'Promoção',
    },
    {
      label: '💬 Lembrete amigável',
      text: `Olá ${name}! Passando pra lembrar que estamos sempre prontos pra atender. Seu último pedido de ${product} foi há ${daysSinceLast} dias, quer repor? 😊`,
      intent: 'Lembrete',
    },
    {
      label: '🎯 Oferta Personalizada',
      text: `Olá ${name}! Aqui é do Depósito. Vi que seu último pedido foi de ${product} há ${daysSinceLast} dias. Está na hora de repor? Posso garantir a entrega ainda hoje! 🚚`,
      intent: 'Personalizada',
    },
    {
      label: '✏️ Personalizado',
      text: `Olá ${name}! `,
      intent: 'Livre',
    },
  ];
}

export type OrderStatus = 'Novo' | 'Aguardando análise' | 'Confirmado' | 'Saiu' | 'Entregue' | 'Cancelado';
export type NeighborhoodStatus = 'available' | 'consult' | 'unavailable';

export interface User {
  id: number;
  name: string;
  email: string;
  passwordHash?: string;
  role: Role;
  tenantId: number | null;
  isFirstLogin: boolean;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'TRIANNUAL' | 'ANNUAL' | 'VITALICIA';
  status: string;
  ownerEmail: string;
  businessName: string;
  address: string;
  colorHex: string;
  secondaryColorHex?: string;
  logoUrl?: string;
  coverUrl?: string;
  isMrr?: boolean;
  createdAt: number;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove acentos (combining diacritical marks)
    .replace(/[^\w\s-]/g, '')          // Remove caracteres especiais restantes
    .replace(/[\s_]+/g, '-')            // Espaços viram hífens
    .replace(/-+/g, '-')                 // Remove hífens duplicados
    .replace(/^-|-$/g, '')               // Remove hífens nas pontas
    .trim() || 'loja';
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  isAvailable: boolean;
  isFavorite: boolean;
  isOrderBump: boolean;
  tenantId: number;
}

export interface Neighborhood {
  id: number;
  name: string;
  deliveryFee: number;
  status: NeighborhoodStatus;
  tenantId: number;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  addressStreet: string;
  addressNumber: string;
  addressNeighborhood: string;
  addressComplement: string;
  addressReference: string;
  paymentMethod: 'Pix' | 'Dinheiro' | 'Cartão';
  changeFor: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  items: OrderItem[];
  tenantId: number;
  createdAt: number;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  addressStreet: string;
  addressNumber: string;
  addressNeighborhood: Neighborhood;
  addressComplement: string;
  addressReference: string;
  paymentMethod: Order['paymentMethod'];
  changeFor: number;
}

interface AppState {
  isBackendReady: boolean;
  backendError: string | null;
  users: User[];
  tenants: Tenant[];
  products: Product[];
  neighborhoods: Neighborhood[];
  orders: Order[];
  cartItems: OrderItem[];
  currentUser: User | null;
  hydrateFromBackend: () => Promise<void>;
  login: (email: string, pass: string) => Promise<User | null>;
  logout: () => void;
  registerUser: (name: string, email: string, password: string) => Promise<User>;
  addTenant: (params: { name: string; email: string; password: string; plan: string; isMrr?: boolean }) => Promise<void>;
  updateTenant: (tenant: Tenant) => void;
  deleteTenant: (id: number) => void;
  insertProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
  toggleFavorite: (productId: number) => void;
  insertNeighborhood: (neighborhood: Omit<Neighborhood, 'id'>) => void;
  updateNeighborhood: (neighborhood: Neighborhood) => void;
  deleteNeighborhood: (id: number) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  placeOrder: (payload: CheckoutPayload, tenantId?: number) => Promise<Order | null>;
  updateOrderStatus: (id: number, status: OrderStatus) => void;
}

const nextId = () => Date.now() + Math.floor(Math.random() * 1000);
const money = (value: number) => Math.round(value * 100) / 100;

export const useAppStore = create<AppState>()((set, get) => ({
  isBackendReady: false,
  backendError: null,
  users: [],
  tenants: [],
  products: [],
  neighborhoods: [],
  orders: [],
  cartItems: [],
  currentUser: null,

  // ── Hydrate: carrega TUDO do backend ──────────────
  hydrateFromBackend: async () => {
    try {
      const state = await api.getState();
      set({
        users: state.users,
        tenants: state.tenants,
        products: state.products,
        neighborhoods: state.neighborhoods,
        orders: state.orders,
        isBackendReady: true,
        backendError: null,
      });
    } catch (error) {
      set({
        isBackendReady: false,
        backendError: error instanceof Error ? error.message : 'Backend indisponível',
      });
      throw error;
    }
  },

  // ── Auth via Backend ────────────────────────────────
  login: async (email, pass) => {
    try {
      const { user } = await api.login(email.trim(), pass);
      set({ currentUser: user });
      return user;
    } catch {
      // Fallback local para seed users em desenvolvimento
      const localUser = get().users.find(
        (u) => u.email === email.trim() && u.passwordHash === pass,
      );
      if (localUser) {
        set({ currentUser: localUser });
        return localUser;
      }
      return null;
    }
  },

  logout: () => set({ currentUser: null }),

  registerUser: async (name, email, password) => {
    const { user, tenant } = await api.register(name, email, password);
    set((state) => ({
      users: [...state.users, user],
      tenants: [...state.tenants, tenant],
      currentUser: user,
    }));
    return user;
  },

  // ── SuperAdmin cria tenant + user ───────────────────
  addTenant: async ({ name, email, password, plan, isMrr }) => {
    const { user, tenant } = await api.superAdminCreateTenantUser(
      name,
      email,
      password,
      plan,
      isMrr,
    );
    set((state) => ({
      tenants: [...state.tenants, tenant],
      users: [...state.users, user],
    }));
  },

  updateTenant: async (tenant) => {
    try {
      const updated = await api.updateTenant(tenant);
      set((state) => ({
        tenants: state.tenants.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      }));
    } catch {
      set((state) => ({
        tenants: state.tenants.map((item) =>
          item.id === tenant.id ? tenant : item,
        ),
      }));
    }
  },

  deleteTenant: async (id) => {
    try {
      await api.deleteTenant(id);
      set((state) => ({
        tenants: state.tenants.filter((item) => item.id !== id),
        products: state.products.filter((p) => p.tenantId !== id),
        neighborhoods: state.neighborhoods.filter((n) => n.tenantId !== id),
        orders: state.orders.filter((o) => o.tenantId !== id),
        users: state.users.filter((u) => u.tenantId !== id),
      }));
    } catch {
      set((state) => ({
        tenants: state.tenants.filter((item) => item.id !== id),
      }));
    }
  },

  // ── CRUD Produtos ────────────────────────────────────
  insertProduct: async (product) => {
    try {
      const created = await api.createProduct(product);
      set((state) => ({ products: [...state.products, created] }));
    } catch {
      const created = { ...product, id: nextId() };
      set((state) => ({ products: [...state.products, created] }));
    }
  },

  updateProduct: async (product) => {
    try {
      const updated = await api.updateProduct(product);
      set((state) => ({
        products: state.products.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      }));
    } catch {
      set((state) => ({
        products: state.products.map((item) =>
          item.id === product.id ? product : item,
        ),
      }));
    }
  },

  deleteProduct: async (id) => {
    try {
      await api.deleteProduct(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    } catch {
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    }
  },

  toggleFavorite: async (productId) => {
    const product = get().products.find((item) => item.id === productId);
    if (!product) return;
    const toggled = { ...product, isFavorite: !product.isFavorite };
    try {
      await api.updateProduct(toggled);
    } catch {
      // silent
    }
    set((state) => ({
      products: state.products.map((item) =>
        item.id === productId ? toggled : item,
      ),
    }));
  },

  // ── CRUD Bairros ─────────────────────────────────────
  insertNeighborhood: async (neighborhood) => {
    try {
      const created = await api.createNeighborhood(neighborhood);
      set((state) => ({ neighborhoods: [...state.neighborhoods, created] }));
    } catch {
      const created = { ...neighborhood, id: nextId() };
      set((state) => ({ neighborhoods: [...state.neighborhoods, created] }));
    }
  },

  updateNeighborhood: async (neighborhood) => {
    try {
      const updated = await api.updateNeighborhood(neighborhood);
      set((state) => ({
        neighborhoods: state.neighborhoods.map((item) =>
          item.id === updated.id ? updated : item,
        ),
      }));
    } catch {
      set((state) => ({
        neighborhoods: state.neighborhoods.map((item) =>
          item.id === neighborhood.id ? neighborhood : item,
        ),
      }));
    }
  },

  deleteNeighborhood: async (id) => {
    try {
      await api.deleteNeighborhood(id);
      set((state) => ({
        neighborhoods: state.neighborhoods.filter((n) => n.id !== id),
      }));
    } catch {
      set((state) => ({
        neighborhoods: state.neighborhoods.filter((n) => n.id !== id),
      }));
    }
  },

  // ── Carrinho ─────────────────────────────────────────
  addToCart: (product, quantity = 1) =>
    set((state) => {
      const existing = state.cartItems.find(
        (item) => item.productId === product.id,
      );
      if (existing) {
        return {
          cartItems: state.cartItems.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  totalPrice: money(
                    (item.quantity + quantity) * item.unitPrice,
                  ),
                }
              : item,
          ),
        };
      }
      return {
        cartItems: [
          ...state.cartItems,
          {
            productId: product.id,
            productName: product.name,
            quantity,
            unitPrice: product.price,
            totalPrice: money(product.price * quantity),
          },
        ],
      };
    }),

  updateCartQuantity: (productId, quantity) =>
    set((state) => ({
      cartItems:
        quantity <= 0
          ? state.cartItems.filter((item) => item.productId !== productId)
          : state.cartItems.map((item) =>
              item.productId === productId
                ? {
                    ...item,
                    quantity,
                    totalPrice: money(item.unitPrice * quantity),
                  }
                : item,
            ),
    })),

  removeFromCart: (productId) =>
    set((state) => ({
      cartItems: state.cartItems.filter((item) => item.productId !== productId),
    })),

  clearCart: () => set({ cartItems: [] }),

  // ── Pedidos ───────────────────────────────────────────
  placeOrder: async (payload, tenantId = 1) => {
    const cartItems = get().cartItems;
    if (!cartItems.length) return null;

    try {
      const order = await api.createOrder(cartItems, payload, tenantId);
      set((state) => ({
        orders: [order, ...state.orders],
        cartItems: [],
      }));
      return order;
    } catch {
      // fallback local
      const subtotal = money(
        cartItems.reduce((sum, item) => sum + item.totalPrice, 0),
      );
      const deliveryFee = payload.addressNeighborhood.deliveryFee;
      const order: Order = {
        id: nextId(),
        orderNumber: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        addressStreet: payload.addressStreet,
        addressNumber: payload.addressNumber,
        addressNeighborhood: payload.addressNeighborhood.name,
        addressComplement: payload.addressComplement,
        addressReference: payload.addressReference,
        paymentMethod: payload.paymentMethod,
        changeFor: payload.changeFor,
        subtotal,
        deliveryFee,
        total: money(subtotal + deliveryFee),
        status:
          payload.addressNeighborhood.status === 'consult'
            ? 'Aguardando análise'
            : 'Novo',
        items: cartItems,
        tenantId,
        createdAt: Date.now(),
      };
      set((state) => ({
        orders: [order, ...state.orders],
        cartItems: [],
      }));
      return order;
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      await api.updateOrderStatus(id, status);
    } catch {
      // silent
    }
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === id ? { ...order, status } : order,
      ),
    }));
  },
}));

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(value);
