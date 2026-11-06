# TODO — Atualização visual e aprimoramento da interface

## 1. Padronização visual
- [ ] Uniformize os tamanhos das fontes de botões, controles, opções e textos auxiliares dos painéis.
- [ ] Preserve os títulos e cabeçalhos maiores, mantendo a hierarquia visual existente.
- [ ] Padronize o tamanho, o alinhamento, a espessura e o estilo dos ícones.
- [ ] Ajuste margens, espaçamentos, dimensões, bordas e raios de arredondamento para criar uma interface consistente.
- [ ] Evite elementos visualmente desproporcionais ou com tamanhos inconsistentes.

## 2. Reorganização das caixas de ferramentas e responsividade
- [ ] Reorganize os painéis de edição e as caixas de ferramentas seguindo boas práticas de UI/UX, priorizando clareza, acessibilidade e ergonomia visual.
- [ ] Agrupe ferramentas relacionadas em seções lógicas e intuitivas.
- [ ] Utilize a imagem de referência já fornecida para orientar distribuição, proporções e espaçamento; preserve a área central de trabalho.
- [ ] Aproveite melhor o espaço horizontal disponível, eliminando barras de rolagem horizontais desnecessárias e evitando que os painéis ultrapassem os limites da tela.
- [ ] Ajuste a interface para diferentes resoluções, incluindo computadores, tablets e celulares.
- [ ] Preserve o acesso a todas as ferramentas, inclusive em telas menores. Não remova ferramentas para economizar espaço; quando necessário, reorganize elementos ou ajuste o comportamento responsivo sem comprometer sua disponibilidade.

## 3. Tema claro — identidade Fiyfi e paleta final
- [ ] Crie uma versão clara da interface, mantendo a identidade visual do Caderno Digital e aplicando a paleta de cores fornecida.
- [ ] Apresente fundo geral claro, contraste adequado entre interface e painéis, caixas de ferramentas claras com separação discreta, textos escuros e legíveis, bordas/divisórias sutis e estados interativos nas cores fornecidas.
- [ ] Mantenha aparência minimalista, moderna e profissional, sem excesso de sombras ou elementos decorativos.
- [ ] Aplique as cores fornecidas de forma consistente em toda a interface; não escolha uma nova paleta por conta própria nem altere arbitrariamente as cores de referência.
- [ ] Paleta Dark: fundo principal `#080F10`, fundo secundário `#0C1213`, painéis `#101718`, painéis elevados `#151D1F`, hover de painel `#1B2427`, bordas principais `#242D31`, bordas secundárias `#1B2427`, texto principal `#E8ECEC`, texto secundário `#A6B2B5`, texto discreto `#687579`, verde principal `#B8F830`, verde hover `#D0FF38`, verde pressionado `#A8E820`, verde escuro `#719C16`.
- [ ] Paleta Light: fundo principal `#F5F7F2`, fundo secundário `#EEF1EA`, painéis `#FFFFFF`, painéis elevados `#FFFFFF`, hover de painel `#F0F3EC`, bordas principais `#D8DFD2`, bordas secundárias `#E3E8DF`, texto principal `#202820`, texto secundário `#687568`, texto discreto `#879184`, verde principal `#B8F830`, verde hover `#D0FF38`, verde pressionado `#A8E820`, verde escuro `#719C16`.
- [ ] Estados interativos iguais nos dois temas: botão primário `#B8F830`, hover `#D0FF38`, pressionado `#A8E820`, desabilitado `#879184`, seleção de ferramenta `#EAF8D3` no tema claro e fundo escuro com transparência verde no tema dark, foco acessível `#719C16`, borda ativa `#B8F830`, tooltip `#202820` com texto `#FFFFFF` e texto sobre neon `#202820`.
- [ ] Referências adicionais já fornecidas: linhas do caderno `#202A2E`, brilho `0 0 12px rgba(184, 248, 48, 0.15)` e raios `8px`, `14px` e `20px`.

## 4. Alternância independente do fundo da folha
- [ ] Disponibilize um controle intuitivo e fácil de acessar, integrado visualmente às ferramentas ou às configurações da folha, permitindo alternar entre modo branco (folha branca tradicional) e modo preto (folha preta ou muito escura para escrita em tema escuro).
- [ ] A mudança de cor ocorre imediatamente, sem recarregar a página, e o usuário pode alternar entre as duas opções sempre que desejar.
- [ ] A alteração afeta somente o fundo da folha, sem modificar indevidamente o fundo geral do site.
- [ ] Preserve o conteúdo escrito, desenhos, formas, imagens, seleções, posições e demais elementos da folha.
- [ ] Ajuste a apresentação das linhas do caderno, bordas e outros elementos dependentes do fundo para manter legibilidade nos dois modos.
- [ ] Garanta contraste adequado para textos e elementos de escrita, respeitando as cores personalizadas definidas pelo usuário sempre que possível.
- [ ] Não altere o conteúdo original dos elementos apenas para simular a troca de fundo.
- [ ] Use a persistência de configurações já existente ou implemente persistência compatível com a arquitetura existente, sem adicionar dependências desnecessárias.
- [ ] A alternância funciona independentemente do tema geral da interface; o usuário pode utilizar a interface clara com uma folha preta ou branca.

## 5. Logotipo, ícone e favicon
- [ ] Se possível, refine o ícone atual do Caderno Digital para torná-lo mais moderno, minimalista e reconhecível.
- [ ] Use a paleta fornecida, respeite a identidade do projeto, priorize símbolo simples relacionado à escrita/cadernos digitais/organização de anotações, garanta boa legibilidade em tamanhos pequenos e evite detalhes excessivos.
- [ ] Atualize o favicon e os demais locais em que o ícone seja utilizado, se isso fizer parte da estrutura existente.
- [ ] A usuária forneceu um novo logotipo neon-lima transparente: use-o na identidade visual do site e gere cópias rasterizadas para os locais/tamanhos de ícone necessários, preservando o arquivo de origem.
- [ ] Na top bar, use no botão de abrir o menu o ícone neon-lima da logo do site (`Logotiponeon-limaemmovimento.png`), substituindo o ícone de caderno e lápis da solicitação anterior.
- [ ] Remova da top bar o ícone de marca e o título “Caderno Digital”; o título do Caderno permanece disponível ao abrir o menu.

## 6. Caixa de edição da folha
- [x] Remova do menu lateral as funções “Modelo da página” (Pautada, Quadriculada e Branca) e “Fundo da folha” (Branco e Preto), inclusive a dica de abrir uma página para escolher o modelo.
- [x] Adicione um novo menu que abra uma caixa de edição da folha para escolher o modelo e o tema/fundo; esse controle é usado com uma página aberta.
- [x] Posicione o novo controle/caixa no canto superior direito da folha, alinhado à faixa do tópico e do título da página e junto ao extremo direito.
- [x] Na caixa, permita escolher entre os modelos Pautada, Quadriculada e Branca, e entre os fundos Branco e Preto.
- [x] Preserve o comportamento existente: o modelo selecionado é salvo na página aberta; a preferência de fundo branco/preto permanece independente do tema geral e persistente; as alterações aparecem imediatamente e não apagam nem modificam conteúdo, desenhos, formas ou imagens da folha.

## 7. Preservação obrigatória do produto e validação final
- [ ] Não refaça o site do zero.
- [ ] Não remova, desative ou substitua funcionalidades existentes.
- [ ] Não altere a lógica de funcionamento do editor, a estrutura dos documentos ou os dados dos usuários, exceto quando uma alteração técnica mínima for indispensável para implementar os novos controles visuais.
- [ ] Não prejudique a edição de textos, desenhos, formas, imagens, páginas, camadas ou demais recursos existentes.
- [ ] Não introduza dependências desnecessárias.
- [ ] Não altere funcionalidades que não estejam relacionadas ao escopo solicitado.
- [ ] Preserve as animações, interações e o estilo visual que já funcionam corretamente.
- [ ] Antes de modificar código, identifique os componentes, estilos e mecanismos de configuração responsáveis por cada área da interface; reutilize componentes e padrões existentes sempre que possível.
- [ ] Verifique se os tamanhos das fontes e dos ícones estão visualmente padronizados; os títulos continuam destacados e com a hierarquia preservada; os painéis estão organizados e não provocam rolagem horizontal desnecessária; o tema claro usa a paleta corretamente; o fundo da folha alterna entre preto e branco sem perda de conteúdo e independentemente do tema geral; todas as ferramentas e funcionalidades anteriores continuam disponíveis e operacionais; e a interface permanece utilizável em diferentes tamanhos de tela.

**Resultado esperado:** uma versão visualmente aprimorada do Caderno Digital, com tema claro profissional, ferramentas organizadas e padronizadas, identidade visual consistente e controle independente para alternar entre folhas brancas e pretas, sem perda de funcionalidades ou alterações desnecessárias na estrutura existente.

**Importante:** utilizar a paleta enviada antes de definir as cores finais; fazer alterações pontuais, preservar o código existente sempre que possível e validar o funcionamento dos recursos após as modificações.
