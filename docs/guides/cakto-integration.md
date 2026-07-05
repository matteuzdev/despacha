# Integracao Cakto

## Decisao inicial

Usar o checkout hospedado da Cakto no primeiro deploy. O frontend recebe apenas o link publico `https://pay.cakto.com.br/{id_da_oferta}`. Credenciais OAuth, criacao de Pix transacional e webhooks ficam no backend Python.

Esse caminho evita expor segredo no navegador e reduz a complexidade de seguranca com cartao.

## Configuracao na Cakto

1. Acesse o painel da Cakto e gere `client_id` e `client_secret` em Integracoes > Cakto API.
2. Crie um produto para cada plano do Despacha.
3. Ao criar o produto, a Cakto gera uma oferta, um checkout e um link de pagamento.
4. Copie os links para o `.env` do webapp:

```env
VITE_CAKTO_CHECKOUT_PRO=https://pay.cakto.com.br/muijq56_958072
VITE_CAKTO_CHECKOUT_TRIANNUAL=https://pay.cakto.com.br/38cqwwk
VITE_CAKTO_CHECKOUT_ANNUAL=https://pay.cakto.com.br/owgba8w
VITE_CAKTO_CHECKOUT_VITALICIA=https://pay.cakto.com.br/vzev5xn
VITE_CAKTO_CHECKOUT_FREE=
```

## Backend Python recomendado

Stack para VPS:

- FastAPI para API HTTP.
- SQLAlchemy + Alembic para persistencia e migracoes.
- SQLite no comeco, Postgres quando tiver uso real.
- Uvicorn/Gunicorn atras de Nginx.
- HTTPS com Certbot quando houver dominio.

Variaveis de ambiente:

```env
CAKTO_CLIENT_ID=
CAKTO_CLIENT_SECRET=
CAKTO_WEBHOOK_SECRET=
CAKTO_API_BASE_URL=https://api.cakto.com.br
DATABASE_URL=sqlite:///./despacha.db
APP_PUBLIC_URL=https://seu-dominio
```

## OAuth da Cakto

O backend deve chamar:

```http
POST https://api.cakto.com.br/public_api/token/
Content-Type: application/x-www-form-urlencoded
```

Campos:

- `client_id`
- `client_secret`

O retorno traz `access_token`, `expires_in`, `token_type` e `scope`. Cacheie o token no backend ate perto do vencimento.

## Webhooks

Criar um webhook apontando para:

```text
https://seu-dominio/api/webhooks/cakto
```

Eventos iniciais:

- `purchase_approved`
- `purchase_refused`
- `pix_gerado`
- `subscription_created`
- `subscription_canceled`
- `refund`
- `chargeback`

O endpoint deve responder rapido, em ate 5 segundos, salvar o evento bruto e atualizar o status da assinatura do lojista.

## Pix transacional

So implementar Pix direto pela API quando o checkout hospedado estiver validado. Para criar pagamento Pix, a Cakto exige token Bearer, `X-Idempotency-Key`, dados do cliente, itens, `productId`, `offerId`, `paymentMethod: "pix"` e metadados.

No Despacha, os metadados devem carregar pelo menos:

- `tenantId`
- `plan`
- `userId`
- `orderId` ou `subscriptionIntentId`

## Mapeamento de assinatura

Tabela minima no banco:

- `tenants`
- `users`
- `subscriptions`
- `payment_events`

Fluxo:

1. Usuario escolhe plano no frontend.
2. Frontend abre checkout Cakto.
3. Cakto envia webhook de compra aprovada.
4. Backend valida o evento e ativa o plano do tenant.
5. Frontend mostra status ativo apos login ou refresh.
