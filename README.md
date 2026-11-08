# Quadra Connect – API

API em NestJS + TypeScript (Prisma + PostgreSQL) do Quadra Connect, plataforma de agendamento de quadras esportivas. Ela atende a aplicação do cliente ([quadra-connect](https://github.com/GustavoNeres0/quadra-connect)) e o painel do locador ([quadra_connect_admin](https://github.com/higorxi/quadra_connect_admin)).

## Pré-requisitos

- Node.js 20+
- Yarn
- Um banco PostgreSQL acessível

## Configuração

```bash
yarn install
cp .env.example .env   # preencha os valores
yarn db:generate       # gera o Prisma Client
yarn db:migrate        # aplica as migrations
```

Variáveis do `.env` (veja `.env.example`):

| Variável | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão do PostgreSQL |
| `BACKEND_PORT` | Porta da API (padrão 3000) |
| `JWT_SECRET` | Segredo usado para assinar os tokens JWT |
| `JWT_EXPIRES_IN` | Validade do token (ex.: `1d`) |

## Executar

```bash
yarn start:dev   # desenvolvimento com reload
yarn start:prod  # após yarn build
```

A API sobe em `http://localhost:3000` (ou na porta de `BACKEND_PORT`).

## Testes

```bash
yarn test        # todos os testes unitários (Jest)
yarn test:cov    # com cobertura
```

As regras centrais de reserva (conflito de horários, criação e cancelamento) estão em `src/reservations/reservations.service.spec.ts`. O pipeline de CI (`.github/workflows/lint.yml`) roda Prettier, ESLint e os testes.

## Executar o sistema completo

1. Suba a API (este repositório) na porta 3000.
2. Suba o painel do locador (`quadra_connect_admin`) e a aplicação do cliente (`quadra-connect`) seguindo o README de cada um, apontando a URL da API nas variáveis `VITE_API_URL` (painel) e `VITE_API_BASE_URL` (cliente).
3. Em desenvolvimento, a API só aceita CORS das origens configuradas em `src/main.ts`; ajuste a lista se rodar o front em outra porta.

## Estrutura

- `src/` módulos NestJS (auth, users, customers, companies, units, reservations, reviews, transactions, statistics, communities, reports)
- `prisma/` schema e migrations
- `test/` testes e2e
