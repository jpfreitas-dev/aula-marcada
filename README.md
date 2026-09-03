# Aula Marcada

Aplicação para o professor gerenciar alunos, agenda de aulas, presença, reposições e financeiro.

## Documentação

| Recurso                           | Caminho                                 |
| --------------------------------- | --------------------------------------- |
| Regras de negócio e fluxos        | `.cursor/docs/overview.md`              |
| Arquitetura e stack               | `.cursor/docs/software-architecture.md` |
| Plano de implementação            | `.cursor/docs/implementation-plan.md`   |
| Design system (referência visual) | `docs/design/DESIGN_SYSTEM.md`          |
| Telas exportadas (Stitch)         | `docs/design/screens/`                  |
| Tokens e preview do design system | `docs/design/design-system/`            |

## Design system (referência)

Artefatos em `docs/design/design-system/`:

- `tokens.json` — tokens estruturados (cores, tipografia, espaçamento)
- `css-variables.css` — variáveis CSS para HTML estático e Tailwind
- `preview.html` — preview visual dos componentes

## Desenvolvimento local

```bash
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
npm install
npm run docker:up    # PostgreSQL + backend + frontend
npm run dev:backend  # opcional se não usar Docker para o backend
npm run dev:frontend # opcional se não usar Docker para o frontend
```

### Docker / PostgreSQL

O Postgres do projeto usa usuário `app`, senha `app` e database `app` (ver `.env.example`).

Se o log mostrar `role "app" does not exist`, o volume `postgres_data` foi criado com credenciais antigas. Recrie o ambiente:

```bash
npm run docker:down
docker compose down -v
npm run docker:up
```

O `-v` apaga o volume local do Postgres. Use apenas em desenvolvimento (sem dados importantes).

## Produção (fase atual)

Hospedagem prevista **sem VPS e sem Docker de produção**:

| Camada     | Serviço        | Papel                        |
| ---------- | -------------- | ---------------------------- |
| Frontend   | Vercel         | SPA Vite (`apps/frontend`)   |
| API        | Render         | Express (`apps/backend`)     |
| Banco      | Neon           | PostgreSQL                   |
| Keep-alive | Cron no Render | `GET /health` (rota pública) |

Checklist completo: `.cursor/docs/implementation-plan.md`.

### 1. Neon (banco)

1. Crie um projeto PostgreSQL no [Neon](https://neon.tech).
2. Copie a connection string **pooled** (com `?sslmode=require`) para `DATABASE_URL`.
3. Se `prisma migrate deploy` falhar no pooler, rode as migrações uma vez com a URL **direct** e mantenha a pooled na API.

Não rode `prisma:seed` em produção.

### 2. Render (API)

1. Conecte o repositório e use o blueprint `render.yaml`, ou crie um Web Service Node manualmente.
2. **Build command:** `npm install && npm run build:backend`
3. **Start command:** `npm run start:backend`
4. **Health check path:** `/health`
5. Defina as variáveis:
   - `DATABASE_URL` — Neon (pooled)
   - `JWT_SECRET` — string longa e aleatória
   - `AUTH_EMAIL` / `AUTH_PASSWORD` — login do professor
   - `FRONTEND_URL` — URL da Vercel (ex.: `https://seu-app.vercel.app`)
6. O cron `aula-marcada-api-keepalive` no blueprint chama `GET /health` a cada 10 minutos.

### 3. Vercel (frontend)

1. Importe o repositório com **Root Directory** = `apps/frontend`.
2. **Build command:** `npm run build` (ou `cd ../.. && npm install && npm run build:frontend` se preferir instalar na raiz)
3. Defina `VITE_API_URL` com a URL pública do Render (sem barra no final).
4. Faça redeploy sempre que mudar `VITE_API_URL` (variável de build).
5. O `vercel.json` já reescreve rotas do React Router para `index.html`.

### 4. Cruzar URLs

Depois do primeiro deploy:

1. Copie a URL do Render → `VITE_API_URL` na Vercel → redeploy.
2. Copie a URL da Vercel → `FRONTEND_URL` no Render → restart da API.

### 5. Smoke test em produção

- Login
- Criar aluno com recorrência e ver aulas na agenda
- Agendar aula avulsa
- Marcar compareceu + pagamento
- Marcar falta e vincular reposição
- Receber pagamento no perfil
- Abrir financeiro
- Atualizar a página em `/students/:id` (não deve dar 404)

## Testes

```bash
npm run test:api    # Vitest + PostgreSQL de teste
npm run test:e2e    # Playwright (requer app rodando)
```

## Instalar como app (PWA)

No navegador compatível (Chrome/Edge no desktop ou Android):

1. Faça login normalmente.
2. Abra **Mais** na navegação inferior.
3. Toque em **Instalar aplicativo** (ou **Instalar** no cartão).

No **iPhone (Safari)**, a instalação é manual: **Compartilhar → Adicionar à Tela de Início**. A página **Mais** exibe o link **Como instalar no iPhone** com os passos.

Após instalado, o app abre em tela cheia (`standalone`) com ícone **AULA MARCADA** na tela inicial.

### Performance (notas)

- A agenda mantém o conteúdo anterior com opacidade reduzida enquanto carrega outro dia/semana.
- A API evita regenerar aulas recorrentes em listagens consecutivas (throttle de ~5 min no horizonte de 3 meses).
- A lista de alunos atualiza localmente após cadastro, sem refetch completo imediato.
