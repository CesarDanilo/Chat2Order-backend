# Estratégia de testes

## Camadas

| Camada | Onde | Ferramenta | O que cobre |
|---|---|---|---|
| Unitário | `Chat2Order-backend/src/tests/{orders,users,auth,config}` | Jest | Regras puras: transição de status, totais, telefone, ambiente, serviços com repositório falso |
| Arquitetura | `src/tests/architecture` | Jest | Fronteiras entre módulos, ausência de ciclos, domínio sem HTTP nem banco |
| API e integração | `src/tests/api` | Jest, supertest e PostgreSQL real | Cada rota com Express real: autenticação, autorização, validação, regras de negócio, erros, limites de uso, CORS, sessão, constraints do banco |
| E2E | `Chat2Order-frontend/frontend/e2e` | Playwright | Fluxos pelo navegador e requisições diretas que contornam a interface |
| Extensão | Manual, com script local | Playwright e Edge | Carregamento, validação e login real. A importação no WhatsApp não é automatizada |

## Princípios

- **Banco real nos testes de API.** Constraints, transações e concorrência só são verificáveis contra o PostgreSQL de verdade. O banco de testes precisa ter nome terminado em `_test`, e a suíte se recusa a rodar em outro.
- **Testes de API rodam em série.** Eles compartilham um banco, e um teste que mexe em administradores afetava outro em paralelo.
- **Sem mocks no E2E.** Ele roda contra API, banco e frontend reais. Só a IA (Groq) é simulada, e apenas nos testes de API.
- **Segurança testada como comportamento.** Cada controle de acesso tem um teste que tenta contorná-lo: outra conta, token adulterado ou expirado, campo extra, valor fora do limite.
- **Nada de pular teste.** Nenhum teste usa `skip`, `fixme` ou `retries`.
- **Dados descartáveis.** O E2E cria registros com um identificador da execução e remove tudo no final. O banco de testes da API é limpo antes de cada execução.

## Como rodar

| Comando | Onde | Requisito |
|---|---|---|
| `npm test` | Backend | `.env.test` apontando para um banco `*_test` |
| `npm run test:unit` | Backend | Nenhum |
| `npm run test:e2e` | Frontend | Backend, frontend e seed no ar, e `.env.e2e` preenchido |

## No CI

| Repositório | Job | O que roda |
|---|---|---|
| Backend | `backend` | Typecheck, testes com PostgreSQL 16, build e auditoria de dependências |
| Frontend | `frontend` | Lint e build |
| Frontend | `e2e` | API da mesma branch, banco, seed, frontend compilado e Playwright |
| Extensão | `extension` | Lint e build |

## Lacunas conhecidas

- Importação real no WhatsApp Web e chamada real à Groq: não são automatizadas.
- Extensão no CI: não há teste automatizado da extensão carregada no navegador.
- Testes de carga: não existem.
