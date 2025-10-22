import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { LanguageProvider } from './context/LanguageContext';
import './css/font/fa_nunito.css';
import './css/customize/style.css';
import './index.css';


createRoot(document.getElementById('root')!).render(
  // <StrictMode>
    <LanguageProvider>
    <App />
    </LanguageProvider>
  // </StrictMode>
);
