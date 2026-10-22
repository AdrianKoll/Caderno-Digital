import './EmptyState.css';

/** Tela de "Início" quando nenhuma página está aberta. */
export function EmptyState({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <i className="bi bi-journal-bookmark-fill" />
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
