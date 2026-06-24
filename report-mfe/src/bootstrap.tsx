/**
 * bootstrap.tsx
 *
 * Ponto de entrada assíncrono obrigatório para Module Federation.
 * O main.tsx importa este arquivo de forma dinâmica para garantir que
 * os shared modules do Shell sejam carregados antes da inicialização.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado no DOM.');

createRoot(root).render(
  <StrictMode>
    {/*
      BrowserRouter só é necessário no modo standalone (dev).
      Quando consumido pelo Shell, o Shell provê o roteador e o MFE
      não deve criar um segundo BrowserRouter — o App.tsx usa apenas <Routes>.
    */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
