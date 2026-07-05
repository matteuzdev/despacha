import type { CheckoutPayload, Neighborhood, Order, OrderStatus, Product, Tenant, User } from './db';

export interface BackendState {
  users: User[];
  tenants: Tenant[];
  products: Product[];
  neighborhoods: Neighborhood[];
  orders: Order[];
}

const headers = { 'content-type': 'application/json' };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? response.statusText);
  }
  return response.json() as Promise<T>;
}

function post<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'POST', headers, body: JSON.stringify(body) });
}

function put<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PUT', headers, body: JSON.stringify(body) });
}

function patch<T>(path: string, body: unknown) {
  return request<T>(path, { method: 'PATCH', headers, body: JSON.stringify(body) });
}

function remove(path: string) {
  return request<{ ok: true }>(path, { method: 'DELETE' });
}

export const api = {
  getState: () => request<BackendState>('/api/state'),
  login: (email: string, password: string) => post<{ user: User }>('/api/auth/login', { email, password }),
  register: (name: string, email: string, password: string) =>
    post<{ user: User; tenant: Tenant }>('/api/auth/register', { name, email, password }),
  superAdminCreateTenantUser: (name: string, email: string, password: string, plan: string) =>
    post<{ user: User; tenant: Tenant }>('/api/superadmin/tenant-user', { name, email, password, plan }),
  createUser: (user: Partial<User> & { name: string; email: string; passwordHash: string }) =>
    post<User>('/api/users', user),
  createTenant: (tenant: Omit<Tenant, 'id' | 'createdAt'>) =>
    post<Tenant>('/api/tenants', tenant),
  updateTenant: (tenant: Tenant) =>
    put<Tenant>(`/api/tenants/${tenant.id}`, tenant),
  deleteTenant: (id: number) =>
    remove(`/api/tenants/${id}`),
  createProduct: (product: Omit<Product, 'id'>) =>
    post<Product>('/api/products', product),
  updateProduct: (product: Product) =>
    put<Product>(`/api/products/${product.id}`, product),
  deleteProduct: (id: number) =>
    remove(`/api/products/${id}`),
  createNeighborhood: (neighborhood: Omit<Neighborhood, 'id'>) =>
    post<Neighborhood>('/api/neighborhoods', neighborhood),
  updateNeighborhood: (neighborhood: Neighborhood) =>
    put<Neighborhood>(`/api/neighborhoods/${neighborhood.id}`, neighborhood),
  deleteNeighborhood: (id: number) =>
    remove(`/api/neighborhoods/${id}`),
  createOrder: (cartItems: Order['items'], payload: CheckoutPayload, tenantId: number) =>
    post<Order>('/api/orders', { cartItems, payload, tenantId }),
  updateOrderStatus: (id: number, status: OrderStatus) =>
    patch<Order>(`/api/orders/${id}/status`, { status }),
};
