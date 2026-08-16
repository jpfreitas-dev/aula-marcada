# Plano de implementação — Aula Marcada

Plano operacional para construir a aplicação na ordem acordada:

1. organizar a raiz e estabelecer o fluxo Git;
2. configurar os ambientes base (monorepo, frontend e backend);
3. prototipar o frontend com dados mockados a partir de `docs/design`;
4. implementar o backend e integrar.

Este documento **não redefine** regras de negócio nem arquitetura. Fontes de verdade:

| Tipo                                | Documento                                   |
| ----------------------------------- | ------------------------------------------- |
| Produto / regras de negócio         | `.cursor/docs/overview.md`                  |
| Arquitetura / stack / convenções    | `.cursor/docs/software-architecture.md`     |
| Design visual / telas de referência | `docs/design/`                              |
| Workflow de implementação           | `.cursor/rules/implementation-workflow.mdc` |
| Workflow Git                        | `.cursor/rules/git-workfllow.mdc`           |

---

## 0. Estado atual do repositório

- Branch atual: `chore/repo-tooling` (Fase B concluída nesta branch).
- `main` e `develop` existem; Fase B aguarda merge local `chore/repo-tooling` → `develop`.
- Conteúdo existente:
  - `.cursor/` — docs de produto/arquitetura (`overview.md`, `software-architecture.md`) e rules;
  - `docs/design/` — export Google Stitch (telas HTML, JSON raw, design system parcial).
- Já realizado fora do Git:
  - `software-architecture.md` com nome correto (não há `software-arquiteture.md`);
  - `docs/design/design-system/` com `preview.html`, `tokens.json` e `css-variables.css`.
- Ainda **não existem** `apps/`, `package.json`, Docker, nem código de aplicação.

---

## 1. Princípios do plano

- Ordem macro: **estrutura → ambientes → UI mockada → backend → integração → E2E**.
- Cada entrega entra em `develop` via Pull Request a partir de `feature/*` ou `chore/*`.
- Não inventar comportamento fora do `overview.md`.
- Não implementar itens do §36 (fora de escopo): modo escuro, conteúdo de **Mais**, estorno para saldo, sábado/domingo, pagamento misto num único formulário, etc.
- Em caso de conflito entre layout Stitch e `overview.md`, **prevalece o overview**; o layout é corrigido na implementação.
- Código, identificadores e commits em inglês; textos de UI em português.

---

## 2. Mapa de telas (design → produto)

Referências em `docs/design/screens/` alinhadas ao `overview.md`:

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

Design system: `docs/design/DESIGN_SYSTEM.md`, `DESIGN.md`, `docs/design/design-system/preview.html`.

### Inconsistências conhecidas (corrigir no frontend mockado)

| #   | No design / Stitch                                   | Correção conforme overview                                     |
| --- | ---------------------------------------------------- | -------------------------------------------------------------- |
| 1   | Badge com “Pago com Pix/Dinheiro”                    | Hierarquia do §2; forma de pagamento **não** é badge principal |
| 2   | Agendar como reposição sem ação “Vincular reposição” | Adicionar botão e fluxo §4                                     |
| 3   | Modal de vinculação com troca de aluno               | Remover seletor; aluno vem do contexto (§5)                    |
| 4   | Ícones individuais de edição em configurações        | Um único botão editar no card (§26)                            |
| 5   | Possíveis badges/estados fora da hierarquia          | Seguir §2 e §35                                                |
| 6   | Agenda podendo sugerir fim de semana                 | Apenas segunda a sexta (§1, §35.28)                            |
| 7   | Conteúdo do botão **Mais**                           | Item de navegação pode existir; conteúdo fora de escopo (§36)  |

---

## 3. Estratégia Git (branches e PRs)

### 3.1 Bootstrap (exceção única)

Com repositório sem commits:

1. Organizar a raiz (Fase A).
2. Fazer o **primeiro commit em `main`** (único commit direto permitido no bootstrap).
3. Criar `develop` a partir de `main`.
4. A partir daí: **nunca** commitar direto em `main` ou `develop`; sempre `feature/*` ou `chore/*` → PR → `develop`.
5. Produção: PR `develop` → `main` quando houver release.

### 3.2 Convenções

- Nomes: `feature/<area>-<assunto>` ou `chore/<assunto>` (inglês, kebab-case).
- Commits: Conventional Commits (`feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `build`, `ci`).
- Um PR = uma unidade lógica.
- Escopos sugeridos: `repo`, `tooling`, `frontend`, `backend`, `students`, `classes`, `attendance`, `makeups`, `payments`, `financial`, `docker`.

### 3.3 Ordem das branches

```text
main  ──(commit bootstrap)──► develop
                                 │
                                 ├── chore/repo-tooling
                                 ├── feature/frontend-shell
                                 ├── feature/frontend-agenda-mock
                                 ├── feature/frontend-students-mock
                                 ├── feature/frontend-financial-mock
                                 ├── feature/backend-foundation
                                 ├── feature/backend-students
                                 ├── feature/backend-classes
                                 ├── feature/backend-attendance-makeups
                                 ├── feature/backend-payments
                                 ├── feature/backend-financial
                                 ├── feature/frontend-api-integration
                                 └── feature/e2e-critical-flows
```

---

## 4. Fase A — Organização da raiz e estrutura inicial

**Objetivo:** deixar documentação e referências de design versionáveis e prontas para o monorepo.

**Branch:** trabalho no working tree atual → commit bootstrap em `main` → criar `develop`.

### 4.1 Organização alvo da raiz (após bootstrap)

```text
<project>/
├── .cursor/
│   ├── docs/
│   │   ├── overview.md
│   │   ├── software-architecture.md
│   │   └── implementation-plan.md
│   └── rules/
├── docs/
│   └── design/
│       ├── DESIGN.md
│       ├── DESIGN_SYSTEM.md
│       ├── design-system/
│       │   ├── preview.html
│       │   ├── tokens.json
│       │   └── css-variables.css
│       ├── index.html
│       ├── manifest.json
│       ├── screens/          # HTMLs de referência das telas
│       └── raw/              # JSON exportados do Stitch (referência, não usados em runtime)
├── .gitignore
└── README.md                 # opcional neste commit; pode vir na Fase B
```

Ainda **não** criar `apps/` neste commit (fica na Fase B).

### 4.2 Ações desta fase

1. Completar `docs/design/design-system/` com `tokens.json` e `css-variables.css` alinhados a `DESIGN_SYSTEM.md`.
2. Garantir que telas e design system estejam claros como **referência de UI**, não como app.
3. Adicionar `.gitignore` mínimo (`.env`, `node_modules`, `dist`, coverage, gerados do Prisma, OS junk).
4. Opcional: README curto apontando para `.cursor/docs/` e `docs/design/`.
5. Commit bootstrap.

### 4.3 Documentação (já resolvido)

- `software-architecture.md` já está com o nome correto.
- Verificar que referências internas nas rules apontam a `.cursor/docs/overview.md` e `software-architecture.md`.

### 4.4 Commit sugerido

```text
chore(repo): add initial documentation and design references
```

### 4.5 Após o commit

```text
git branch develop
git checkout develop
```

Critério de conclusão: `main` e `develop` existem; docs e design estão versionados; working tree limpa.

---

## 5. Fase B — Ambientes base (monorepo frontend + backend)

**Objetivo:** scaffolding técnico compartilhado, sem regras de negócio ainda.

**Branch:** `chore/repo-tooling` a partir de `develop`  
**PR:** → `develop`

### 5.1 Entregas

1. **npm workspaces** na raiz (`apps/backend`, `apps/frontend`).
2. Scripts raiz: `dev:backend`, `dev:frontend`, `docker:up`, `docker:down`, `test:api`, `test:e2e` (placeholders ok).
3. **ESLint + Prettier + Husky + lint-staged**.
4. `.env.example` na raiz e/ou por app (`DATABASE_URL`, `PORT`, `VITE_API_URL`, vars Docker).
5. **Docker Compose**: PostgreSQL 16 (+ healthcheck); serviços backend/frontend podem ficar stub ou Dockerfile.dev mínimos.
6. `docker/postgres/init.sql` (vazio ou com DB de teste, conforme architecture).
7. **Backend skeleton** (`apps/backend`):
   - Express (`app.ts`, `server.ts`);
   - rota `GET /health`;
   - middleware de erro (`AppError` + Zod);
   - Prisma client singleton (schema mínimo ou vazio sem models de domínio ainda);
   - Vitest + Supertest smoke do `/health`;
   - `tsconfig` strict + alias `@/*`.
8. **Frontend skeleton** (`apps/frontend`):
   - Vite + React + TypeScript;
   - Tailwind com tokens do design system (`DESIGN_SYSTEM.md` / `tokens.json`);
   - React Router com rotas vazias/placeholders: `/`, `/students`, `/students/:id`, `/financial`;
   - Axios client (`VITE_API_URL`);
   - layout shell: header “AULA MARCADA” + bottom nav (Início, Alunos, +, Financeiro, Mais);
   - Playwright instalado (sem suíte completa ainda).

### 5.2 Fora desta fase

- Models de domínio, CRUD, telas completas, mocks de negócio.

### 5.3 Commits sugeridos (atômicos)

1. `chore(repo): scaffold npm workspaces and shared tooling`
2. `build(docker): add local postgres compose setup`
3. `chore(backend): scaffold express app with health endpoint`
4. `chore(frontend): scaffold vite react app with design tokens`

### 5.4 Validação

- `npm install` na raiz.
- Backend sobe e `/health` responde.
- Frontend sobe e exibe shell.
- `docker compose up` sobe Postgres.
- Lint/format/typecheck passam no mínimo configurado.

---

## 6. Fase C — Frontend prototipado (mockado)

**Objetivo:** telas navegáveis com dados mockados, layout alinhado ao Stitch e comportamento alinhado ao `overview.md`.

**Regra:** services/hooks leem de `mocks/`; contrato das funções deve antecipar a API real (mesmas assinaturas quando possível) para trocar depois com baixo atrito.

### 6.1 Branch `feature/frontend-shell`

**Escopo**

- Design tokens Tailwind definitivos (cores, tipografia Sora/Inter/IBM Plex Mono, radii, spacing).
- Primitivos UI mínimos: `Button`, `Badge`, `BottomNav`, `AppHeader`, `Modal`/`BottomSheet`, `EmptySlot`.
- Roteamento real das páginas vazias + navegação inferior funcional.
- Camada `mocks/` e tipos de domínio no frontend (`Student`, `Class`, `Payment`, etc.) derivados do overview.

**PR** → `develop`  
**Commit:** `feat(frontend): add app shell and design system primitives`

### 6.2 Branch `feature/frontend-agenda-mock`

**Overview:** §§1–17  
**Screens:** visão diária/semanal, agendar, detalhes, vincular reposição

**Escopo**

- Agenda Dia/Semana (seg–sex; navegação temporal; destaque “Hoje”; default próxima segunda se fim de semana).
- Cards com hierarquia de badge §2 + faixa lateral de status.
- Slots vazios e “+” abrem modal de agendamento.
- Modal agendar: dia útil, período disponível, aluno, duração, valor auto, override, marcar reposição + Vincular.
- Modal detalhes: presença toggle, compareceu (pagamento/conteúdo/obs), não compareceu (Aula reposta?), ações excluir / vincular / alterar horário + bloqueios §17.
- Modal vincular: sem troca de aluno; lista ~3 itens com scroll; aviso de horas; bloqueio se insuficiente.
- Mock cobre: aguardando, pago, parcial, pendente, falta, aula reposta.

**Correções de layout nesta branch:** inconsistências 1, 2, 3, 5, 6 da tabela da §2.

**PR** → `develop`  
**Commits sugeridos:**

1. `feat(classes): add agenda day and week views with mocks`
2. `feat(classes): add schedule and class detail modals`
3. `feat(makeups): add makeup linking modal with duration rules ui`

### 6.3 Branch `feature/frontend-students-mock`

**Overview:** §§18–28  
**Screens:** lista, novo aluno, perfil, receber pagamento

**Escopo**

- Lista com busca, card (próxima aula relativa, situação financeira).
- Modal novo aluno (dados + valor/hora + recorrências opcionais seg–sex).
- Perfil: header próprio, dados, card financeiro, receber pagamento (modal **centralizado**), configurações (um botão editar), frequência, histórico.
- Mocks de saldo, pendência, recorrência e histórico.

**Correções:** inconsistência 4 (edição única) e modal de pagamento centralizado.

**PR** → `develop`  
**Commits sugeridos:**

1. `feat(students): add students list and create modal with mocks`
2. `feat(students): add student profile and payment receive modal`

### 6.4 Branch `feature/frontend-financial-mock`

**Overview:** §§29–33  
**Screens:** dashboards semana/mês/ano

**Escopo**

- Filtros granularidade + período + aluno.
- Indicadores Esperado / Realizado (com Pix/Dinheiro) / Impacto de faltas.
- Gráfico de barras conforme eixo do período.
- Lista de pendências (só Compareceu com aberto); toque → perfil.
- Dados mockados coerentes com os mocks das fases anteriores (preferir store mock compartilhado).

**PR** → `develop`  
**Commit:** `feat(financial): add financial dashboard views with mocks`

### 6.5 Critério de conclusão da Fase C

- App navegável ponta a ponta com mocks.
- Layout corrigido vs overview nos pontos listados.
- Sem autenticação, sem API real, sem inventar telas do §36.
- Pronto para review visual com o professor/stakeholder antes do backend pesado.

---

## 7. Fase D — Backend (domínio e API)

**Objetivo:** persistência e regras de aplicação em services, cobertas por testes de API.

Modelagem Prisma **derivada do overview** (não inventar entidades). Domínios iniciais esperados: Students, Classes, Make-ups, Payments, Financial.

### 7.1 Branch `feature/backend-foundation`

**Escopo**

- Schema Prisma inicial (students, classes, recurrences, attendance/payment-related tables conforme modelagem).
- Migrations versionadas.
- Seeds mínimos para desenvolvimento.
- Convenções de erro/validação já existentes.
- DB de teste + helpers Vitest/Supertest.

**PR** → `develop`  
**Commit:** `feat(database): add initial prisma schema and migrations`

> Modelar com cuidado: presença, valor esperado, alocações de pagamento, saldo adiantado, vínculos de reposição e tempo pendente de falta (§§6, 9, 10).

### 7.2 Branch `feature/backend-students`

**Overview:** §§18–21, §23, §26 (parte cadastro/config)

**Escopo**

- CRUD de alunos (criar, listar, buscar, editar dados pessoais).
- Valor padrão por hora.
- Recorrências (seg–sex; conflitos do aluno e da agenda do professor).
- Geração de aulas no horizonte de **4 semanas úteis**.
- Testes: caminho feliz, validação, conflito de recorrência, aluno inexistente.

**PR** → `develop`  
**Commit:** `feat(students): implement student and recurrence api`

### 7.3 Branch `feature/backend-classes`

**Overview:** §§1–3, §14, §16

**Escopo**

- Listagem agenda por dia/semana.
- Criar aula avulsa (restrição 1 aula/período/dia; só dias úteis).
- Cálculo de valor (duração × valor/hora; override).
- Alterar horário (respeitando períodos e reposições).
- Excluir aula (efeitos §14).
- Testes de conflito de período, fim de semana rejeitado, exclusão.

**PR** → `develop`  
**Commit:** `feat(classes): implement class scheduling and agenda api`

### 7.4 Branch `feature/backend-attendance-makeups`

**Overview:** §§4–8, §11–12, §15, §17

**Escopo**

- Atualizar presença (vazia / compareceu / não compareceu; toggle volta a vazia).
- Conteúdo e observações (≤ 500).
- Fluxo de reposição exclusiva no agendamento + vinculação a aula existente.
- Cobertura parcial de falta; “Aula reposta? Sim” só com pendência zero.
- Bloqueios §17.
- Testes das regras de duração e bloqueios.

**PR** → `develop`  
**Commits sugeridos:**

1. `feat(attendance): implement class attendance updates`
2. `feat(makeups): implement makeup linking and duration coverage`

### 7.5 Branch `feature/backend-payments`

**Overview:** §§9–10, §25, §35 (regras financeiras de alocação)

**Escopo**

- Pagamento no modal da aula (parcial, total, excedente = receita da aula, não saldo).
- Pagamento no perfil: quita antigas → recentes; sobra = saldo adiantado.
- Consumo automático de saldo ao marcar Compareceu.
- Preservar forma de pagamento (Pix/Dinheiro) por registro.
- Usar `prisma.$transaction` em operações multi-step.
- Testes: parcial, excedente, multi-aula, saldo, consumo automático.

**PR** → `develop`  
**Commit:** `feat(payments): implement payment allocation and student balance`

### 7.6 Branch `feature/backend-financial`

**Overview:** §§27, §29–33

**Escopo**

- Endpoints de indicadores (Esperado, Realizado por forma, Impacto de faltas).
- Série do gráfico por semana/mês/ano.
- Lista de pendências.
- Frequência do aluno (X de Y).
- Filtros de período e aluno.
- Testes das regras Esperado vs Impacto.

**PR** → `develop`  
**Commit:** `feat(financial): implement financial metrics and pending list api`

### 7.7 Critério de conclusão da Fase D

- API cobre os fluxos do overview em escopo.
- Testes de API nos caminhos críticos e estados inválidos.
- Sem auth/roles/permissões.

---

## 8. Fase E — Integração frontend ↔ API

**Branch:** `feature/frontend-api-integration` a partir de `develop`  
**PR:** → `develop`

### 8.1 Escopo

1. Trocar mocks por `services/*` via Axios.
2. Manter UI; ajustar apenas contratos/estados de loading/erro.
3. Feature flag ou adapter temporário **só se necessário** para migração gradual; preferir troca por domínio (students → classes → payments → financial).
4. Remover mocks obsoletos ao final (ou isolá-los para Storybook/dev, se ainda úteis).

### 8.2 Commits sugeridos

1. `feat(frontend): integrate students and profile with api`
2. `feat(frontend): integrate agenda attendance and makeups with api`
3. `feat(frontend): integrate payments and financial dashboard with api`

### 8.3 Validação

- Fluxos manuais ponta a ponta com Postgres local.
- Typecheck + lint + testes de API relevantes.

---

## 9. Fase F — E2E dos fluxos críticos

**Branch:** `feature/e2e-critical-flows`  
**PR:** → `develop`

Fluxos Playwright derivados do overview (testing rules):

1. Criar aluno (com e sem recorrência).
2. Agendar aula avulsa.
3. Marcar compareceu + pagamento.
4. Marcar não compareceu.
5. Vincular reposição.
6. Receber pagamento no perfil (quitação + saldo).
7. Consultar financeiro (indicadores e pendências).
8. Abrir perfil e histórico.

**Commit:** `test(e2e): cover critical teacher flows`

---

## 10. Ordem resumida de execução

| Ordem | Fase               | Branch                               | Resultado                         |
| ----: | ------------------ | ------------------------------------ | --------------------------------- |
|     0 | Bootstrap          | commit em `main` + criar `develop`   | Docs + design versionados         |
|     1 | Ambientes          | `chore/repo-tooling`                 | Monorepo + Docker + skeletons     |
|     2 | UI shell           | `feature/frontend-shell`             | Tokens, nav, rotas, mocks base    |
|     3 | Agenda mock        | `feature/frontend-agenda-mock`       | Agenda + modais de aula/reposição |
|     4 | Alunos mock        | `feature/frontend-students-mock`     | Lista + perfil + pagamento UI     |
|     5 | Financeiro mock    | `feature/frontend-financial-mock`    | Dashboard mockado                 |
|     6 | DB foundation      | `feature/backend-foundation`         | Prisma + migrations               |
|     7 | Students API       | `feature/backend-students`           | Alunos + recorrências             |
|     8 | Classes API        | `feature/backend-classes`            | Agenda + agendamento              |
|     9 | Attendance/makeups | `feature/backend-attendance-makeups` | Presença + reposição              |
|    10 | Payments API       | `feature/backend-payments`           | Alocação + saldo                  |
|    11 | Financial API      | `feature/backend-financial`          | Métricas + pendências             |
|    12 | Integração         | `feature/frontend-api-integration`   | UI na API real                    |
|    13 | E2E                | `feature/e2e-critical-flows`         | Fluxos críticos automatizados     |

---

## 11. Domínios e responsabilidades (referência rápida)

| Domínio    | Frontend (mock → API)             | Backend                              |
| ---------- | --------------------------------- | ------------------------------------ |
| Students   | lista, cadastro, perfil, config   | CRUD, recorrência, geração 4 semanas |
| Classes    | agenda, agendar, horário, excluir | slots, conflitos, CRUD de aulas      |
| Attendance | modal de presença/conteúdo        | estados de presença                  |
| Make-ups   | vincular, avisos de duração       | vínculos, cobertura parcial          |
| Payments   | pagamento na aula e no perfil     | alocação, saldo, receita extra       |
| Financial  | dashboard e pendências            | agregações e filtros                 |

Camadas (architecture):

```text
UI (pages/components)
  → services (Axios)
    → routes → controllers (Zod)
      → services (regras)
        → Prisma → PostgreSQL
```

---

## 12. Checklist por Pull Request

Antes de abrir/mergear qualquer PR:

1. Comportamento conferido no `overview.md` da seção afetada.
2. Estrutura alinhada a `software-architecture.md` / rules.
3. Sem auth/roles/features do §36.
4. Typecheck + lint.
5. Testes da camada afetada (API na Fase D+; E2E na Fase F).
6. Commits Conventional Commits, escopo único.
7. PR → `develop` (exceto release `develop` → `main`).

---

## 13. Riscos e decisões a preservar

| Risco                                     | Mitigação                                                       |
| ----------------------------------------- | --------------------------------------------------------------- |
| Design Stitch diverge do overview         | Corrigir na Fase C; overview manda                              |
| Modelagem financeira prematura demais     | Foundation só após UI mock validada visualmente                 |
| Abstrações cedo demais (modais genéricos) | Extrair composição só com reuso real (architecture §4.7 / §7.5) |
| Recorrência + horizonte 4 semanas         | Testes dedicados; não gerar sábado/domingo                      |
| Pagamento aula vs perfil                  | Tratar em services distintos/coordenados; transações            |

---

## 14. Próximo passo imediato

Quando autorizado a executar:

1. Merge local `chore/repo-tooling` → `develop`.
2. Abrir `feature/frontend-shell` e iniciar a Fase C.

Nenhuma branch de feature deve começar antes do bootstrap e da existência de `develop`.
