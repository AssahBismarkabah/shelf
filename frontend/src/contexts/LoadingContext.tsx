import { createContext, useContext, useState, ReactNode } from 'react';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

interface LoadingContextType {
  startLoading: (message?: string) => void;
  stopLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>();

  const startLoading = (msg?: string) => {
    setMessage(msg);
    setIsLoading(true);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setMessage(undefined);
  };

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {isLoading && <LoadingOverlay fullScreen message={message} />}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
} 