# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
versionamento [SemVer](https://semver.org/lang/pt-BR/).

<<<<<<< HEAD
## [Não lançado]

### Alterado (celular, até 900px — o computador não muda)

- Visual do celular igual à tela de referência em modo escuro: barra superior com logo e nome sempre visíveis, tela cheia, divisória, lua e botão ⌄ de "Salvar como"; cabeçalho da folha só com ★ Tópico ✎ nome e o menu ⋯; divisórias como botões arredondados separados; doca de ferramentas em cápsula flutuante (desfazer/refazer à esquerda, ferramenta em uso grande no centro, alça embaixo).
- Voltar/avançar de página, nova página e renomear passaram para o menu ⋯ da folha (`PageMenu`).
- Botão da lua alterna entre tema escuro e claro (`useTheme`); o escolhido fica salvo no aparelho.

=======
>>>>>>> origin/main
## [1.0.0] - 2026-10-22

Primeira versão preparada para publicação.

### Adicionado

- Janela **Sobre e créditos** no menu lateral, com o crédito do Excalidraw (MIT, © 2020 Excalidraw), das fontes e das demais bibliotecas.
- `public/third-party-licenses.txt`: avisos de copyright e textos de licença dos pacotes de produção, gerado a cada build por `scripts/generate-licenses.mjs`.
- `public/_headers` com cache e cabeçalhos de segurança para o Cloudflare Pages.
- Documentação: `README.md` reescrito, `docs/ARQUITETURA.md`, `docs/DEPLOY.md` e este changelog.
- `.nvmrc` (Node 20), `engines` no `package.json` e `.editorconfig`.
- Scripts `typecheck` e `licenses`.

### Alterado

- O build passou a checar os tipos com `tsc --noEmit` em vez de `tsc -b`, que gerava `vite.config.js`, `vite.config.d.ts` e arquivos `.tsbuildinfo` na raiz do projeto.
- `.gitignore` ampliado (arquivos gerados pelo TypeScript, `.env*`, arquivos de sistema e editor).
- Service worker em `v2`.

### Corrigido

- Service worker: abrir um arquivo em nova aba (como `/third-party-licenses.txt`) sobrescrevia no cache a página inicial do app, o que quebraria a abertura offline.

### Já existente antes desta versão

- Hierarquia Matéria → Tópico → Página com IndexedDB (Dexie), camada de desenho Excalidraw, editor de texto formatado, favoritos, filtros, exportação (imprimir, PDF e PNG), layout para celular e PWA offline.
