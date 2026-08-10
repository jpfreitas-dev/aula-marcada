# Software Architecture

Documento de referência arquitetural da aplicação.

Este documento define os padrões técnicos e estruturais utilizados no projeto. Ele deve orientar a implementação sem definir regras de negócio específicas.

As regras de negócio e os fluxos funcionais da aplicação devem ser consultados em `.cursor/docs/overview.md`.

---

# 1. Stack

| Camada               | Escolha                               | Motivo                                     |
| -------------------- | ------------------------------------- | ------------------------------------------ |
| Linguagem            | TypeScript                            | Tipagem única entre backend e frontend     |
| Monorepo             | npm workspaces                        | Estrutura simples sem ferramenta adicional |
| API                  | Express                               | API HTTP simples e consolidada             |
| Banco                | PostgreSQL via Prisma                 | Banco relacional e ORM tipado              |
| Validação            | Zod                                   | Validação consistente de entradas          |
| Runtime dev          | tsx                                   | Desenvolvimento sem build intermediário    |
| SPA                  | React + Vite                          | Desenvolvimento rápido e build otimizado   |
| Roteamento           | React Router                          | Roteamento client-side                     |
| Estilo               | Tailwind CSS                          | Estilização baseada em utilitários         |
| HTTP client          | Axios                                 | Cliente HTTP centralizado                  |
| Testes unitários/API | Vitest + Supertest                    | Testes rápidos e integração com API        |
| Testes E2E           | Playwright                            | Validação dos fluxos completos             |
| Qualidade            | ESLint + Prettier + Husky/lint-staged | Padronização e qualidade do código         |
| Infra local          | Docker Compose                        | Ambiente local reproduzível                |

A aplicação possui um único contexto de usuário. Não existe, neste momento, necessidade de arquitetura baseada em múltiplos papéis ou níveis de permissão.

---

# 2. Estrutura do repositório

```text
<project>/
├── package.json
├── docker-compose.yml
├── .env.example
├── .prettierrc
├── docker/
│   └── postgres/
│       └── init.sql
├── apps/
│   ├── backend/
│   └── frontend/
└── docs/
```

A raiz utiliza npm workspaces para gerenciar backend e frontend.

Exemplo:

```json
{
  "workspaces": ["apps/backend", "apps/frontend"],
  "scripts": {
    "dev:backend": "npm run dev --workspace <backend-package>",
    "dev:frontend": "npm run dev --workspace <frontend-package>",
    "docker:up": "docker compose up --build",
    "docker:down": "docker compose down",
    "test:api": "npm run test --workspace <backend-package>",
    "test:e2e": "npm run test:e2e --workspace <frontend-package>"
  }
}
```

---

# 3. Backend

## 3.1 Estrutura de pastas

A estrutura inicial deve ser organizada por responsabilidade.

```text
apps/backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── prisma.config.ts
├── vitest.config.ts
├── tsconfig.json
├── .env.example
└── src/
    ├── server.ts
    ├── app.ts
    ├── config/
    ├── routes/
    ├── controllers/
    ├── services/
    ├── middlewares/
    ├── lib/
    │   └── prisma.ts
    ├── types/
    ├── utils/
    └── tests/
```

### Responsabilidade das pastas

**`server.ts`**

Responsável somente pelo bootstrap do servidor.

**`app.ts`**

Configura e exporta a aplicação Express.

**`config/`**

Centraliza configurações que dependem de variáveis de ambiente ou configuração externa.

**`routes/`**

Define as rotas HTTP e conecta cada rota ao respectivo controller.

**`controllers/`**

Recebem as requisições HTTP, validam os dados de entrada e chamam os services.

**`services/`**

Contêm as regras de aplicação e coordenam operações que envolvem persistência ou outras partes do sistema.

**`middlewares/`**

Contêm comportamentos transversais da API, como tratamento global de erros.

**`lib/`**

Contém integrações compartilhadas com bibliotecas externas, como o Prisma Client.

**`types/`**

Contém tipos compartilhados ou extensões de tipos necessários ao backend.

**`utils/`**

Contém utilitários independentes da regra de negócio.

**`tests/`**

Contém testes da API e seus arquivos auxiliares.

---

# 3.2 Convenções de nomenclatura

| Artefato   | Arquivo                  | Export                   |
| ---------- | ------------------------ | ------------------------ |
| Rota       | `<domain>-routes.ts`     | `<domain>Routes`         |
| Controller | `<domain>-controller.ts` | `<Domain>Controller`     |
| Service    | `<domain>-service.ts`    | `<domain>Service`        |
| Middleware | `kebab-case.ts`          | função nomeada           |
| Utilitário | `kebab-case.ts`          | função ou classe nomeada |

Os nomes de domínio devem ser definidos de acordo com o domínio real da aplicação.

Não utilizar nomes de entidades de outros projetos como placeholders definitivos.

---

# 3.3 Fluxo de uma requisição

O fluxo padrão de uma requisição deve ser:

```text
HTTP Request
    │
    ▼
  app.ts
    │
    ├── CORS
    ├── JSON parser
    ├── Routes
    └── Error handling
            │
            ▼
         Route
            │
            ▼
       Controller
            │
       valida entrada
            │
            ▼
         Service
            │
       regra de aplicação
            │
            ▼
         Prisma
            │
            ▼
         Database
```

## Regras de fronteira

### Controller

O controller:

- conhece `Request` e `Response`;
- valida os dados de entrada;
- chama o service;
- define o status HTTP;
- não acessa diretamente o Prisma.

### Service

O service:

- não conhece `Request` ou `Response`;
- recebe dados já validados;
- executa a lógica de aplicação;
- acessa o banco através do Prisma;
- retorna dados para o controller.

### Prisma

O Prisma é responsável exclusivamente pela comunicação com o banco de dados.

A lógica de aplicação não deve ser espalhada diretamente pelas queries.

---

# 3.4 Entry points

`server.ts` deve ser responsável somente por inicializar o ambiente e iniciar o servidor.

Exemplo:

```ts
import "dotenv/config";

import { app } from "@/app";

const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
```

`app.ts` deve configurar a aplicação e exportá-la para utilização nos testes.

```ts
import cors from "cors";
import express from "express";
import "express-async-errors";

import { routes } from "@/routes";
import { errorHandling } from "@/middlewares/error-handling";

const app = express();

app.use(cors());
app.use(express.json());

app.use(routes);

app.use(errorHandling);

export { app };
```

A ordem dos middlewares deve ser preservada:

1. configuração inicial;
2. middlewares gerais;
3. rotas;
4. tratamento global de erros.

---

# 3.5 Roteamento

As rotas devem ser centralizadas em `routes/index.ts`.

Exemplo:

```ts
import { Router } from "express";

import { studentsRoutes } from "./students-routes";
import { classesRoutes } from "./classes-routes";
import { paymentsRoutes } from "./payments-routes";

const routes = Router();

routes.get("/health", (_request, response) => {
  return response.status(200).json({
    status: "ok",
  });
});

routes.use("/students", studentsRoutes);
routes.use("/classes", classesRoutes);
routes.use("/payments", paymentsRoutes);

export { routes };
```

Os nomes acima representam somente a organização arquitetural. Os domínios definitivos devem seguir o `overview.md` e a modelagem real da aplicação.

Não criar rotas de autenticação, usuários ou permissões enquanto essas funcionalidades não fizerem parte do produto.

---

# 3.6 Validação com Zod

A validação das entradas HTTP deve ser realizada com Zod.

Para cada origem de dados, utilizar schemas específicos:

- `bodySchema`;
- `querySchema`;
- `paramsSchema`.

Exemplo:

```ts
class ExampleController {
  async create(request: Request, response: Response) {
    const bodySchema = z.object({
      name: z.string().trim().min(1),
    });

    const data = bodySchema.parse(request.body);

    const result = await exampleService.create(data);

    return response.status(201).json(result);
  }
}
```

## Regras

- Normalização de entrada deve ocorrer no schema.
- Query strings devem utilizar coerção quando necessário.
- Mensagens de validação devem ser compreensíveis para o contexto da aplicação.
- Schemas só devem ser centralizados em uma pasta própria quando houver reutilização real.

---

# 3.7 Tratamento de erros

A API deve utilizar uma classe de erro própria para erros conhecidos da aplicação.

```ts
class AppError {
  constructor(
    public message: string,
    public statusCode = 400,
  ) {}
}
```

O middleware global deve converter os erros em respostas HTTP consistentes.

```ts
export const errorHandling: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
    });

    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      message: "Erro de validação",
      issues: error.format(),
    });

    return;
  }

  response.status(500).json({
    message: "Erro interno do servidor",
  });
};
```

## Contrato

Erros conhecidos devem seguir:

```json
{
  "message": "Mensagem do erro"
}
```

Erros de validação podem incluir:

```json
{
  "message": "Erro de validação",
  "issues": {}
}
```

Erros internos não devem expor informações provenientes diretamente do ORM, banco ou infraestrutura.

---

# 3.8 Prisma

O Prisma Client deve ser utilizado como singleton.

Exemplo:

```ts
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

export { prisma };
```

## Convenções

Os models devem seguir convenções consistentes.

Exemplo:

```prisma
model Example {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("examples")
}
```

Preferências:

- UUID como identificador;
- camelCase no código;
- snake_case no banco quando necessário;
- timestamps consistentes;
- enums quando o conjunto de valores for fechado;
- migrations versionadas.

Não definir models, enums ou relacionamentos neste documento.

A modelagem deve ser derivada dos requisitos funcionais e definida posteriormente.

---

# 3.9 Services

Services representam a camada responsável pela execução dos casos de uso da aplicação.

Exemplo estrutural:

```ts
class ExampleService {
  async create(data: CreateInput) {
    return prisma.example.create({
      data,
    });
  }

  async show(id: string) {
    const record = await prisma.example.findFirst({
      where: { id },
    });

    if (!record) {
      throw new AppError("Registro não encontrado", 404);
    }

    return record;
  }
}

export const exampleService = new ExampleService();
```

O service deve ser o principal ponto de concentração da lógica de aplicação.

Controllers não devem conter regras de negócio complexas.

---

# 3.10 Variáveis de ambiente

As variáveis devem ser documentadas no `.env.example`.

Exemplo:

| Variável       | Uso                    | Falha                           |
| -------------- | ---------------------- | ------------------------------- |
| `DATABASE_URL` | Conexão com PostgreSQL | Erro de conexão                 |
| `PORT`         | Porta da API           | Default definido pela aplicação |

A aplicação não deve depender de variáveis relacionadas a funcionalidades que não existem no produto.

O arquivo `.env` real nunca deve ser versionado.

---

# 3.11 Testes de API

A API deve utilizar:

- Vitest;
- Supertest;
- banco PostgreSQL real para testes de integração.

Os testes devem validar o comportamento real da aplicação sempre que possível.

Não utilizar mocks de Prisma como estratégia principal para testes de integração.

A estrutura inicial:

```text
src/tests/
├── setup.ts
├── helpers/
└── *.spec.ts
```

Cada funcionalidade relevante deve possuir testes cobrindo pelo menos:

1. caminho principal;
2. entrada inválida;
3. comportamento esperado diante de regras ou estados inválidos;
4. recurso inexistente quando aplicável.

---

# 4. Frontend

## 4.1 Estrutura de pastas

```text
apps/frontend/src/
├── main.tsx
├── App.tsx
├── index.css
├── assets/
├── components/
├── context/
├── hooks/
├── pages/
├── routes/
├── services/
│   └── api.ts
├── types/
└── utils/
```

### Responsabilidades

**`main.tsx`**

Entry point do React.

**`App.tsx`**

Composição principal da aplicação e providers necessários.

**`components/`**

Componentes reutilizáveis.

**`context/`**

Contexts globais quando realmente necessários.

**`hooks/`**

Hooks reutilizáveis.

**`pages/`**

Telas da aplicação.

**`routes/`**

Configuração de rotas do frontend.

**`services/`**

Comunicação com serviços externos, principalmente a API.

**`types/`**

Tipos compartilhados do frontend.

**`utils/`**

Funções auxiliares puras.

---

# 4.2 Roteamento

O frontend deve utilizar React Router.

A estrutura deve refletir as telas e fluxos reais da aplicação.

Exemplo:

```tsx
export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/students" element={<Students />} />
        <Route path="/students/:id" element={<StudentProfile />} />
        <Route path="/financial" element={<Financial />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

As rotas definitivas devem ser definidas a partir do `overview.md`.

Não criar uma estrutura de rotas baseada em papéis de usuário.

---

# 4.3 Estado da aplicação

O estado deve permanecer o mais próximo possível de onde é utilizado.

Preferências:

1. estado local para informações locais;
2. hooks para lógica reutilizável;
3. Context somente quando o estado realmente for compartilhado por várias partes da aplicação;
4. evitar estado global sem necessidade.

Não criar abstrações globais antecipadamente.

---

# 4.4 Cliente HTTP

O frontend deve utilizar um único cliente HTTP centralizado.

Exemplo:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});
```

Os serviços da aplicação devem utilizar esse cliente em vez de criar instâncias independentes.

Exemplo:

```ts
export const studentsService = {
  async list() {
    const response = await api.get("/students");

    return response.data;
  },
};
```

O objetivo é manter a comunicação HTTP isolada da interface.

---

# 4.5 Formulários e validação

Formulários devem utilizar Zod para validação.

A validação deve acontecer antes do envio dos dados para a API.

Exemplo:

```ts
const schema = z.object({
  name: z.string().trim().min(1),
});
```

A biblioteca de gerenciamento de formulários deve ser adicionada somente se a complexidade dos formulários justificar.

Não adicionar abstrações antecipadamente.

---

# 4.6 Componentes

Os componentes devem possuir responsabilidades claras.

Um componente de interface não deve concentrar:

- chamadas HTTP;
- regras complexas de negócio;
- manipulação direta do banco;
- lógica de domínio.

Quando uma lógica começar a crescer, ela deve ser extraída para uma abstração adequada.

A reutilização deve acontecer quando houver comportamento ou estrutura realmente compartilhados.

Não criar componentes genéricos apenas para evitar duplicação mínima.

---

# 4.7 Composição de componentes

A arquitetura de componentes deve favorecer composição.

Componentes maiores devem poder receber conteúdo e comportamento através de `children` e props quando isso tornar a estrutura mais reutilizável.

Exemplo conceitual:

```tsx
<Modal>
  <Modal.Header />
  <Modal.Content>...</Modal.Content>
  <Modal.Footer>...</Modal.Footer>
</Modal>
```

A composição deve ser utilizada principalmente para estruturas que possuem comportamento ou organização compartilhada.

A existência de múltiplos modais visualmente semelhantes não significa que todos precisam ser transformados imediatamente em um único componente genérico.

A abstração deve surgir conforme os padrões reais do projeto forem identificados durante a implementação.

---

# 4.8 Estilo

Tailwind CSS deve ser utilizado para estilização.

Os tokens visuais da aplicação devem ser definidos de forma centralizada quando necessário.

Exemplo:

```css
@import "tailwindcss";

@theme {
  --default-font-family: "Open Sans", sans-serif;
}
```

A definição visual detalhada deve seguir o design produzido para a aplicação.

Não adicionar tokens ou componentes visuais que não sejam necessários.

---

# 4.9 Testes E2E

Playwright será utilizado para testar os principais fluxos da aplicação.

Os testes devem representar ações reais do usuário.

Exemplos de fluxos que posteriormente poderão receber testes:

- criar aluno;
- configurar aula recorrente;
- agendar aula;
- marcar comparecimento;
- registrar pagamento;
- registrar falta;
- vincular reposição;
- visualizar perfil;
- consultar financeiro.

A lista definitiva deve ser derivada do `overview.md`.

Os testes devem priorizar comportamento e resultado, não detalhes internos da implementação.

---

# 5. Infraestrutura local

O ambiente local pode utilizar Docker Compose.

Estrutura:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-app}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-app}
      POSTGRES_DB: ${POSTGRES_DB:-app}
    volumes:
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile.dev
    ports:
      - "${BACKEND_PORT:-3333}:3333"
    environment:
      DATABASE_URL: postgresql://app:app@postgres:5432/app
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile.dev
    ports:
      - "${FRONTEND_PORT:-5173}:5173"
    environment:
      VITE_API_URL: ${VITE_API_URL:-http://localhost:3333}
```

O Docker Compose tem como objetivo facilitar o desenvolvimento local e reproduzir o ambiente necessário para executar a aplicação.

---

# 6. TypeScript e ferramentas

## Backend

Configuração recomendada:

- `strict: true`;
- `module: ESNext`;
- `moduleResolution: bundler`;
- path alias `@/*` apontando para `src/*`.

O alias também deve ser configurado no Vitest.

## Frontend

Manter:

- `noUnusedLocals`;
- `noUnusedParameters`;
- `verbatimModuleSyntax`;
- JSX moderno.

## Lint e formatação

Utilizar:

- ESLint;
- Prettier;
- Husky;
- lint-staged.

Regras importantes:

- evitar `any`;
- evitar código não utilizado;
- manter hooks do React seguindo as regras oficiais;
- manter formatação consistente.

---

# 7. Princípios arquiteturais

## 7.1 Separação de responsabilidades

Cada camada deve possuir uma responsabilidade clara.

```text
Frontend
    ↓
HTTP
    ↓
Routes
    ↓
Controllers
    ↓
Services
    ↓
Prisma
    ↓
PostgreSQL
```

---

## 7.2 Controllers finos

Controllers devem coordenar a comunicação HTTP.

Não devem se tornar o local principal das regras da aplicação.

---

## 7.3 Services como camada de aplicação

Services devem concentrar operações e regras que envolvem o comportamento da aplicação.

Quando uma operação envolver múltiplas etapas ou validações relacionadas ao domínio, a implementação deve permanecer na camada apropriada de serviço.

---

## 7.4 Banco isolado

O restante da aplicação não deve acessar diretamente o banco.

O acesso ao Prisma deve permanecer concentrado na camada de persistência utilizada pelos services.

---

## 7.5 Abstrações sob demanda

Não criar abstrações antecipadamente.

Uma abstração deve existir quando houver:

- reutilização real;
- complexidade suficiente;
- responsabilidade claramente identificável;
- benefício concreto para manutenção.

Evitar transformar cada pequena operação em uma camada adicional.

---

## 7.6 Fluxo funcional como fonte de verdade

A arquitetura não deve inventar funcionalidades.

O comportamento esperado da aplicação deve ser definido pelo:

```text
.cursor/docs/overview.md
```

A arquitetura define **como organizar tecnicamente** esse comportamento.

Ela não define **o que o produto deve fazer**.

---

# 8. Organização de domínio

Conforme a aplicação crescer, os domínios devem ser identificados a partir das funcionalidades reais.

Para esta aplicação, exemplos de possíveis áreas funcionais são:

```text
Students
Classes
Payments
Financial
```

Esses nomes são apenas uma representação inicial baseada no fluxo funcional atual.

A divisão definitiva deve ser feita quando a implementação começar.

Não criar módulos ou abstrações apenas porque uma entidade existe.

A unidade arquitetural deve representar uma responsabilidade funcional significativa.

---

# 9. Testes

A estratégia de testes deve ocorrer em diferentes níveis.

## Unitários

Para lógica isolada e funções puras.

## Integração

Para validar a comunicação entre:

- controllers;
- services;
- Prisma;
- PostgreSQL.

## E2E

Para validar os fluxos completos da aplicação através da perspectiva do usuário.

A prioridade deve ser:

```text
Regra crítica
    ↓
Teste unitário/integrado
    ↓
Fluxo completo
    ↓
Teste E2E
```

Nem toda função precisa possuir teste E2E.

---

# 10. Checklist de implementação

Antes de iniciar uma nova funcionalidade:

1. Consultar `.cursor/docs/overview.md`.
2. Identificar o fluxo funcional correspondente.
3. Identificar quais dados precisam ser manipulados.
4. Definir a responsabilidade de cada camada.
5. Implementar o backend necessário.
6. Implementar a interface.
7. Validar estados e caminhos alternativos.
8. Adicionar testes apropriados.
9. Validar o fluxo completo.
10. Atualizar a documentação caso o comportamento funcional tenha mudado.

---

# 11. Fora do escopo arquitetural inicial

Não adicionar antecipadamente:

- múltiplos tipos de usuário;
- sistema de permissões;
- autenticação complexa;
- refresh tokens;
- cache;
- filas;
- armazenamento de arquivos;
- envio de e-mail;
- observabilidade;
- microservices;
- event-driven architecture;
- abstrações genéricas excessivas;
- infraestrutura distribuída.

Esses recursos devem ser adicionados somente caso exista uma necessidade real do produto.

---

# 12. Regra final

A arquitetura deve permanecer simples enquanto a aplicação for simples.

A complexidade deve ser adicionada somente quando uma necessidade concreta do produto justificar.

O objetivo é manter uma separação clara entre:

**Produto**

`.cursor/docs/overview.md`

↓

**Interface**

`React`

↓

**Transporte**

`HTTP / Axios / Express`

↓

**Aplicação**

`Controllers / Services`

↓

**Persistência**

`Prisma`

↓

**Dados**

`PostgreSQL`

Cada camada deve possuir uma responsabilidade clara e evitar conhecer detalhes desnecessários das demais.
