# CI/CD do Chat2Order

## Como funciona

**CI:** cada repositório tem `.github/workflows/ci.yml`, que roda em todo push e pull request.

| Repositório | Etapas |
|---|---|
| Backend | `npm ci`, `prisma generate`, typecheck, testes com PostgreSQL 16, build, `npm audit` |
| Frontend | `npm ci`, lint, build com checagem de tipos |
| Extensão | `npm ci`, lint, build com checagem de tipos |

`npm audit` falha só em vulnerabilidade crítica. As altas não bloqueiam por enquanto.

**CD:** não há deploy por workflow nem segredos no GitHub. Railway e Vercel já publicam a partir do GitHub, e um segundo caminho de deploy causaria publicações duplicadas. Migrations rodam no `preDeployCommand` do `railway.json`.

O que falta é fazer essas plataformas respeitarem o CI. Isso depende de ajustes nos painéis, que só você pode fazer.

## O que você precisa configurar

Os nomes de telas abaixo podem mudar, pois vêm das plataformas.

### 1. Railway: esperar o CI

No serviço do backend: **Settings → Source → Wait for CI**. Assim o deploy só acontece depois que os checks do GitHub passarem.

### 2. Proteção da `master` no GitHub

Em cada repositório: **Settings → Branches → Add branch protection rule**, ou **Rulesets**.

- Padrão: `master`
- Ative **Require a pull request before merging**
- Ative **Require status checks to pass**
- Escolha o check: `backend`, `frontend` ou `extension`, conforme o repositório
- Ative **Do not allow bypassing the above settings**, se quiser que a regra valha também para você

O check só aparece para seleção depois de rodar uma vez, ou seja, depois do primeiro push com o workflow.

### 3. Vercel

A Vercel publica um preview por branch e produção na `master`. Com a proteção do item 2, só código aprovado chega à `master`.

### 4. Extensão

A loja do Chrome não publica por este fluxo. Publicar continua manual, e depende de EXT-02.

Os testes E2E não rodam no CI, porque exigem backend, banco e seed no ar ao mesmo tempo.

## Situação atual

Os workflows passaram no `actionlint` e os mesmos comandos passaram em contêineres Linux com Node 22 e PostgreSQL 16, mas **ainda não rodaram no GitHub**, porque nada foi publicado.

**Lint do frontend.** `react-hooks/set-state-in-effect` e `react-hooks/immutability` estão como aviso, não como erro, com 8 ocorrências a corrigir na E8. O lint passa com 14 avisos e nenhum erro. A regra `react-refresh/only-export-components` foi desligada em rotas, componentes shadcn e no contexto de autenticação, onde não se aplica.

**Lockfile.** Gere o `package-lock.json` com a versão de npm do Node 22. Um lockfile criado pelo npm 11 falhou no `npm ci` do npm 10, o que quebraria o CI e o `Dockerfile`.
