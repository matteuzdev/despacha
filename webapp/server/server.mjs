import 'dotenv/config';
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(root, 'data');
const dataFile = path.join(dataDir, 'db.json');
const port = Number(process.env.PORT || 3333);

// ── Password Hashing (scrypt — sem dependências) ─────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const parts = stored.split(':');
  // Fallback para senhas em texto puro (migração)
  if (parts.length === 1) return password === stored;
  const [salt, hash] = parts;
  const verify = crypto.scryptSync(password, salt, 64).toString('hex');
  // timingSafeEqual previne timing attacks
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verify));
}

// ── Estado Inicial ───────────────────────────────────────
const seedTime = Date.now();
const seedUsers = [
  { id: 1, name: 'Hianto CEO', email: 'hianto@despacha.com', passwordHash: hashPassword('Mateus32**'), role: 'superAdmin', tenantId: null, isFirstLogin: false },
  { id: 2, name: 'João da Silva', email: 'lojista@despacha.com', passwordHash: hashPassword('lojista123'), role: 'admin', tenantId: 1, isFirstLogin: false },
  { id: 3, name: 'Entregador Zé', email: 'entregador@despacha.com', passwordHash: hashPassword('entrega123'), role: 'delivery', tenantId: 1, isFirstLogin: false },
];

const seedState = {
  users: seedUsers,
  tenants: [
    { id: 1, name: 'Depósito do João', plan: 'PRO', status: 'Ativo', ownerEmail: 'joao@exemplo.com', businessName: 'Depósito do João Gás & Água', address: 'Rua Principal, 123', colorHex: '#ff5722', secondaryColorHex: '#00b4ff', createdAt: seedTime },
    { id: 2, name: 'Gás Rápido Centro', plan: 'FREE', status: 'Ativo', ownerEmail: 'gas@exemplo.com', businessName: 'Gás Rápido', address: 'Av. Américas, 900', colorHex: '#2196f3', secondaryColorHex: '#ff8a00', createdAt: seedTime },
  ],
  products: [
    { id: 1, name: 'Botijão P13 Cheio', description: 'Gás de cozinha 13kg com casco incluso.', price: 110, category: 'Gás', imageUrl: '', isAvailable: true, isFavorite: false, isOrderBump: false, tenantId: 1 },
    { id: 2, name: 'Botijão P13 Troca', description: 'Recarga para quem já tem o casco vazio.', price: 85, category: 'Gás', imageUrl: '', isAvailable: true, isFavorite: true, isOrderBump: false, tenantId: 1 },
    { id: 3, name: 'Galão de Água 20L', description: 'Água mineral retornável geladinha.', price: 14, category: 'Água', imageUrl: '', isAvailable: true, isFavorite: false, isOrderBump: true, tenantId: 1 },
    { id: 4, name: 'Registro de Gás', description: 'Acessório de segurança para reposição rápida.', price: 29.9, category: 'Acessórios', imageUrl: '', isAvailable: true, isFavorite: false, isOrderBump: true, tenantId: 1 },
  ],
  neighborhoods: [
    { id: 1, name: 'Centro', deliveryFee: 0, status: 'available', tenantId: 1 },
    { id: 2, name: 'Aldeota', deliveryFee: 5, status: 'available', tenantId: 1 },
    { id: 3, name: 'Messejana', deliveryFee: 8, status: 'consult', tenantId: 1 },
  ],
  orders: [
    { id: 1, orderNumber: 'REQ-4821', customerName: 'Maria', customerPhone: '(85) 99999-0000', addressStreet: 'Rua das Flores', addressNumber: '45', addressNeighborhood: 'Centro', addressComplement: '', addressReference: 'Próximo à farmácia', paymentMethod: 'Pix', changeFor: 0, subtotal: 85, deliveryFee: 0, total: 85, status: 'Novo', tenantId: 1, createdAt: seedTime, items: [{ productId: 2, productName: 'Botijão P13 Troca', quantity: 1, unitPrice: 85, totalPrice: 85 }] },
  ],
  subscriptions: [{ id: 1, tenantId: 1, plan: 'PRO', status: 'active', caktoPurchaseId: null, createdAt: seedTime, updatedAt: seedTime }],
};

// ── Helpers ──────────────────────────────────────────────
const nextId = () => Date.now() + Math.floor(Math.random() * 1000);
const money = (value) => Math.round(value * 100) / 100;

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true });
  try { await fs.access(dataFile); }
  catch { await writeState(seedState); }
}

async function readState() {
  await ensureDataFile();
  return JSON.parse(await fsp.readFile(dataFile, 'utf8'));
}

async function writeState(state) {
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.writeFile(dataFile, `${JSON.stringify(state, null, 2)}\n`);
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function send(response, status, payload) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  response.end(JSON.stringify(payload));
}

function notFound(response) { send(response, 404, { error: 'Not found' }); }

function routeParam(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null;
  const value = pathname.slice(prefix.length);
  return value ? Number(value.split('/')[0]) : null;
}

// Strips password/hash before sending to client
function stripSensitive(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

// ── Request Handler ──────────────────────────────────────
async function handleRequest(request, response) {
  if (request.method === 'OPTIONS') {
    send(response, 204, {});
    return;
  }

  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
    const pathname = url.pathname;
    const state = await readState();

    // Health
    if (request.method === 'GET' && pathname === '/api/health') {
      send(response, 200, { ok: true });
      return;
    }

    // Get full state (for hydrate)
    if (request.method === 'GET' && pathname === '/api/state') {
      send(response, 200, {
        users: state.users.map(stripSensitive),
        tenants: state.tenants,
        products: state.products,
        neighborhoods: state.neighborhoods,
        orders: state.orders,
      });
      return;
    }

    // ── AUTH ──────────────────────────────────────────

    // LOGIN: verifica senha com hash, retorna user sem senha
    if (request.method === 'POST' && pathname === '/api/auth/login') {
      const { email, password } = await readBody(request);
      const user = state.users.find((item) => item.email === email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        send(response, 401, { error: 'Email ou senha inválidos' });
        return;
      }
      send(response, 200, { user: stripSensitive(user) });
      return;
    }

    // REGISTER: cria tenant + user em uma chamada só
    if (request.method === 'POST' && pathname === '/api/auth/register') {
      const { name, email, password } = await readBody(request);
      if (!name || !email || !password) {
        send(response, 400, { error: 'Nome, email e senha são obrigatórios' });
        return;
      }
      // Verifica se email já existe
      if (state.users.some((u) => u.email === email)) {
        send(response, 409, { error: 'Este email já está cadastrado' });
        return;
      }

      const tenantId = nextId();
      const userId = nextId();
      const now = Date.now();

      const tenant = {
        id: tenantId,
        name,
        plan: 'FREE',
        status: 'Ativo',
        ownerEmail: email,
        businessName: name,
        address: '',
        colorHex: '#ff5722',
        secondaryColorHex: '#00b4ff',
        createdAt: now,
      };

      const user = {
        id: userId,
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'admin',
        tenantId,
        isFirstLogin: true,
      };

      state.tenants.push(tenant);
      state.users.push(user);
      await writeState(state);

      send(response, 201, { user: stripSensitive(user), tenant });
      return;
    }

    // SUPERADMIN: cria tenant + user com senha
    if (request.method === 'POST' && pathname === '/api/superadmin/tenant-user') {
      const { name, email, password, plan = 'PRO', status = 'Ativo' } = await readBody(request);
      if (!name || !email || !password) {
        send(response, 400, { error: 'Nome, email e senha são obrigatórios' });
        return;
      }

      const tenantId = nextId();
      const userId = nextId();
      const now = Date.now();

      const tenant = {
        id: tenantId,
        name,
        plan,
        status,
        ownerEmail: email,
        businessName: name,
        address: 'Endereço não informado',
        colorHex: '#ff5722',
        secondaryColorHex: '#00b4ff',
        createdAt: now,
      };

      const user = {
        id: userId,
        name,
        email,
        passwordHash: hashPassword(password),
        role: 'admin',
        tenantId,
        isFirstLogin: true,
      };

      state.tenants.push(tenant);
      state.users.push(user);
      await writeState(state);

      send(response, 201, { user: stripSensitive(user), tenant });
      return;
    }

    // ── USERS ─────────────────────────────────────────
    if (request.method === 'POST' && pathname === '/api/users') {
      const body = await readBody(request);
      const hashedBody = { ...body, passwordHash: body.passwordHash?.includes(':') ? body.passwordHash : hashPassword(body.passwordHash || '123456') };
      const user = { ...hashedBody, id: body.id ?? nextId() };
      state.users.push(user);
      await writeState(state);
      send(response, 201, stripSensitive(user));
      return;
    }

    // ── TENANTS ───────────────────────────────────────
    if (request.method === 'POST' && pathname === '/api/tenants') {
      const body = await readBody(request);
      const tenant = { ...body, id: body.id ?? nextId(), createdAt: body.createdAt ?? Date.now() };
      state.tenants.push(tenant);
      await writeState(state);
      send(response, 201, tenant);
      return;
    }

    const tenantIdParam = routeParam(pathname, '/api/tenants/');
    if (tenantIdParam && request.method === 'PUT') {
      const tenant = await readBody(request);
      state.tenants = state.tenants.map((item) => (item.id === tenantIdParam ? { ...tenant, id: tenantIdParam } : item));
      await writeState(state);
      send(response, 200, state.tenants.find((item) => item.id === tenantIdParam));
      return;
    }
    if (tenantIdParam && request.method === 'DELETE') {
      // Remove tenant + seus produtos, bairros, pedidos e usuários vinculados
      state.tenants = state.tenants.filter((item) => item.id !== tenantIdParam);
      state.products = state.products.filter((item) => item.tenantId !== tenantIdParam);
      state.neighborhoods = state.neighborhoods.filter((item) => item.tenantId !== tenantIdParam);
      state.orders = state.orders.filter((item) => item.tenantId !== tenantIdParam);
      state.users = state.users.filter((item) => item.tenantId !== tenantIdParam);
      await writeState(state);
      send(response, 200, { ok: true });
      return;
    }

    // ── PRODUCTS ──────────────────────────────────────
    if (request.method === 'POST' && pathname === '/api/products') {
      const body = await readBody(request);
      const product = { ...body, id: body.id ?? nextId() };
      state.products.push(product);
      await writeState(state);
      send(response, 201, product);
      return;
    }

    const productIdParam = routeParam(pathname, '/api/products/');
    if (productIdParam && request.method === 'PUT') {
      const product = await readBody(request);
      state.products = state.products.map((item) => (item.id === productIdParam ? { ...product, id: productIdParam } : item));
      await writeState(state);
      send(response, 200, state.products.find((item) => item.id === productIdParam));
      return;
    }
    if (productIdParam && request.method === 'DELETE') {
      state.products = state.products.filter((item) => item.id !== productIdParam);
      await writeState(state);
      send(response, 200, { ok: true });
      return;
    }

    // ── NEIGHBORHOODS ─────────────────────────────────
    if (request.method === 'POST' && pathname === '/api/neighborhoods') {
      const body = await readBody(request);
      const neighborhood = { ...body, id: body.id ?? nextId() };
      state.neighborhoods.push(neighborhood);
      await writeState(state);
      send(response, 201, neighborhood);
      return;
    }

    const neighborhoodIdParam = routeParam(pathname, '/api/neighborhoods/');
    if (neighborhoodIdParam && request.method === 'PUT') {
      const neighborhood = await readBody(request);
      state.neighborhoods = state.neighborhoods.map((item) => (item.id === neighborhoodIdParam ? { ...neighborhood, id: neighborhoodIdParam } : item));
      await writeState(state);
      send(response, 200, state.neighborhoods.find((item) => item.id === neighborhoodIdParam));
      return;
    }
    if (neighborhoodIdParam && request.method === 'DELETE') {
      state.neighborhoods = state.neighborhoods.filter((item) => item.id !== neighborhoodIdParam);
      await writeState(state);
      send(response, 200, { ok: true });
      return;
    }

    // ── ORDERS ────────────────────────────────────────
    if (request.method === 'POST' && pathname === '/api/orders') {
      const { cartItems, payload, tenantId: requestedTenantId = 1 } = await readBody(request);
      const subtotal = money(cartItems.reduce((sum, item) => sum + item.totalPrice, 0));
      const order = {
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
        deliveryFee: payload.addressNeighborhood.deliveryFee,
        total: money(subtotal + payload.addressNeighborhood.deliveryFee),
        status: payload.addressNeighborhood.status === 'consult' ? 'Aguardando análise' : 'Novo',
        items: cartItems,
        tenantId: requestedTenantId,
        createdAt: Date.now(),
      };
      state.orders = [order, ...state.orders];
      await writeState(state);
      send(response, 201, order);
      return;
    }

    const statusMatch = pathname.match(/^\/api\/orders\/(\d+)\/status$/);
    if (statusMatch && request.method === 'PATCH') {
      const id = Number(statusMatch[1]);
      const { status } = await readBody(request);
      state.orders = state.orders.map((order) => (order.id === id ? { ...order, status } : order));
      await writeState(state);
      send(response, 200, state.orders.find((order) => order.id === id));
      return;
    }

    // ── Cakto Webhook ──────────────────────────────────
    if (request.method === 'POST' && pathname === '/api/webhooks/cakto') {
      const body = await readBody(request);
      if (!state.subscriptions) state.subscriptions = [];
      if (!state.paymentEvents) state.paymentEvents = [];

      const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = request.headers['x-webhook-signature'] ?? request.headers['x-cakto-signature'] ?? '';
        if (!signature) { send(response, 401, { error: 'Missing webhook signature' }); return; }
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(webhookSecret))) {
          send(response, 401, { error: 'Invalid webhook signature' }); return;
        }
      }

      const event = body.event ?? body.type ?? '';
      const purchaseId = body.purchase?.id ?? body.id ?? null;
      const rawMetadata = body.purchase?.metadata ?? body.metadata ?? body.data?.metadata ?? {};
      const tenantId = Number(rawMetadata.tenantId) || Number(body.tenantId) || null;
      const plan = rawMetadata.plan || body.plan || 'PRO';

      state.paymentEvents.push({ id: nextId(), event, purchaseId, tenantId, raw: body, receivedAt: Date.now() });

      if (event === 'purchase_approved' || event === 'subscription_created') {
        if (!tenantId) { send(response, 200, { received: true, warning: 'missing tenantId' }); return; }
        const existingIdx = state.subscriptions.findIndex((s) => s.tenantId === tenantId);
        if (existingIdx >= 0) {
          state.subscriptions[existingIdx] = { ...state.subscriptions[existingIdx], status: 'active', plan, caktoPurchaseId: purchaseId, updatedAt: Date.now() };
        } else {
          state.subscriptions.push({ id: nextId(), tenantId, plan, status: 'active', caktoPurchaseId: purchaseId, createdAt: Date.now(), updatedAt: Date.now() });
        }
        state.tenants = state.tenants.map((t) => t.id === tenantId ? { ...t, plan, status: 'Ativo' } : t);
        await writeState(state);
        send(response, 200, { received: true, activated: true });
        return;
      }

      if (event === 'purchase_refused' || event === 'refund') { send(response, 200, { received: true }); return; }

      if (event === 'subscription_canceled' || event === 'chargeback') {
        if (tenantId) {
          state.subscriptions = state.subscriptions.map((s) => s.tenantId === tenantId ? { ...s, status: 'canceled', updatedAt: Date.now() } : s);
          state.tenants = state.tenants.map((t) => t.id === tenantId ? { ...t, status: 'Cancelado' } : t);
          await writeState(state);
        }
        send(response, 200, { received: true }); return;
      }

      send(response, 200, { received: true });
      return;
    }

    // Subscription Status
    if (request.method === 'GET' && pathname.startsWith('/api/subscription/')) {
      if (!state.subscriptions) state.subscriptions = [];
      const userId = Number(pathname.split('/api/subscription/')[1]) || null;
      if (!userId) { send(response, 400, { error: 'userId is required' }); return; }
      const user = state.users.find((u) => u.id === userId);
      if (!user) { send(response, 404, { error: 'User not found' }); return; }
      const subscription = state.subscriptions.find((s) => s.tenantId === user.tenantId) ?? null;
      send(response, 200, { subscription, tenant: state.tenants.find((t) => t.id === user.tenantId) ?? null });
      return;
    }

    // ── Serve Frontend (SPA) ───────────────────────────
    // Se não for rota de API, serve o index.html do build
    await serveFrontend(request, response);
    return;
  } catch (error) {
    send(response, 500, { error: error instanceof Error ? error.message : 'Internal server error' });
  }
}

// ── Static file serving for SPA ──────────────────────────
const distDir = path.join(root, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

async function serveFrontend(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405);
    response.end();
    return;
  }

  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
  let filePath = path.join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);

  // Se o arquivo não existe, serve index.html (SPA fallback)
  try {
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = await fsp.readFile(filePath);

    response.writeHead(200, {
      'content-type': contentType,
      'content-length': content.length,
      'cache-control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    response.end(content);
  } catch {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

http.createServer(handleRequest).listen(port, () => {
  console.log(`Despacha API + Frontend listening on http://127.0.0.1:${port}`);
});
