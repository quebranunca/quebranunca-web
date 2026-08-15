import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ProvedorAutenticacao } from './contexts/AutenticacaoContexto';
import { ConfirmacaoProvider } from './contexts/ConfirmacaoContext';
import { NotificationProvider } from './contexts/NotificationContext'; 
import './assets/estilos.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <NotificationProvider>
        <ConfirmacaoProvider>
          <ProvedorAutenticacao>
            <App />
          </ProvedorAutenticacao>
        </ConfirmacaoProvider>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);
