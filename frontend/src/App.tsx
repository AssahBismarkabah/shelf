import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { InitialLoader } from '@/components/layouts/InitialLoader';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LoadingProvider>
          <InitialLoader>
            <AppRoutes />
        <Toaster />
          </InitialLoader>
        </LoadingProvider>
      </AuthProvider>
        </BrowserRouter>
);
}

export default App;
