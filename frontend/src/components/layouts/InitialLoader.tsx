import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { LoadingOverlay } from '@/components/ui/loading-overlay';

export function InitialLoader({ children }: { children: React.ReactNode }) {
  const { isLoading: authLoading } = useAuth();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    if (authLoading) {
      startLoading('Loading your account...');
    } else {
      stopLoading();
    }
  }, [authLoading, startLoading, stopLoading]);

  if (authLoading) {
    return <LoadingOverlay fullScreen message="Loading your account..." />;
  }

  return <>{children}</>;
} 