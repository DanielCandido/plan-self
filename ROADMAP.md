# Roadmap do Plan Self

Este documento e a fonte canonica de prioridades do produto.

## Estado atual

O nucleo ja possui organizacoes, equipes, projetos, dashboard, Kanban, backlog, sprints, tarefas, comentarios, checklists, historico e eventos em tempo real. Testes e fluxos parciais de autenticacao e instalacao devem ser estabilizados antes da expansao.

## Marco 0 - operacao LAN isolada

- Usar uma unica origem para web, API e Socket.IO, sem localhost no navegador.
- Operar sem CDN, OAuth, telemetria ou servicos publicos obrigatorios.
- Disponibilizar DNS local e HTTPS com certificado confiavel.
- Entregar instalacao e atualizacao por bundle offline de imagens.
- Completar contas locais, reset administrativo, backup e health checks.
- Exigir build, lint e testes no CI.

## Marco 1 - fundacoes compartilhadas

- Adicionar perfis GENERAL e CONSTRUCTION_SITE.
- Criar membros e papeis explicitos por projeto.
- Expor EAP, dependencias e timeline/Gantt.
- Implementar arquivos e revisoes em armazenamento local.
- Entregar PWA com fila offline, idempotencia e conflitos visiveis.

## Marco 2 - Plan Self Construcao

A edicao sera Brasil-first e voltada a operacao de campo:

- template de obra com fase, servico e atividade;
- canteiro, cliente, responsaveis tecnicos, CREA e ART;
- cronograma, planejamento semanal e acompanhamento fisico;
- diario de obra com efetivo, equipamentos, servicos, ocorrencias e fotos;
- documentos e plantas versionados;
- inspecoes de qualidade e seguranca e nao conformidades;
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

