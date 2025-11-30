import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { Web3Provider } from './context/Web3Context.jsx';
import { TransactionLogProvider } from './context/TransactionLogContext.jsx';

import 'primereact/resources/themes/lara-dark-teal/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';

import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TransactionLogProvider>
      <Web3Provider>
        <App />
      </Web3Provider>
    </TransactionLogProvider>
  </React.StrictMode>
);
