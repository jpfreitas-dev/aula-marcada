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
