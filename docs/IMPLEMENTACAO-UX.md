# Implementação das recomendações UX/UI

## Aplicado

- **Backup local:** exportação integral do IndexedDB para JSON e restauração transacional; formato/versionamento, limite de 100 MB, validação estrutural e das referências entre matérias, tópicos e páginas; confirmação explícita porque a restauração substitui o banco atual. A cópia é manual e não criptografada pelo aplicativo.
- **Lixeira de páginas:** `deletedAt` com migração Dexie v2, tela de lixeira, restauração, exclusão permanente confirmada e ação de mover para a lixeira no menu/árvore. Busca, contadores e navegação normal ignoram páginas excluídas.
- **Feedback de salvamento:** o hook captura erros do autosave da data; o status do canvas acompanha a gravação assíncrona e mantém o JSON que falhou para permitir nova tentativa. Falhas ficam visíveis em desktop e celular.
- **Composição desktop:** a partir de 1280 px, o desktop preserva três colunas simétricas [editor de texto | folha central de até 960 px | propriedades], sem ampliar a página com `width`/`zoom`; a topbar e a toolbar foram compactadas. Entre 901 e 1279 px, os painéis flutuam para preservar a área da folha.
- **Modelos e fundo da folha:** o menu “Editar folha”, no canto superior direito da faixa de tópico e título, oferece os modelos Pautada, Quadriculada e Branca, além dos fundos Branco e Preto; o modelo é salvo por página e o fundo permanece uma preferência global independente do tema da interface.
- **Espaçamento das pautas:** controle na barra de ferramentas para folhas pautadas, ajustável de 18 a 60 px em passos de 2 px. O valor é salvo por página, respeita os padrões responsivos quando não alterado e acompanha a exportação da folha.
- **Acessibilidade visual básica:** foco global `:focus-visible`, alvos móveis principais de 44 px, estado de erro legível e respeito global a `prefers-reduced-motion`; adicionados tokens semânticos de superfície, borda, foco e erro.
- **Documentação e segurança:** README explica backup, privacidade e irreversibilidade ainda existente ao excluir uma matéria/tópico.

## Validação

`npm run typecheck` e `npm run build` concluíram com sucesso. O build mantém o aviso pré-existente/gerado de chunks grandes (dependências do canvas e diagramas); não é falha de compilação.

## Limites restantes

- A exclusão de **matérias e tópicos** ainda apaga permanentemente a estrutura e as páginas associadas. A confirmação agora avisa explicitamente e orienta fazer backup; a lixeira reversível cobre páginas excluídas individualmente.
- O projeto continua sem infraestrutura de testes automatizados. Não foi criada uma suíte automatizada nem executado teste manual com dispositivos/leitores de tela neste ambiente.
- Os breakpoints e espaçamentos foram ajustados no código, mas precisam de validação visual com screenshots em vários tamanhos, alturas, zoom do navegador e teclado virtual. Nenhuma conformidade WCAG é alegada.
- Busca ainda carrega páginas em memória; fontes remotas e texto em itálico rasterizado no editor continuam com as limitações anotadas no README.
- Não foi configurado serviço de nuvem/sincronização: a aplicação continua offline-first e local. O backup deve ser salvo em outro local pelo usuário.
