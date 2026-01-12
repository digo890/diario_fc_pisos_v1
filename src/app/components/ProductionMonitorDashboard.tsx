import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, XCircle, Download, Trash2, RefreshCw } from 'lucide-react';
import {
  getStoredErrors,
  clearStoredErrors,
  checkBackendHealth,
  generateDiagnosticReport,
  exportErrorsAsJSON,
  exportErrorsAsCSV,
  ErrorCategory,
  type ProductionError,
  type HealthCheckResult
} from '../utils/productionMonitor';

interface ProductionMonitorDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductionMonitorDashboard({ isOpen, onClose }: ProductionMonitorDashboardProps) {
  const [errors, setErrors] = useState<ProductionError[]>([]);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [selectedError, setSelectedError] = useState<ProductionError | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadData = async () => {
    const storedErrors = getStoredErrors();
    setErrors(storedErrors);
    
    const healthStatus = await checkBackendHealth();
    setHealth(healthStatus);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(loadData, 5000); // Atualizar a cada 5s
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearErrors = () => {
    if (confirm('Deseja realmente limpar todos os erros registrados?')) {
      clearStoredErrors();
      setErrors([]);
      setSelectedError(null);
    }
  };

  const handleExportJSON = () => {
    const json = exportErrorsAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-errors-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = exportErrorsAsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `production-errors-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewDiagnostic = () => {
    const report = generateDiagnosticReport();
    alert(report);
  };

  if (!isOpen) return null;

  const categoryColors: Record<ErrorCategory, string> = {
    [ErrorCategory.EDGE_FUNCTION]: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    [ErrorCategory.AUTH]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    [ErrorCategory.RLS]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    [ErrorCategory.QUERY]: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    [ErrorCategory.SECRET]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    [ErrorCategory.NETWORK]: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    [ErrorCategory.UNKNOWN]: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  };

  const categoryEmojis: Record<ErrorCategory, string> = {
    [ErrorCategory.EDGE_FUNCTION]: '🔥',
    [ErrorCategory.AUTH]: '🔐',
    [ErrorCategory.RLS]: '🛡️',
    [ErrorCategory.QUERY]: '📊',
    [ErrorCategory.SECRET]: '🔑',
    [ErrorCategory.NETWORK]: '🌐',
    [ErrorCategory.UNKNOWN]: '❓'
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🚨 Monitor de Produção
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Detecta e diagnostica erros de Edge Functions, Auth, RLS, Queries e mais
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Health Status */}
        {health && (
          <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status do Backend
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    autoRefresh
                      ? 'bg-[#FD5521] text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {autoRefresh ? '🔄 Auto' : 'Manual'}
                </button>
                <button
                  onClick={loadData}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  title="Atualizar agora"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Overall Status */}
              <div className={`p-4 rounded-lg ${
                health.overall === 'healthy'
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : health.overall === 'degraded'
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {health.overall === 'healthy' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : health.overall === 'degraded' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    health.overall === 'healthy'
                      ? 'text-green-700 dark:text-green-400'
                      : health.overall === 'degraded'
                      ? 'text-yellow-700 dark:text-yellow-400'
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    {health.overall === 'healthy' ? 'Saudável' : health.overall === 'degraded' ? 'Degradado' : 'Fora do ar'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Status Geral</p>
              </div>

              {/* Individual Checks */}
              {Object.entries({
                edgeFunctions: 'Edge Functions',
                auth: 'Auth',
                database: 'Database',
                storage: 'Storage'
              }).map(([key, label]) => {
                const isHealthy = health.checks[key as keyof typeof health.checks];
                return (
                  <div
                    key={key}
                    className={`p-4 rounded-lg ${
                      isHealthy
                        ? 'bg-green-50 dark:bg-green-900/10'
                        : 'bg-red-50 dark:bg-red-900/10'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {isHealthy ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      <span className={`text-xs font-medium ${
                        isHealthy
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-red-700 dark:text-red-400'
                      }`}>
                        {isHealthy ? 'OK' : 'Erro'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap gap-2">
          <button
            onClick={handleViewDiagnostic}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            📋 Ver Diagnóstico
          </button>
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar JSON
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={handleClearErrors}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium flex items-center gap-2 ml-auto"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Tudo
          </button>
        </div>

        {/* Errors List */}
        <div className="flex-1 overflow-y-auto p-6">
          {errors.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
              <p className="text-gray-600 dark:text-gray-400">
                ✅ Nenhum erro registrado! Sistema funcionando normalmente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {errors.map((error, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedError(error)}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${categoryColors[error.category]}`}>
                          {categoryEmojis[error.category]} {error.category}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(error.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                        {error.message}
                      </p>
                      {error.context && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          {error.context.url && (
                            <p>URL: {error.context.url}</p>
                          )}
                          {error.context.statusCode && (
                            <p>Status: {error.context.statusCode}</p>
                          )}
                          {error.context.method && (
                            <p>Método: {error.context.method}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Detail Modal */}
        {selectedError && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Detalhes do Erro
                </h3>
                <button
                  onClick={() => setSelectedError(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria
                  </p>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${categoryColors[selectedError.category]}`}>
                    {categoryEmojis[selectedError.category]} {selectedError.category}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Timestamp
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(selectedError.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mensagem
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    {selectedError.message}
                  </p>
                </div>
                {selectedError.stack && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Stack Trace
                    </p>
                    <pre className="text-xs text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                      {selectedError.stack}
                    </pre>
                  </div>
                )}
                {selectedError.context && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Contexto
                    </p>
                    <pre className="text-xs text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                      {JSON.stringify(selectedError.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
