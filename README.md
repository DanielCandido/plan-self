# Plan Self

Plataforma Kanban self-hosted, modular, API-first e Docker-first para gestão de projetos, squads e comunicação interna.

## Arquitetura

Monorepo com Turborepo:

```text
/apps
  api            # NestJS (REST, auth, RBAC, módulos Kanban e mensagens)
  web            # Next.js (UI Kanban)
  worker         # BullMQ (automações, jobs assíncronos)
  gateway        # NestJS WebSocket/Socket.IO
  setup-wizard   # Next.js (instalação guiada)
/packages
  ui             # componentes compartilhados
  types          # tipos centrais
  config         # leitura de configuração/env
  auth           # helpers de autorização
  database       # Prisma schema + seed
  sdk            # SDK TypeScript inicial
/infrastructure
  docker         # Dockerfiles
  nginx          # reverse proxy
  kubernetes     # manifests base
```

## Stack

- Backend: Node.js + NestJS + TypeScript + Prisma
- Frontend: Next.js + React
- Banco principal: PostgreSQL (com provider configurável via `DATABASE_PROVIDER`)
- Redis: filas/cache/eventos
- Filas: BullMQ
- Tempo real: Socket.IO
- Infra: Docker Compose + Nginx + manifests Kubernetes

## Funcionalidades implementadas na base

- Estrutura multi-organização e times
- Base de RBAC com papéis: Owner/Admin/Manager/Member/Guest
- Modelagem ágil (Epic, Sprint, Story, Task)
- Task state machine (`Backlog`, `Todo`, `In Progress`, `Review`, `Done`, `Blocked`)
- Comentários e mensagens por canal
- Auditoria (`AuditLog`)
- Gateway WebSocket para eventos em tasks
- Setup wizard inicial com perguntas-chave para bootstrap
- CI base com lint/build/test

## Modelagem Prisma

`/packages/database/prisma/schema.prisma` contém entidades para:

- organizações, times, membros e usuários
- projetos, epics, sprints, stories e tasks
- múltiplos responsáveis em tasks
- canais e mensagens
- logs de auditoria

## Setup rápido

Para uso em rede isolada com DNS e HTTPS local, consulte o
[guia de instalacao LAN](./docs/lan-setup.md).

```bash
cp .env.example .env
npm install
npm run db:generate
docker compose up -d --build
```

Ou:

```bash
./scripts/setup.sh
```

## Configuração de ambiente (.env)

- O arquivo canônico de ambiente do monorepo é `/.env` (na raiz do projeto).
- API, Gateway e Worker agora carregam esse arquivo explicitamente quando iniciado em desenvolvimento local.
- Precedência de variáveis:
  1. variáveis já definidas no ambiente de execução (ex.: Docker/Kubernetes/CI)
  2. valores de `/.env` (apenas para chaves ainda não definidas no ambiente)
- Variáveis obrigatórias para subir a API: `JWT_ACCESS_SECRET` e `JWT_REFRESH_SECRET`.

## Serviços (docker compose)

- `web` → http://localhost:3000
- `api` → http://localhost:3001
- `setup-wizard` → http://localhost:3002
- `gateway` → ws://localhost:3010/events
- `postgres` + `redis`
- `nginx` → http://localhost:80

## Segurança base incluída

- JWT (access/refresh via env)
- Rate limiting global (Nest Throttler)
- CORS configurável
- Estrutura para RBAC e auditoria

## Roadmap imediato

> O roadmap detalhado e atualizado, incluindo operacao LAN isolada e a edicao
> Plan Self Construcao para engenharia civil, esta em
> [ROADMAP.md](./ROADMAP.md). A lista historica abaixo sera absorvida pelos
> marcos descritos no documento canonico.
1. Completar módulos NestJS (auth refresh, MFA, sessões, API keys)
2. Entregar board/timeline/list/calendar no frontend
3. Integrar DM/thread/reactions em mensagens
4. Setup wizard com geração automática de `.env`, compose e secrets
5. Integrar providers de IA (OpenAI/Ollama/OpenRouter/Anthropic)
6. Expandir integrações Git/Slack/Discord/Email/DevOps
