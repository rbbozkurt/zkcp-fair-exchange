import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.tsx';
import './ i18n.ts';

import WagmiRootProvider from './providers/WagmiProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiRootProvider>
      <App />
    </WagmiRootProvider>
  </StrictMode>
);
