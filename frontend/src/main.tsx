import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import axios from 'axios';
import { AuthProvider } from './context/AuthContext.tsx';
import { SettingsProvider } from './context/SettingsContext.tsx';

// Set global API base URL for production
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </SettingsProvider>
  </StrictMode>,
);
