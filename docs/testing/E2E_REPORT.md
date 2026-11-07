# Relatório de testes E2E

**Data:** 2026-11-07
**Suíte:** `Chat2Order-frontend/frontend/e2e`, Playwright 1.64.1, Chromium

## Resultado

| Onde | Testes | Resultado | Tempo |
|---|---:|---|---|
| CI no GitHub (job `e2e`, commit `b6ce988`) | 39 | 39 aprovados | 27 s de testes, 129 s de job |
| Local, depois do redesenho do frontend | 39 | 39 aprovados | 37 s |

O número inclui o passo de login inicial, que salva as sessões reaproveitadas pelos demais testes.

## Cobertura

| Área | Cenários |
|---|---|
| Autenticação | Login válido e inválido, logout com revogação da sessão no servidor, rota protegida sem sessão, não-admin barrado em `/users` |
| Cadastro | Erros por campo, e-mail duplicado, senha comum, cadastro válido |
| Produtos | Criar, editar e excluir; validação e limites de caracteres |
| Pedidos | Criar, editar, mudar status e excluir; transições bloqueadas na tela; criação sem `CANCELADO`; 409 exibido ao usuário; telefone inválido; total acima do limite |
| API direta | Campos inválidos, campo extra, status inválido, total acima do limite, telefone normalizado, transição inválida (409), pedido de outra conta (404), sem token e token inválido (401) |

Os testes de API direta provam que o backend recusa dados inválidos mesmo quando a interface é contornada.

## Como roda no CI

O job `e2e` do frontend:

1. Sobe PostgreSQL 16.
2. Clona o backend da mesma branch, ou `master`.
3. Aplica as migrations e o seed, com senhas geradas a cada execução.
4. Inicia a API, compila e serve o frontend.
5. Roda o Playwright.

Nenhum segredo do repositório é usado.

## Limites

- Só Chromium. Firefox e WebKit não foram configurados.
- A extensão não faz parte da suíte. Ela foi testada à parte, carregada no Edge, com login real.
- A importação pelo WhatsApp Web e a chamada real à IA não são cobertas.
