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
npm install
npm run docker:up    # PostgreSQL
npm run dev:backend
npm run dev:frontend
```
