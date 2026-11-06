import './EmptyState.css';

/** Tela de "Início" quando nenhuma página está aberta. */
export function EmptyState({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
<<<<<<< HEAD
        <img src="/icons/brand-256.png" alt="" aria-hidden="true" />
=======
        <i className="bi bi-journal-bookmark-fill" />
>>>>>>> origin/main
      </span>
      <h2>Bem-vindo ao seu caderno</h2>
      <p>Selecione ou crie uma página para começar a escrever.</p>
      <button className="empty-state__btn" onClick={onOpenMenu}>
        <i className="bi bi-list" />
        Abrir menu
      </button>
    </div>
  );
}
