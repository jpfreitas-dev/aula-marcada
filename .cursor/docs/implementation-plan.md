# Plano de implementação — Aula Marcada

Plano operacional a partir do estado **atual** do repositório.

Este documento **não redefine** regras de negócio nem arquitetura. Fontes de verdade:

| Tipo                                | Documento                                   |
| ----------------------------------- | ------------------------------------------- |
| Produto / regras de negócio         | `.cursor/docs/overview.md`                  |
| Arquitetura / stack / convenções    | `.cursor/docs/software-architecture.md`     |
| Design visual / telas de referência | `docs/design/`                              |
| Workflow de implementação           | `.cursor/rules/implementation-workflow.mdc` |
| Workflow Git                        | `.cursor/rules/git-workfllow.mdc`           |

---

## 0. Estado atual

O produto em escopo (overview) está **implementado** e integrado: agenda, alunos, recorrências, presença, reposições, pagamentos e financeiro. Docker Compose permanece **somente para desenvolvimento local**.

| Área                       | Situação                       |
| -------------------------- | ------------------------------ |
| Frontend (Vite/React)      | Integrado à API                |
| Backend (Express + Prisma) | Casos de uso cobertos          |
| Testes de API (Vitest)     | Presentes nos fluxos críticos  |
| E2E (Playwright)           | Só shell de navegação          |
| CI                         | Ausente                        |
| Deploy de produção         | Ainda não configurado          |
| Docker em produção         | **Fora deste plano** (sem VPS) |

Branch de trabalho: `develop`. Release para uso: merge `develop` → `main` quando o checklist de go-live estiver ok.

Autenticação atual: um único login (email/senha + JWT). Não há papéis nem multi-usuário. Isso é proteção técnica da API, não uma feature de produto no overview.

---

## 1. Princípios deste plano

- **Subir o mais rápido possível** para uso real (professor).
- Hospedagem desta fase: **Vercel** (frontend), **Render** (API), **Neon** (PostgreSQL). Sem Docker de produção.
- Não implementar §37 do overview agora (Mais, modo escuro, sábado/domingo, etc.).
- Depois do go-live, evoluir em fatias pequenas a partir da seção 5.
- Não inventar comportamento fora do `overview.md`.

---

## 2. Arquitetura de produção (fase atual)

```text
Professor  →  Vercel (SPA)  →  Render (Express)  →  Neon (Postgres)
                 │                    ▲
                 │                    └── Cron no Render GET /health
                 └── VITE_API_URL aponta para a URL da API
```

| Serviço | Papel                    | Observação                                                                           |
| ------- | ------------------------ | ------------------------------------------------------------------------------------ |
| Neon    | Banco PostgreSQL         | `DATABASE_URL` pooled na API; `DIRECT_URL` direct para `migrate deploy` (Prisma CLI) |
| Render  | Web Service Node (API)   | `GET /health` já é público (sem JWT) — usar no cron                                  |
| Vercel  | Frontend estático (Vite) | `VITE_API_URL` é **build-time**                                                      |

Variáveis mínimas da API (Render):

- `DATABASE_URL` — connection string pooled do Neon (com SSL)
- `DIRECT_URL` — connection string direct do Neon (migrações no start)
- `JWT_SECRET` — string longa e aleatória
- `AUTH_EMAIL` / `AUTH_PASSWORD` — credenciais do professor
- `FRONTEND_URL` — origem do Vercel (`https://….vercel.app`; várias origens separadas por vírgula, se necessário)
- `PORT` — o Render injeta; o `server.ts` já lê `process.env.PORT`

Variáveis do frontend (Vercel):

- `VITE_API_URL` — URL pública da API no Render (sem barra no final)

Cron: job periódico (ex.: a cada 10–14 min) em `GET https://<api>/health` para reduzir cold start no plano free do Render.

---

## 3. Checklist de go-live (mínimo)

Ordem sugerida. Não bloquear o deploy por E2E, CI, Docker de produção ou features do §37.

### 3.1 Código e Git

- [ ] Commitar ou descartar alterações locais em `develop`
- [ ] Confirmar que `.env` reais **não** entram no Git (já ignorados)
- [ ] Ignorar artefatos gerados (`*.d.ts` / `.map` de `vite.config` e `playwright.config`, se ainda untracked)
- [ ] Merge `develop` → `main` quando for a release (PR)

### 3.2 Ajustes mínimos de deploy (fazer antes ou no primeiro PR de go-live)

Sem esses itens o app pode subir, mas o dia a dia no Render/Vercel fica frágil:

- [ ] Script de start da API que rode **migrações e depois o servidor**, por exemplo: `prisma migrate deploy` + `tsx src/server.ts` (Prisma CLI com `DIRECT_URL`; runtime com `DATABASE_URL` pooled)
- [ ] Garantir `prisma generate` no install/build da API
- [ ] SPA na Vercel: rewrite de rotas do React Router para `index.html` (evitar 404 em `/students/:id` no refresh)
- [ ] Confirmar CORS: `FRONTEND_URL` igual à origem HTTPS da Vercel (sem path)

- [ ] Neon: `DIRECT_URL` (direct) no Render para `migrate deploy`; `DATABASE_URL` (pooled) para a API
- [ ] Root do Render: repositório monorepo — build/start com workspace (`npm install` na raiz + scripts no `apps/backend`)

### 3.3 Neon

- [ ] Criar projeto/branch de produção
- [ ] Copiar connection string pooled para `DATABASE_URL` e direct para `DIRECT_URL`
- [ ] Rodar `prisma migrate deploy` uma vez (local com `DIRECT_URL` do Neon **ou** no start do Render)
- [ ] **Não** rodar `prisma/seed.ts` em produção a menos que queira dados de exemplo

### 3.4 Render (API)

- [ ] Web Service a partir do GitHub (`main` ou `develop`)
- [ ] Runtime Node compatível com o projeto
- [ ] Definir as env vars da seção 2
- [ ] Health check HTTP: `/health`
- [ ] Cron Job: `GET /health` em intervalo curto o bastante para o plano (ex. 10 min)
- [ ] Anotar a URL pública da API

### 3.5 Vercel (frontend)

- [ ] Projeto Vite em `apps/frontend` (ou build na raiz com `--workspace`)
- [ ] `VITE_API_URL` = URL do Render
- [ ] Redeploy depois de mudar `VITE_API_URL` (variável entra no bundle)
- [ ] Anotar a URL pública e colar em `FRONTEND_URL` no Render; redeploy da API se a URL da Vercel mudou

### 3.6 Validação manual (obrigatória para “disponibilizar para uso”)

Fazer logado, no domínio de produção:

- [ ] Login
- [ ] Criar aluno **com** recorrência e ver aulas na agenda (horizonte 3 meses)
- [ ] Agendar aula avulsa
- [ ] Marcar compareceu + pagamento
- [ ] Marcar falta e vincular reposição
- [ ] Receber pagamento no perfil
- [ ] Abrir financeiro (semana/mês)
- [ ] Refresh em uma rota profunda (`/students/:id`) — deve abrir a página, não 404

Se isso passar, o app **pode ser usado**. O restante é evolução.

---

## 4. Ordem de execução imediata

```text
1. PR mínimo de deploy (migrate no start + SPA rewrite + scripts)
2. Neon → migrate
3. Render API + cron /health
4. Vercel frontend
5. Cruzar FRONTEND_URL ↔ VITE_API_URL
6. Smoke manual da seção 3.6
7. Entregar a URL + email/senha ao professor
```

Não esperar: E2E completo, GitHub Actions, Dockerfile de produção, domínio customizado, observabilidade.

---

## 5. Depois do go-live — deixar o projeto mais completo

Itens abaixo **não** bloqueiam o primeiro uso. Prioridade sugerida.

### 5.1 Operação e qualidade (recomendado cedo)

| #   | Item                                                                       | Por quê                                      |
| --- | -------------------------------------------------------------------------- | -------------------------------------------- |
| 1   | GitHub Actions: lint + `test:api` em PR                                    | Evitar quebrar produção no próximo merge     |
| 2   | E2E dos fluxos do smoke (Playwright contra staging ou preview)             | O plano antigo (Fase F) ainda está em aberto |
| 3   | README: como rodar local + como está hospedado + env vars                  | Quem for manter o projeto                    |
| 4   | Domínio próprio (opcional) nas duas pontas + atualizar CORS/`VITE_API_URL` | URL estável para o professor                 |
| 5   | Backup/export do Neon                                                      | Dados reais passam a importar                |

### 5.2 Produto já definido, ainda incompleto na UI

Conforme overview §37 — **não implementar agora**, mas candidatos naturais depois:

| Item                                 | Nota                                                     |
| ------------------------------------ | -------------------------------------------------------- |
| Conteúdo da tela **Mais**            | Hoje é placeholder; precisa de spec antes de implementar |
| Modo escuro                          | Fora do fluxo atual                                      |
| Extra no botão “+” além de agendar   | Fora do fluxo atual                                      |
| Edição visual detalhada do histórico | Fora do fluxo atual                                      |
| Pagamento misto num único formulário | Fora do fluxo atual                                      |
| Agenda em sábado/domingo             | Explicitamente fora                                      |

### 5.3 Técnico (só com necessidade concreta)

Não adicionar por padrão (architecture §11): filas, cache, refresh token, e-mail, upload, multi-tenant, papéis.

Quando o uso real exigir:

- logs/erros em produção (sem vazar stack do Prisma);
- rate limit / secrets rotacionados;
- job dedicado para horizonte de recorrência (hoje a geração extra ocorre ao **abrir a agenda**).

### 5.4 Ordem sugerida pós-go-live

```text
main em produção
  ├── chore/deploy-docs-and-ci     (README + Actions)
  ├── test/e2e-critical-flows      (Playwright dos fluxos reais)
  └── (depois) features do §37 só com spec no overview
```

---

## 6. Mapa de telas (referência)

Referências em `docs/design/screens/` alinhadas ao `overview.md`. Em conflito, **prevalece o overview**.

| Tela / fluxo (overview)                | Artefato Stitch                                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Agenda — visão diária (§1–2)           | `visao-diaria-pago-e-adicionar-aula.html`                                                             |
| Agenda — visão semanal (§1)            | `visao-semanal.html`                                                                                  |
| Agendar aula (§3–4)                    | `agendar-aula-ajuste-de-proporcao-e-margens.html`                                                     |
| Detalhes da aula (§7–13)               | `detalhes-da-aula-bottom-sheet-lista-classica.html`                                                   |
| Detalhes — reposição informativa (§12) | `detalhes-da-aula-reposicao-informativo.html`                                                         |
| Vincular reposição (§5–6, §15)         | `vincular-reposicao-com-ajuste-de-horario.html`, `vincular-reposicao-alerta-de-horario-pendente.html` |
| Lista de alunos (§18, §21)             | `lista-de-alunos-compacta.html`                                                                       |
| Novo aluno (§19–20)                    | `novo-aluno-refinado-linhado.html`                                                                    |
| Perfil do aluno (§22–28)               | `perfil-do-aluno-historico-de-aulas.html`                                                             |
| Receber pagamento (§25)                | `perfil-do-aluno-modal-receber-pagamento.html`                                                        |
| Financeiro — mês (§29–33)              | `dashboard-financeiro-refinado-com-navegacao-temporal.html`                                           |
| Financeiro — semana                    | `dashboard-financeiro-semana-refinado-v1.html`                                                        |
| Financeiro — ano                       | `dashboard-financeiro-visao-anual-completa-12-meses.html`                                             |

---

## 7. Git nesta fase

- Trabalho em `feature/*` ou `chore/*` → PR → `develop`.
- Produção: PR `develop` → `main` (Vercel/Render apontando para `main` simplifica).
- Commits: Conventional Commits.
- Não commitar direto em `main`.

---

## 8. Próximo passo imediato

O código de go-live (migrate no start, `render.yaml`, `vercel.json`, guia no README) já está em `develop`.

1. Abrir PR `develop` → `main` e mergear a primeira release.
2. Seguir o checklist da seção 3 (Neon → Render → cron → Vercel → smoke).
3. Só então CI/E2E/README completo (seção 5.1).
