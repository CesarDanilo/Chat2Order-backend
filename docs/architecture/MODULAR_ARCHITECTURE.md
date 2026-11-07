# Arquitetura modular do backend

O backend é um monólito modular: um único deploy, organizado por domínio em vez de por tipo de arquivo.

```text
src/
├── server.ts            # inicia o servidor
├── app/
│   ├── app.ts           # Express: segurança, CORS, limites, erros
│   ├── routes.ts        # único ponto que conhece todos os módulos
│   └── config/          # variáveis de ambiente e Swagger
├── modules/
│   ├── auth/            # login, logout, sessões, middleware de autenticação
│   ├── users/           # cadastro e gestão de contas
│   ├── products/        # catálogo por conta
│   ├── orders/          # pedidos, status, totais
│   └── parsing/         # importação de conversas com IA
├── shared/
│   ├── database/        # cliente Prisma e erros do banco
│   ├── errors/          # AppError
│   ├── http/            # validação, tratamento de erros, limites de uso
│   └── validation/      # textos, dinheiro, paginação, telefone
└── tests/
```

## Camadas de um módulo

| Camada | O que contém | Pode depender de |
|---|---|---|
| `domain` | Regras puras: transições de status, cálculo de totais, contratos de repositório | Nada de HTTP, banco ou outras camadas |
| `application` | Casos de uso que orquestram as regras | `domain` e `shared` |
| `infrastructure` | Repositórios Prisma, cliente da IA | `domain` e `shared` |
| `presentation` | Rotas, controllers e schemas de entrada | `application` e `shared` |
| `index.ts` | API pública do módulo | Qualquer camada do próprio módulo |

Módulos simples, como `users`, não têm `domain`: não há regra que justifique a camada.

## Regras

Verificadas automaticamente por `src/tests/architecture/boundaries.test.ts`, que roda no CI:

1. Um módulo só importa outro pelo `index.ts` dele.
2. Não há dependência circular entre módulos.
3. `shared` não depende de nenhum módulo.
4. `domain` não importa Express, banco nem outras camadas.

O sentido das dependências entre módulos é:

```text
users ──► auth
products ──► auth
orders ──► auth
parsing ──► auth, orders
```

`auth` lê as credenciais com o próprio repositório, em vez de depender de `users`. Isso evita o ciclo, já que `users` precisa do middleware de autenticação.

## Decisões e concessões

- **Tipos do Prisma no domínio.** Os contratos de repositório usam os tipos gerados pelo Prisma (`Order`, `Product`). Criar entidades próprias duplicaria o modelo sem ganho real agora. Se surgir um segundo meio de persistência, esse é o ponto a separar.
- **Sem injeção de dependência por container.** Cada controller cria o serviço com o repositório Prisma, e os testes usam repositórios falsos. É suficiente para o tamanho do sistema.
- **URLs preservadas.** A reorganização não mudou nenhuma rota. Os testes de API e E2E foram a rede de segurança.
