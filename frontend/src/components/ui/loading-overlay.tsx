import { Spinner } from "./spinner";

interface LoadingOverlayProps {
  fullScreen?: boolean;
  message?: string;
}

export function LoadingOverlay({ fullScreen = false, message }: LoadingOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm ${
        fullScreen ? 'fixed inset-0' : 'absolute'
      }`}
    >
      <div className="flex flex-col items-center space-y-4">
        <Spinner size="lg" className="h-12 w-12" />
        {message && (
          <p className="text-lg font-medium text-foreground/80">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

// Also export a simpler centered spinner for inline usage
export function CenteredSpinner() {
  return (
    <div className="flex h-[200px] w-full items-center justify-center">
      <Spinner size="md" />
    </div>
  );
} 