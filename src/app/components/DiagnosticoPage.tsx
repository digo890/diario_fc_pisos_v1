import React, { useState } from 'react';
import { Search } from 'lucide-react';

const DiagnosticoPage: React.FC = () => {
  const [token, setToken] = useState('45fb57e4-b013-4b13-895b-e08bbcedd90a');
  const [resultado, setResultado] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const diagnosticar = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://cjwuooaappcnsqxgdpta.supabase.co/functions/v1/make-server-1ff231a2/debug/token/${token}`,
        {
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqd3Vvb2FhcHBjbnNxeGdkcHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY0NTYwMzYsImV4cCI6MjA1MjAzMjAzNn0.8yR3pG8r9KM0xCqN5jLb4wZHvF6tDnEm2sRuP0aIcYg'
          }
        }
      );
      const data = await response.json();
      setResultado(data);
    } catch (error) {
      setResultado({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          🔍 Diagnóstico de Token
        </h1>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token de Validação
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Cole o token aqui..."
            />
            <button
              onClick={diagnosticar}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {loading ? 'Buscando...' : 'Diagnosticar'}
            </button>
          </div>
        </div>

        {resultado && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📊 Resultado do Diagnóstico
            </h2>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-auto text-sm text-gray-800 dark:text-gray-200">
              {JSON.stringify(resultado, null, 2)}
            </pre>

            {/* Interpretação do resultado */}
            {resultado.obra_encontrada !== undefined && (
              <div className="mt-6 space-y-3">
                <div className={`p-3 rounded-lg ${resultado.obra_encontrada ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  <strong className={resultado.obra_encontrada ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                    {resultado.obra_encontrada ? '✅ Obra encontrada' : '❌ Obra NÃO encontrada'}
                  </strong>
                  {resultado.obra_encontrada && (
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      ID: {resultado.obra_id} | Status: {resultado.obra_status}
                    </p>
                  )}
                </div>

                <div className={`p-3 rounded-lg ${resultado.formulario_encontrado ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                  <strong className={resultado.formulario_encontrado ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                    {resultado.formulario_encontrado ? '✅ Formulário encontrado' : '❌ Formulário NÃO encontrado'}
                  </strong>
                </div>

                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900">
                  <strong className="text-blue-800 dark:text-blue-200">
                    📊 Total de obras: {resultado.total_obras}
                  </strong>
                  <br />
                  <strong className="text-blue-800 dark:text-blue-200">
                    📋 Total de formulários: {resultado.total_formularios}
                  </strong>
                </div>

                {!resultado.formulario_encontrado && resultado.obra_encontrada && (
                  <div className="p-4 rounded-lg bg-yellow-100 dark:bg-yellow-900">
                    <strong className="text-yellow-800 dark:text-yellow-200">
                      ⚠️ PROBLEMA IDENTIFICADO:
                    </strong>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-2">
                      A obra existe, mas o formulário não foi criado no backend.
                      <br />
                      Isso acontece quando o encarregado clica em "Enviar para preposto" sem ter salvo o formulário antes.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosticoPage;
