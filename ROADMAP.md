# Roadmap do Plan Self

Este documento e a fonte canonica de prioridades do produto.

## Estado atual

O nucleo ja possui organizacoes, equipes, projetos, dashboard, Kanban, backlog, sprints, tarefas, comentarios, checklists, historico e eventos em tempo real. Testes e fluxos parciais de autenticacao e instalacao devem ser estabilizados antes da expansao.

## Marco 0 - operacao LAN isolada

- [x] Usar uma unica origem para web, API e Socket.IO, sem localhost no navegador.
- [x] Operar sem CDN, OAuth, telemetria ou servicos publicos obrigatorios.
- [x] Disponibilizar DNS local e HTTPS com certificado confiavel.
- [x] Entregar instalacao e atualizacao por bundle offline de imagens.
- [x] Completar autenticacao por contas locais e reset administrativo auditavel com revogacao de sessoes.
- [x] Entregar backup, restauracao e health checks operacionais.
- [x] Exigir validacao Prisma, build, lint, testes e Compose no CI.

## Marco 1 - fundacoes compartilhadas

- [x] Adicionar perfis GENERAL e CONSTRUCTION_SITE.
- [x] Criar membros e papeis explicitos por projeto.
- [x] Expor a fundacao de EAP e dependencias pela API.
- [x] Entregar interface hierarquica da EAP e edicao de papeis dos membros.
- [x] Criar a visualizacao timeline/Gantt sobre EAP e dependencias.
- [x] Implementar arquivos e revisoes em armazenamento local.
- [x] Entregar base PWA com fila offline para mutacoes JSON, idempotencia e conflitos visiveis.
- Ampliar o modo offline com cache de consultas por projeto e uploads reprogramaveis em blocos.

## Marco 2 - Plan Self Construcao

A edicao sera Brasil-first e voltada a operacao de campo:

- [x] template de obra com fases e pacotes de servico na EAP;
- [x] canteiro, cliente, responsavel tecnico, CREA/CAU, ART/RRT, alvara e contrato;
- detalhar atividades executivas reutilizaveis dentro dos pacotes de servico;
- [x] cronograma, planejamento semanal, metas quantitativas, realizado e PPC;
- [x] diario de obra com clima, efetivo, equipamentos, servicos, ocorrencias e fotos locais;
- [x] documentos e plantas versionados;
- [x] inspecoes de qualidade e seguranca e nao conformidades;
- PDF gerado localmente;
- captura offline e sincronizacao posterior.

## Marco 3 - piloto e expansao

- Validar uma obra completa em rede sem internet e dispositivos moveis.
- Medir sincronizacao, conflitos, uploads e disponibilidade.
- Adicionar depois: orcamento, contratos, medicoes, aditivos, curva S, RFI e suprimentos.
- Manter BIM/CAD, app nativo, IA externa e integracoes SaaS fora do MVP.

## Criterios obrigatorios

- Nenhuma release LAN inicia conexoes externas durante uso normal.
- Instalacao e atualizacao funcionam apenas com o bundle offline.
- Projetos gerais nao sofrem regressoes ao habilitar a edicao civil.
- Mutacoes offline sao idempotentes, auditaveis e nao sobrescrevem conflitos silenciosamente.

