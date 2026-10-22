# Caderno Digital

Caderno de anotações offline: organize **matérias → tópicos → páginas** e, em cada
página, escreva e desenhe numa folha pautada, branca ou quadriculada. Funciona no
navegador do computador e do celular e pode ser instalado como app (PWA).

Os dados ficam **somente no aparelho** (IndexedDB). Não há conta, servidor nem
sincronização.

## Funcionalidades

- Hierarquia Matéria → Tópico → Página, com renomear em vários lugares e numeração
  global de páginas que nunca reaproveita números.
- Folha com desenho e texto (camada [Excalidraw](https://excalidraw.com)): formas,
  setas, texto formatado com cor por letra, marcadores, painel de propriedades e
  "travar tela".
- Favoritos, listas de "Todas as páginas" com filtros e ordenação.
- Exportar a página aberta: imprimir (A4), PDF ou imagem PNG.
- Layout para celular (gaveta, doca de ferramentas, alvos de toque de 44 px) e uso
  offline depois da primeira visita.

A lista completa e os detalhes de cada área estão em
[docs/ARQUITETURA.md](docs/ARQUITETURA.md).

## Tecnologias

| Para quê | Biblioteca |
|---|---|
| Interface | React 18, TypeScript, Vite 5 |
| Desenho | Excalidraw 0.18 |
| Dados locais | Dexie 4 (IndexedDB) |
| Estado de interface | zustand |
| Ícones | Bootstrap Icons |

## Começando

Requisitos: **Node.js 18.18 ou superior** (a pasta traz um `.nvmrc` com a versão 20).

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar no terminal (normalmente `http://localhost:5173`).
O service worker (modo offline) só é registrado no app publicado, não no `npm run dev`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run typecheck` | Checa os tipos (TypeScript), sem gerar arquivos |
| `npm run build` | Gera as licenças de terceiros, checa os tipos e cria a pasta `dist/` |
| `npm run preview` | Serve o conteúdo de `dist/` para testar o build localmente |
| `npm run licenses` | Regenera `public/third-party-licenses.txt` |

## Publicação

O build gera arquivos estáticos em `dist/`, prontos para qualquer hospedagem
estática. O passo a passo para o **Cloudflare Pages**, com lista de conferência
antes e depois do deploy, está em [docs/DEPLOY.md](docs/DEPLOY.md).

## Dados e privacidade

- Matérias, tópicos, páginas e desenhos ficam no IndexedDB do navegador, neste
  aparelho e neste endereço (domínio). Limpar os dados do site apaga o caderno, e
  trocar de domínio começa com um caderno vazio.
- O app não tem análise de uso nem rastreamento.
- Para carregar fontes, o navegador consulta serviços de terceiros: Inter e Caveat no
  Google Fonts e as fontes de desenho do Excalidraw em um CDN. Isso expõe o endereço
  IP a esses serviços e, sem internet, essas fontes só aparecem se já tiverem sido
  abertas antes.

## Limitações conhecidas

- **Excluir é definitivo.** A lixeira ainda é só uma tela vazia, e não há exportar nem
  importar backup dos dados.
- Não há sincronização entre aparelhos.
- Mover uma página para outro tópico ainda não tem tela (a função `movePage` existe em
  `src/db/pages.ts`).
- O texto em itálico no editor vira uma imagem, então não é selecionável.
- A busca carrega todas as páginas em memória.
- Não há testes automatizados.

## Créditos e licenças

### Excalidraw

A camada de desenho do Caderno Digital é feita com o **[Excalidraw](https://github.com/excalidraw/excalidraw)**
(`@excalidraw/excalidraw`), projeto de código aberto sob **licença MIT**,
**Copyright (c) 2020 Excalidraw**. As fontes de desenho que acompanham o Excalidraw
(Excalifont, Virgil, Cascadia Code, Comic Shanns, Nunito, Lilita One, Assistant,
Liberation Sans e Xiaolai) têm cada uma a sua licença livre.

O Caderno Digital é um projeto independente: não é afiliado, patrocinado nem endossado
pelo Excalidraw.

O app exibe esse crédito em **Menu → Sobre e créditos**.

### Demais bibliotecas

O aviso de copyright e o texto da licença de cada pacote de produção (MIT, ISC,
Apache-2.0, BSD e outras) ficam em [`public/third-party-licenses.txt`](public/third-party-licenses.txt),
gerado automaticamente a cada `npm run build` e publicado junto com o app em
`/third-party-licenses.txt`. Ao adicionar ou atualizar dependências, rode `npm run licenses`
(ou apenas faça o build) para manter o arquivo em dia.

### Licença deste projeto

A licença do código do Caderno Digital ainda não foi definida pelo autor. Enquanto
não houver um arquivo `LICENSE`, valem os direitos autorais padrão: ninguém além do
autor tem permissão para copiar ou redistribuir o código.
