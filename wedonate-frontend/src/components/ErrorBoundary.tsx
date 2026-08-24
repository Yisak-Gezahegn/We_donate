import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import Button from './ui/Button';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isDark = document.documentElement.classList.contains('dark');
      return (
        <div className={cn("flex flex-col items-center justify-center p-8 min-h-[400px] text-center", isDark ? 'text-white' : 'text-gray-900')}>
          <div className="w-16 h-16 mx-auto mb-4 text-red-500 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className={cn("text-sm mb-6 max-w-md", isDark ? 'text-slate-400' : 'text-gray-500')}>
            {this.state.error?.message || "An unexpected error occurred while rendering this page."}
          </p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
