# Plano de ação — correções da auditoria do Caderno Digital

**Estado:** 11 correções aplicadas; typecheck, check CSS e build de produção aprovados. Os testes funcionais em navegador/leitor de tela e cenários de falha ainda precisam ser executados. **Escopo:** 11 achados confirmados do relatório de auditoria. O app usa IndexedDB local via Dexie; não há backend remoto identificado. O plano abaixo considera frontend e camada local de dados.

## Ordem de prioridade

| Ordem | Prioridade | Achado | Ação planejada | Validação de saída |
|---:|---|---|---|---|
| 1 | P0 — Segurança | XSS armazenado no RichDoc ao importar backup e editar | Validar/escapar todos os campos interpolados em HTML; restringir cores e marcadores e validar dados importados antes de persistir/usar | Typecheck; inspecionar renderização para payloads de atributo/estilo; teste manual controlado recomendado |
| 2 | P1 — Acessibilidade | Matérias/tópicos expansíveis inacessíveis por teclado | Converter acionadores em botões sem aninhar ações; expor `aria-expanded`/`aria-controls` | Tab, Enter e Espaço; leitor de tela anuncia nome e estado |
| 3 | P1 — Dados | Autosave da data é descartado na desmontagem/troca de página | Flush do valor pendente no unmount/troca de registro, preservando o debounce normal | Simular edição seguida de saída rápida; verificar IndexedDB |
| 4 | P1 — Dados | Backup pode misturar snapshots | Ler todas as tabelas dentro de uma única transação readonly | Typecheck e exportação; ensaio de concorrência recomendado |
| 5 | P1 — Dados | Restore aceita números/IDs/contador inconsistentes | Validar IDs e números únicos, referências e normalizar contador no mesmo restore transacional | Importar fixture válida e fixtures inválidas sem substituir os dados atuais |
| 6 | P2 — Funcional | Escape no título salva o valor descartado no blur | Separar cancelamento do commit e restaurar texto no cancelamento | Escape seguido de blur não altera título; Enter/blur continua salvando |
| 7 | P2 — Funcional | Enter/blur pode criar tópico duplicado | Guardar contra commit concorrente, prevenir comportamento padrão e impor verificação de nome no banco | Enter e blur em sequência criam no máximo um tópico |
| 8 | P1 — Acessibilidade | `tablist` de páginas não segue padrão de teclado | Remover a semântica de abas incompleta e manter um grupo de botões nativos, com página atual identificada | Teste teclado e árvore de acessibilidade |
| 9 | P1 — Acessibilidade | Gaveta móvel sem gerenciamento de foco/modalidade | Focar dentro ao abrir, confinar Tab, tornar fundo inerte, fechar com Esc e restaurar foco | Teste só com teclado e leitor de tela, abertura por botão e gesto |
| 10 | P1 — Acessibilidade | Primária com texto branco tem contraste 3,70:1 | Ajustar tokens/cores de texto para mínimo 4,5:1 em textos normais; revisar estados ativos | Recalcular contraste em temas e estados default/hover/active |
| 11 | P2 — Robustez | Erros de renomeação travam o diálogo | `try/catch/finally`, mensagem de erro acessível e retry | Simular rejeição IndexedDB; diálogo libera Salvar e anuncia erro |

## Execução por fases

1. **P0 Segurança:** fechar o sink de HTML antes de qualquer outra mudança e impedir que valores externos controlem atributos/estilos.
2. **P1 Integridade e acessibilidade:** proteger os fluxos de backup/restore/autosave e tornar hierarquia, navegação por páginas e gaveta utilizáveis por teclado/tecnologia assistiva; corrigir contraste.
3. **P2 Fluxos e resiliência:** corrigir Escape/blur, commits duplicados e tratamento de exceção no renomear.
4. **Verificação:** `npm run typecheck`, `npm run check:css` e build de produção executados com sucesso; realizar ainda testes de regressão em browser, teclado/leitor de tela e IndexedDB.

## Registro de execução

- Corrigido o sink `innerHTML` do editor com escape contextual e validação de cor, marcador e recuo; o restore agora verifica cenas/RichDoc antes de persistir.
- Implementados: flush de autosave em desmontagem/troca de registro, snapshot transacional de backup, validação de IDs/números/referências e contador monotônico no restore, cancelamento do título no Escape, deduplicação de criação de tópico dentro de transação, interação acessível da árvore, botões de página sem tablist incorreto, foco/modalidade da gaveta, tokens com contraste e erro recuperável no diálogo.
- Verificações: `npm run typecheck` passou; `npm run check:css` passou (549 tokens); `vite build` passou. O build mantém alerta de chunks maiores que 500 kB. Não há testes automatizados configurados/rodados nesta rodada; não houve testes dinâmicos com navegador ou leitor de tela.
- **Achado complementar fora dos 11:** `npm audit` reportou 15 vulnerabilidades de dependências (10 altas, 3 moderadas, 2 baixas; zero críticas), incluindo Vite e dependências transitivas. Não apliquei atualização automática porque as correções propostas pelo npm incluem mudanças major/semver e precisam de revisão de compatibilidade separada.
- Riscos de desempenho, CSP e pinagem do Wrangler (três itens adicionais da auditoria, não parte dos 11 achados confirmados) ficam como endurecimento posterior.
