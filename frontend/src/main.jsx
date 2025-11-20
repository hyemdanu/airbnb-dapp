// Entry point for the Vite + React + PrimeReact application
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

// PrimeReact CSS bundles
// - theme.css: pick a theme (e.g., lara-dark-amber below)
// - primereact.min.css: component base styles
// - primeicons.css: icon font for `pi pi-*`
// - primeflex.css: utility classes (grid/flex)
import 'primereact/resources/themes/lara-dark-teal/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

// Local styles for small layout tweaks and CSS variables
import './styles.css';

// Mount the React app under #root
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
