import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource/unbounded/600.css';
import '@fontsource/unbounded/700.css';
import './index.css';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

/* PWA: реєстрація service worker'а робить застосунок встановлюваним
   (manifest.webmanifest) і дає офлайн-оболонку. У dev-режимі не потрібен,
   щоб не кешувати HMR-модулі. */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', document.baseURI).href;
    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn('[Music Player 1228] Service worker не зареєстровано', error);
    });
  });
}
