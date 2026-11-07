# Progresso da modernização do Chat2Order

**Última atualização:** 2026-11-06
**Etapa atual:** validação global concluída e publicada em branch, sem deploy
**Bloqueio:** deploy em produção, depende do responsável

## Situação das fases

| Fase | Situação |
|---|---|
| Fase 1 — Executar o projeto | ✅ Concluída |
| Fase 2 — Auditoria | ✅ Concluída |
| E0 — Rede de proteção | ✅ Concluída localmente. Falta tirar `dist/` do Git |
| E1 — Hotfix de segurança | ✅ Concluída localmente, sem deploy |
| E2 — Blindagem da API | 🟡 Validação, erros, limites e dependências do backend prontos. Faltam dependências do frontend e da extensão |
| E3 — Integridade de dados | 🟡 Decimal, CHECK e índices prontos. Falta DB-01 |
| E4 — Validação de produção | ⏳ Pendente |
| E5 — Backend modular | ⏳ Pendente |
| E6 — IA e privacidade | 🟡 Saída validada, importação sem duplicar. Faltam SEC-12 e prompt injection |
| E7 — Extensão integrada | 🟡 CORS e duplicação resolvidos. Falta EXT-02 e captura |
| E8 — Frontend e design system | 🟡 Formulários validados. Faltam FE-03 a FE-07 e 14 avisos de lint |
| E9 — Qualidade final | 🟡 CI e E2E prontos. Falta observabilidade |

## Decisões adotadas

As recomendações da auditoria foram aprovadas pelo responsável em 2026-11-06.

| ID | Situação |
|---|---|
| D1 | Tratado como hotfix. Nada foi feito em produção; ações no runbook |
| D2 | Contas isoladas; admin gerencia usuários sem ver pedidos alheios; cadastro público mantido por enquanto |
| D3, D6 a D9 | Serão aplicadas nas etapas correspondentes |
| D4 | Remover `dist/` do Git fica para um PR separado. `docs/` segue na raiz `Chat2Order`, sem versionamento, até escolher o repositório |
| D5 | Aplicada: status `PENDENTE`, `CONCLUIDO`, `CANCELADO`; `GET /product` vazio responde `200 []`. Paginação pendente |

## Ambiente local

| Serviço | Endereço | Situação |
|---|---|---|
| Frontend | http://localhost:5173 | Rodando |
| Backend | http://localhost:3001 | Rodando, com as correções |
| Swagger | http://localhost:3001/docs | Rodando, incompleto (INF-03) |
| PostgreSQL | localhost:5434 (`chat2order`, `chat2order_test`) | Rodando, com seed aplicado |
| Extensão | `chat2order-frontend-extension/frontend/dist` | Compilada, não testada no Chrome |

Instruções em [LOCAL_SETUP.md](../development/LOCAL_SETUP.md) e [CI_CD.md](../development/CI_CD.md). As credenciais ficam em `Chat2Order-backend/.env.dev-credentials`, fora do Git.

## Estado do Git

O trabalho está na branch `feat/security-validation-modernization` dos três repositórios, autorizado pelo responsável. A `master` não foi alterada.

`docs/audit`, `docs/security` e `docs/validation/VALIDATION_AUDIT.md` ficam fora do repositório público até o deploy, porque descrevem falhas ainda abertas em produção.

## Testes executados

| Verificação | Resultado |
|---|---|
| `npm test` no backend | ✅ 18 de 18 suítes, 374 de 374 testes |
| Mesmo pipeline em Linux, Node 22, PostgreSQL 16 | ✅ Aprovado |
| Typecheck do backend | ✅ Aprovado |
| Imagem Docker do backend | ✅ Compila |
| `npm audit --omit=dev` no backend | ✅ 0 vulnerabilidades |
| Build de frontend e extensão | ✅ Aprovado, também em Node 22 |
| Lint do frontend | ✅ 0 erros, 14 avisos |
| Lint da extensão | ✅ Sem problemas |
| `actionlint` nos 3 workflows | ✅ Aprovado |
| E2E com Playwright | ✅ 39 de 39 (38 testes e o login inicial) |
| Migration com dados legados e rollback | ✅ Aprovado |
| Seed: recusas e repetição sem duplicar | ✅ Aprovado |
| CI no GitHub | Não executado, nada publicado |
| Extensão em navegador real | ✅ Edge: validação e login real. Chrome e importação no WhatsApp não testados |
| `/api/parse` com chave real | Não executado, Groq simulada nos testes |

## Problemas encontrados

Auditoria: 45 achados. Situação de segurança em [SECURITY_AUDIT.md](../security/SECURITY_AUDIT.md).

Encontrados e corrigidos nesta etapa:

- Lockfile do npm 11 quebrava `npm ci` no Node 22, o que atingiria o CI e o Dockerfile.
- Campos omitidos pela IA faziam o pedido ser recusado.
- O login não mostrava o erro de e-mail, porque a validação nativa do navegador interceptava o envio.

## Validação global (SDD)

Detalhes em [VALIDATION_AUDIT.md](../validation/VALIDATION_AUDIT.md) e [VALIDATION_STANDARDS.md](../validation/VALIDATION_STANDARDS.md).

| Módulo | Situação |
|---|---|
| Auditoria de entradas | ✅ Concluída |
| Padrão de erro | ✅ Backend, frontend e extensão |
| Auth | ✅ Concluído |
| Users | ✅ Concluído |
| Products | ✅ Concluído |
| Orders e máquina de estados | ✅ Concluído |
| Parse e IA | ✅ Concluído |
| Banco: Decimal, CHECK e índices | ✅ Concluído, aplicado só localmente |
| E2E versionado com Playwright | ✅ Concluído |

## Próximas tarefas

1. Revisar a branch e abrir o PR.
2. Configurar Railway e proteção da `master` ([CI_CD.md](../development/CI_CD.md)).
3. Executar o [runbook de produção](../security/SECURITY_REMEDIATION.md#runbook-de-produção).
4. Atualizar dependências do frontend e da extensão.
5. Definir o ID da extensão publicada em `EXTENSION_ORIGINS`.
