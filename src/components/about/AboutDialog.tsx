import { KeyboardEvent, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { version } from '../../../package.json';
import { useNotebookStore } from '../../store/notebookStore';
import './AboutDialog.css';

const EXCALIDRAW_SITE = 'https://excalidraw.com';
const EXCALIDRAW_REPO = 'https://github.com/excalidraw/excalidraw';

/**
 * Janela "Sobre e créditos". Reúne os avisos de terceiros que o app precisa
 * exibir — em especial o do Excalidraw (MIT, © 2020 Excalidraw), que é a base
 * da camada de desenho. O texto completo das licenças de todos os pacotes fica
 * em /third-party-licenses.txt (gerado por scripts/generate-licenses.mjs).
 */
export function AboutDialog() {
  const open = useNotebookStore((s) => s.aboutOpen);
  if (!open) return null;
  return createPortal(<AboutCard />, document.body);
}

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

function AboutCard() {
  const close = useNotebookStore((s) => s.closeAbout);
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Foco no botão Fechar e volta para onde estava ao fechar.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  // Esc fecha; Tab fica preso dentro da janela.
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = cardRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
    if (!focusable || focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="about-backdrop" onPointerDown={(e) => e.target === e.currentTarget && close()} onKeyDown={onKeyDown}>
      <div ref={cardRef} className="about-card" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <header className="about-card__header">
          <div>
            <h2 id="about-title" className="about-card__title">
              Sobre e créditos
            </h2>
            <p className="about-card__subtitle">Caderno Digital · versão {version}</p>
          </div>
          <button ref={closeRef} type="button" className="about-card__close" onClick={close} aria-label="Fechar" title="Fechar">
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <div className="about-card__body">
          <section className="about-section about-section--main">
            <h3>Desenho feito com Excalidraw</h3>
            <p>
              A folha de desenho, as formas e as ferramentas do caderno usam o <strong>Excalidraw</strong>, um projeto de código aberto
              criado e mantido pela comunidade Excalidraw.
            </p>
            <p className="about-section__license">Licença MIT · Copyright © 2020 Excalidraw</p>
            <p className="about-section__links">
              <ExternalLink href={EXCALIDRAW_SITE}>excalidraw.com</ExternalLink>
              <ExternalLink href={EXCALIDRAW_REPO}>Código-fonte no GitHub</ExternalLink>
            </p>
            <p className="about-section__note">
              O Caderno Digital é um projeto independente e não é afiliado, patrocinado nem endossado pelo Excalidraw.
            </p>
          </section>

          <section className="about-section">
            <h3>Fontes</h3>
            <p>
              As fontes de desenho (Excalifont, Virgil, Cascadia Code, Comic Shanns, Nunito, Lilita One, Assistant, Liberation Sans e
              Xiaolai) acompanham o Excalidraw, cada uma sob a sua própria licença livre. A interface usa Inter e Caveat (licença SIL OFL).
            </p>
          </section>

          <section className="about-section">
            <h3>Outras bibliotecas</h3>
            <p>
              React, Dexie, Zustand e Bootstrap Icons, entre outras, também são de código aberto. O aviso de copyright e o texto da licença
              de cada uma estão na lista completa.
            </p>
            <p className="about-section__links">
              <a href="/third-party-licenses.txt" target="_blank" rel="noopener noreferrer">
                Ver todas as licenças
              </a>
            </p>
          </section>
        </div>

        <footer className="about-card__footer">
          <button type="button" className="about-card__btn" onClick={close}>
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
