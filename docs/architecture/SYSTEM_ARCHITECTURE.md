# Arquitetura do sistema

O Chat2Order transforma conversas de WhatsApp em pedidos. São três aplicações em repositórios separados.

| Aplicação | Tecnologia | Papel |
|---|---|---|
| Backend | Node 22, Express 5, Prisma 7, PostgreSQL 16 | API REST, regras de negócio, persistência e chamada à IA |
| Frontend | React 19, Vite, TanStack Router, React Query | Painel de pedidos, produtos e usuários |
| Extensão | Chrome MV3, React, Vite | Painel lateral que importa a conversa aberta no WhatsApp Web |

## Fluxo principal

1. No WhatsApp Web, a extensão lê as mensagens da conversa aberta.
2. A extensão envia o texto para `POST /api/parse`, com o token do usuário.
3. O backend manda o texto à IA (Groq), valida a resposta e cria o pedido pelo módulo de pedidos.
4. O pedido aparece no painel do frontend, onde pode ser editado e acompanhado.

## Hospedagem

| Parte | Onde | Como publica |
|---|---|---|
| Backend | Railway | Build do `Dockerfile` a cada push na `master`. Migrations rodam antes de subir |
| Frontend | Vercel | Build a cada push na `master`, com preview por branch |
| Extensão | Chrome Web Store | Manual, com `npm run build` |

## Segurança, em resumo

- Autenticação com JWT (HS256), validado a cada requisição contra o banco: conta, papel, versão da senha e logout.
- Autorização por dono do recurso. Pedido ou produto de outra conta responde 404.
- Toda entrada é validada por schemas estritos.
- Limites de uso por IP e por conta.
- CORS fechado para o frontend e para o ID da extensão.

Detalhes em [VALIDATION_STANDARDS.md](../validation/VALIDATION_STANDARDS.md).
