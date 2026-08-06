/**
 * ============================================================
 * SIRESA — Punto de Entrada de React (main.jsx)
 * ============================================================
 *
 * Este es el archivo de inicio de la aplicación React.
 * Es el primer archivo que ejecuta Vite al arrancar.
 *
 * Responsabilidades:
 *  1. Montar el componente raíz <App /> en el elemento #root del HTML
 *  2. Envolver la app con BrowserRouter para habilitar React Router
 *  3. Envolver con ErrorBoundary para capturar errores de renderizado
 *     y mostrar una pantalla de error en lugar de una pantalla en blanco
 *  4. React.StrictMode: activa advertencias adicionales en desarrollo
 *     para detectar efectos secundarios y API obsoletas
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import ErrorBoundary from './shared/components/ErrorBoundary.jsx';

// Montar la app en el elemento con id="root" del index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ErrorBoundary: captura errores de JavaScript en los componentes hijos
        y muestra una UI de error en lugar de romper la pantalla completa */}
    <ErrorBoundary>
      {/* BrowserRouter: habilita la navegación por URL sin recargar la página
          Usa la History API del navegador (ej: /dashboard, /consultar) */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
