import React from 'react';
import ReactDOM from 'react-dom/client';
// ORDEM DOS ESTILOS (importa para quem vence um empate de CSS):
//   1) ícones  2) theme.css/global.css (tokens e base)  3) componentes (importados por App).
// Os estilos vêm ANTES do App de propósito: assim os CSS dos componentes carregam depois
// dos tokens e nada mais é importado por último para "sobrescrever" (era o papel do
// antigo mobile-ui.css, removido). Mudou um tamanho? Mude o token no theme.css.
import 'bootstrap-icons/font/bootstrap-icons.css';
import './styles/global.css';
import App from './App';
import { applyTheme, getStoredTheme } from './hooks/useTheme';
import { registerServiceWorker } from './pwa/register';

// Tema (claro/escuro) aplicado antes do primeiro desenho, para não piscar.
applyTheme(getStoredTheme());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

registerServiceWorker();

// Pede ao navegador para NÃO apagar os cadernos quando faltar espaço (o Chrome decide
// conforme o uso e a instalação do app; não aparece nenhum aviso para a pessoa).
void navigator.storage?.persist?.();
