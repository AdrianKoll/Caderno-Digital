import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Page } from '../../types';
import { updatePage, toggleFavorite } from '../../db/pages';
import { useAutosave } from '../../hooks/useAutosave';
import { createLegacyTextElement, htmlToPlainText } from '../../utils/legacyContent';
import { PageHeader } from './PageHeader';
import { ExcalidrawLayer } from '../excalidraw/ExcalidrawLayer';
import { SubjectTabs } from '../binder/SubjectTabs';
import { TopicTabs } from '../binder/TopicTabs';
import { PageTitle } from '../binder/PageTitle';
import { readableOn, subjectColor } from '../binder/colors';
import './NotebookPage.css';

export function NotebookPage({ page, onOpenMenu }: { page: Page; onOpenMenu?: () => void }) {
  const subject = useLiveQuery(() => db.subjects.get(page.subjectId), [page.subjectId]);
  const topic = useLiveQuery(() => db.topics.get(page.topicId), [page.topicId]);

  // Estado local espelha a data da página atual; ao trocar de página, reinicializa.
  const [date, setDate] = useState(page.date);
  useEffect(() => {
    setDate(page.date);
  }, [page.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Colunas ao lado da folha: à direita o painel de propriedades (original) e à
  // esquerda o painel do editor de texto formatado — os dois via portal.
  const [sideEl, setSideEl] = useState<HTMLDivElement | null>(null);
  const [asideEl, setAsideEl] = useState<HTMLDivElement | null>(null);

  // "Folheada": ao trocar de página, a folha aparece com um fade rápido.
  const prevNumber = useRef(page.number);
  const [flip, setFlip] = useState(false);
  useEffect(() => {
    if (prevNumber.current === page.number) return;
    prevNumber.current = page.number;
    setFlip(true);
    const t = window.setTimeout(() => setFlip(false), 240);
    return () => window.clearTimeout(t);
  }, [page.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dateStatus = useAutosave(date, (d) => updatePage(page.id, { date: d }));

  // O id vem da camada de desenho: o salvamento é adiado, então a página aberta
  // pode já ser outra quando ele dispara.
  async function handleExcalidrawChange(pageId: string, serialized: string) {
    await updatePage(pageId, { excalidrawData: serialized });
  }

  // -------------------------------------------------------------------
  // Migração do modo "Escrever" (removido) — ver src/utils/legacyContent.ts
  // -------------------------------------------------------------------
  // Antigas páginas podem ter conteúdo real salvo em `page.content` (HTML
  // do contentEditable do modo Escrever, removido da interface). Esse
  // conteúdo NUNCA é apagado: aqui, na primeira vez que uma página assim é
  // aberta, ele é convertido em um elemento de texto nativo do Excalidraw e
  // mesclado na cena, e a página é marcada como `contentMigrated`. Nas
  // próximas aberturas, esse bloco não faz nada (idempotente).
  //
  // O cálculo é síncrono (useMemo, preso a page.id) para que a cena inicial
  // que o ExcalidrawLayer carrega já inclua o texto migrado desde o
  // primeiro render — o ExcalidrawLayer só recarrega a cena quando o
  // `pageId` muda, então depender de um efeito assíncrono para atualizar
  // `data` depois do primeiro render não funcionaria.
  const initialExcalidrawData = useMemo(() => {
    if (!page.content || page.contentMigrated) return page.excalidrawData;
    const plainText = htmlToPlainText(page.content);
    if (!plainText) return page.excalidrawData;

    let scene: { elements: unknown[]; appState?: Record<string, unknown>; camera?: unknown } = {
      elements: [],
      appState: {},
    };
    if (page.excalidrawData) {
      try {
        scene = JSON.parse(page.excalidrawData);
      } catch {
        scene = { elements: [], appState: {} };
      }
    }
    const textElement = createLegacyTextElement(plainText);
    const elements = [...(scene.elements ?? []), textElement];
    return JSON.stringify({ ...scene, elements });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  useEffect(() => {
    if (page.content && !page.contentMigrated && initialExcalidrawData) {
      updatePage(page.id, { excalidrawData: initialExcalidrawData, contentMigrated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  const status = dateStatus === 'saving' ? 'saving' : 'saved';

  const color = subjectColor(page.subjectId);
  const bookStyle = { '--tab': color, '--tab-fg': readableOn(color) } as CSSProperties;

  return (
    <div className="notebook-page">
      <div className="notebook-page__sheet-wrap">
        {/* Coluna da esquerda: editor de texto formatado (fora da folha). */}
        <div className="notebook-page__aside" ref={setAsideEl} />

        {/* Fichário: abas dos tópicos em cima, folha no meio, divisórias das matérias na borda direita. */}
        <div className="notebook-page__book" style={bookStyle}>
          <div className="notebook-page__topics">
            <TopicTabs subjectId={page.subjectId} activeTopicId={page.topicId} />
            {/* O título da página mora aqui, ao lado da aba do tópico — e não dentro da folha. */}
            <PageTitle page={page} />
          </div>

          <div className={`notebook-page__sheet ${flip ? 'is-turning' : ''}`}>
            <span className="notebook-page__status">{status === 'saving' ? 'Salvando...' : 'Salvo'}</span>
            <button
              className="notebook-page__fav"
              title={page.isFavorite ? 'Remover dos favoritos' : 'Favoritar'}
              onClick={() => toggleFavorite(page.id, !page.isFavorite)}
            >
              <i className={`bi ${page.isFavorite ? 'bi-star-fill' : 'bi-star'}`} />
            </button>

            <div className="notebook-page__meta">
              <PageHeader
                page={{ ...page, date }}
                subjectName={subject?.name ?? ''}
                topicName={topic?.name ?? ''}
                onChangeDate={setDate}
              />
            </div>

            {/*
              Canvas único: o Excalidraw é a única camada de conteúdo da
              folha (texto, desenho, formas e tudo mais vivem como elementos
              nativos dele, no mesmo espaço de coordenadas). Não há mais uma
              segunda camada de escrita para sincronizar com a câmera.
            */}
            <div className={`notebook-page__canvas paper paper--${page.paperStyle ?? 'ruled'}`}>
              <ExcalidrawLayer
                pageId={page.id}
                data={initialExcalidrawData}
                active
                panelContainer={sideEl}
                editorContainer={asideEl}
                onChange={handleExcalidrawChange}
              />
            </div>
          </div>

          <div className="notebook-page__dividers">
            <SubjectTabs onOpenMenu={onOpenMenu} />
          </div>
        </div>

        <div className="notebook-page__side" ref={setSideEl} />
      </div>
    </div>
  );
}
