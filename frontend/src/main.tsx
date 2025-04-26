
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext';
import { DocumentProvider } from './contexts/DocumentContext';
import './index.css';

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <DocumentProvider>
      <App />
    </DocumentProvider>
  </AuthProvider>
);
