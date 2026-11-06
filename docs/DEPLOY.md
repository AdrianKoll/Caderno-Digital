# Guia de deploy (Cloudflare Pages)

O Caderno Digital é um site estático: o build gera a pasta `dist/` e não há nada
para rodar no servidor. Este guia usa o Cloudflare Pages, mas serve para qualquer
hospedagem estática com HTTPS.

## 1. Antes de publicar

No seu computador, na pasta do projeto:

```bash
npm install
npm run build      # gera as licenças, checa os tipos e cria dist/
npm run preview    # abre o build local para conferir
```

Confira no `npm run preview`:

- [ ] O app abre e dá para criar matéria, tópico e página.
- [ ] O desenho e o texto salvam e continuam depois de recarregar a página.
- [ ] **Menu → Sobre e créditos** mostra o crédito do Excalidraw, e "Ver todas as licenças" abre o arquivo de licenças.
- [ ] `dist/` tem `index.html`, `assets/`, `sw.js`, `manifest.webmanifest`, `icons/`, `_headers` e `third-party-licenses.txt`.

## 2. Publicar no Cloudflare Pages

### Opção A: por Git (recomendada)

1. Suba o código para um repositório (sem `node_modules` e sem `dist`, que o `.gitignore` já ignora).
2. No painel do Cloudflare: **Workers & Pages → Create → Pages → Connect to Git**.
3. Configure o build:

| Campo | Valor |
|---|---|
| Framework preset | None (ou Vite) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | deixe vazio (raiz do repositório) |

4. A versão do Node vem do arquivo `.nvmrc` (20). Se preferir, defina a variável de ambiente `NODE_VERSION` com `20`.
5. Clique em **Save and Deploy**. Cada novo `git push` na branch de produção gera um novo deploy.

### Opção B: envio direto da pasta `dist`

Depois do `npm run build`, envie o **conteúdo da pasta `dist`** pelo painel
(**Create → Pages → Upload assets**) ou pela linha de comando:

```bash
npx wrangler pages deploy dist --project-name caderno-digital
```

Não envie o `node_modules`.

## 3. Cabeçalhos e cache

O arquivo `public/_headers` é copiado para `dist/` e o Cloudflare Pages o aplica:

- `/assets/*` (arquivos com hash no nome): cache de 1 ano, imutável.
- `/`, `index.html`, `sw.js` e `manifest.webmanifest`: `no-cache`, para o app atualizar a cada visita.
- Proteções básicas: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`.

Não há política de segurança de conteúdo (CSP) configurada. Ela é um endurecimento
opcional, mas o Excalidraw usa `blob:`, `data:` e workers, então teste bastante antes de ativar uma.

## 4. Depois de publicar

- [ ] Abra o endereço publicado (HTTPS) e repita a conferência da seção 1.
- [ ] No DevTools, aba **Application**: o *Manifest* carrega sem erros e o *Service Worker* aparece como ativo.
- [ ] Teste offline: com o app já aberto uma vez, desligue a internet (ou marque *Offline* no DevTools) e recarregue. O app e os dados devem abrir.
- [ ] No celular, confira se aparece a opção de instalar o app.

## 5. Publicar uma nova versão

1. Faça as mudanças e rode `npm run build` para conferir.
2. **Troque `VERSION` em `public/sw.js`** (por exemplo, de `'v2'` para `'v3'`). Isso descarta os caches antigos nos aparelhos que já usam o app.
3. Atualize o [CHANGELOG](../CHANGELOG.md) e, se for o caso, o `version` do `package.json`.
4. Faça o deploy (`git push` ou novo upload).

Para voltar a uma versão anterior, use o histórico de deploys do projeto no painel
do Cloudflare Pages e restaure o deploy desejado.

## 6. Problemas comuns

| Sintoma | Causa provável e solução |
|---|---|
| Página em branco | Abra o console (F12). Se houver erro 404 em `/assets/...`, o *Build output directory* não está como `dist`. |
| Continua aparecendo a versão antiga | Esqueceram de trocar `VERSION` em `sw.js`, ou o aparelho ainda não recarregou. Feche e abra o app duas vezes. |
| O caderno apareceu vazio | Os dados ficam por domínio. Outro endereço (por exemplo `*.pages.dev` e o domínio próprio) tem um banco separado. |
| Fontes de desenho diferentes offline | As fontes do Excalidraw vêm de um CDN e só ficam disponíveis offline depois de abertas uma vez com internet. |
| `vite: Permission denied` ou erro de `@rollup/rollup-*` | O `node_modules` foi copiado de outro sistema. Apague a pasta e rode `npm install` de novo. |

## 7. Melhorias recomendadas

Não bloqueiam a publicação, mas valem para uma versão seguinte:

1. **Hospedar as fontes** (Inter, Caveat e as do Excalidraw) junto com o app. Isso elimina chamadas a terceiros e faz o desenho ficar idêntico offline.
2. **Exportar e importar backup** dos dados, já que tudo fica só no navegador e excluir é definitivo.
3. Pedir ao navegador armazenamento persistente com `navigator.storage.persist()`, para reduzir o risco de os dados serem descartados.
4. Testes automatizados (por exemplo com Vitest) para `utils/pageFilters.ts` e `src/db/`.
