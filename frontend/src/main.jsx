/*
 * Entry point - this is where the app starts
 * Loads all the CSS and wraps our app with the Web3 provider
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { Web3Provider } from './context/Web3Context.jsx';

// PrimeReact styles (UI component library)
import 'primereact/resources/themes/lara-dark-teal/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';  // icons
import 'primeflex/primeflex.css';     // flexbox utilities

// our custom styles
import './styles.css';

// start the app and mount it to the #root div in index.html
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* wrap everything in Web3Provider so all components can access wallet/contracts */}
    <Web3Provider>
      <App />
    </Web3Provider>
  </React.StrictMode>
);
