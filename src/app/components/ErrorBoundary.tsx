import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { safeError } from '../utils/logSanitizer';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error para monitoramento
    safeError('🔴 ErrorBoundary capturou erro:', { error, errorInfo });
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Usar fallback customizado se fornecido
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // UI padrão de erro
      return (
        <div className="min-h-screen bg-[#EDEFE4] dark:bg-gray-950 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              {/* Ícone de erro */}
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>

              {/* Título */}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Algo deu errado
              </h1>

              {/* Mensagem */}
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ocorreu um erro inesperado no aplicativo. Tente recarregar a página.
              </p>

              {/* Detalhes do erro (somente em desenvolvimento) */}
              {this.state.error && import.meta.env.DEV && (
                <details className="w-full mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detalhes técnicos
                  </summary>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs font-mono overflow-auto max-h-48">
                    <p className="text-red-600 dark:text-red-400 font-semibold mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                    {this.state.errorInfo && (
                      <pre className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mt-4">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Botões de ação */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Tentar novamente
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-3 bg-[#FD5521] text-white rounded-lg font-medium hover:bg-[#E54A1D] transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Recarregar
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Adicionar display name
ErrorBoundary.displayName = 'ErrorBoundary';

export default ErrorBoundary;