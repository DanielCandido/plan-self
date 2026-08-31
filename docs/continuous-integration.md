# Integracao continua

O workflow `.github/workflows/ci.yml` executa em todo push e pull request e possui dois checks obrigatorios:

- `Quality gate`: instalacao reproduzivel com `npm ci`, geracao/validacao Prisma, lint, testes e build completo;
- `Infrastructure gate`: validacao dos Compose normal e air-gapped, exposicao exclusiva do Nginx e uso explicito de imagens locais no bundle offline.

Telemetria do Next.js e Turbo fica desabilitada durante o build.

## Protecao da branch principal

No provedor Git, proteja a branch principal e exija antes do merge:

1. pull request aprovado;
2. branch atualizada com a principal;
3. checks `Quality gate` e `Infrastructure gate` aprovados;
4. proibicao de ignorar os checks para administradores, salvo procedimento de emergencia auditado.

A protecao e uma configuracao do servidor Git e nao pode ser imposta apenas por arquivos do repositorio. Em uma forja Git interna, configure regras equivalentes usando os mesmos comandos do workflow.

## Reproducao local

```powershell
npm ci
npm run db:generate
npm run lint
npm test
npm run build
Copy-Item .env.example .env
docker compose -f docker-compose.yml config --quiet
docker compose -f docker-compose.offline.yml config --quiet
```
