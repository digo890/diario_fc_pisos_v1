import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getFormByObraId } from '../utils/database';
import type { Obra, FormData } from '../types';

interface Props {
  obras: Obra[];
}

interface DashboardData {
  totalObras: number;
  formulariosPreenchidos: number;
  formulariosValidados: number;
  formulariosEmRevisao: number;
  obrasNovas: number;
  obrasAndamento: number;
  obrasConcluidas: number;
}

const COLORS = {
  primary: '#FD5521',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  gray: '#6b7280',
};

const ResultadosDashboard: React.FC<Props> = ({ obras }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalObras: 0,
    formulariosPreenchidos: 0,
    formulariosValidados: 0,
    formulariosEmRevisao: 0,
    obrasNovas: 0,
    obrasAndamento: 0,
    obrasConcluidas: 0,
  });
  const [formsData, setFormsData] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [obras]);

  const loadDashboardData = async () => {
    setLoading(true);
    
    // Carregar todos os formulários
    const formsPromises = obras.map(obra => getFormByObraId(obra.id));
    const forms = await Promise.all(formsPromises);
    const validForms = forms.filter(f => f !== null) as FormData[];
    setFormsData(validForms);

    // Calcular estatísticas
    const formulariosPreenchidos = validForms.length;
    const formulariosValidados = obras.filter(o => o.status === 'finalizado' || o.status === 'enviado_admin' || o.status === 'concluido').length;
    const formulariosEmRevisao = obras.filter(o => o.status === 'enviado_preposto' || o.status === 'em_revisao').length;
    const obrasNovas = obras.filter(o => o.status === 'novo').length;
    const obrasAndamento = obras.filter(o => o.status !== 'novo' && o.status !== 'finalizado' && o.status !== 'enviado_admin' && o.status !== 'concluido').length;
    const obrasConcluidas = obras.filter(o => o.status === 'finalizado' || o.status === 'enviado_admin' || o.status === 'concluido').length;

    setDashboardData({
      totalObras: obras.length,
      formulariosPreenchidos,
      formulariosValidados,
      formulariosEmRevisao,
      obrasNovas,
      obrasAndamento,
      obrasConcluidas,
    });

    setLoading(false);
  };

  // Preparar dados para gráfico de pizza - Status das Obras
  const statusChartData = [
    { name: 'Novas', value: dashboardData.obrasNovas, color: COLORS.gray },
    { name: 'Em Andamento', value: dashboardData.obrasAndamento, color: COLORS.warning },
    { name: 'Concluídas', value: dashboardData.obrasConcluidas, color: COLORS.success },
  ].filter(item => item.value > 0);

  // Preparar dados para gráfico de barras - Formulários
  const formulariosChartData = [
    { name: 'Preenchidos', value: dashboardData.formulariosPreenchidos, color: COLORS.info },
    { name: 'Em Revisão', value: dashboardData.formulariosEmRevisao, color: COLORS.warning },
    { name: 'Validados', value: dashboardData.formulariosValidados, color: COLORS.success },
  ];

  // Calcular taxa de conclusão
  const taxaConclusao = dashboardData.totalObras > 0 
    ? Math.round((dashboardData.formulariosValidados / dashboardData.totalObras) * 100) 
    : 0;

  // Análise temporal - obras criadas nos últimos 30 dias
  const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const obrasRecentes = obras.filter(o => o.createdAt >= last30Days).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Carregando dados analíticos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Obras */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#FD5521]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#FD5521]" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.totalObras}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total de Obras
          </div>
        </div>

        {/* Formulários Preenchidos */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.formulariosPreenchidos}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Formulários Preenchidos
          </div>
        </div>

        {/* Formulários em Revisão */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.formulariosEmRevisao}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Em Revisão
          </div>
        </div>

        {/* Formulários Validados */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.formulariosValidados}
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Validados
          </div>
        </div>
      </div>

      {/* Cards de Taxa de Conclusão e Obras Recentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Taxa de Conclusão */}
        <div className="bg-gradient-to-br from-[#FD5521] to-[#E54A1D] rounded-lg p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6" />
            <div className="text-lg font-semibold">Taxa de Conclusão</div>
          </div>
          <div className="text-5xl font-bold mb-2">{taxaConclusao}%</div>
          <div className="text-sm opacity-90">
            {dashboardData.formulariosValidados} de {dashboardData.totalObras} obras finalizadas
          </div>
        </div>

        {/* Obras Recentes */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-6 h-6 text-[#FD5521]" />
            <div className="text-lg font-semibold text-gray-900 dark:text-white">Últimos 30 dias</div>
          </div>
          <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {obrasRecentes}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            novas obras cadastradas
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status das Obras */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Status das Obras
          </h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              Nenhum dado disponível
            </div>
          )}
        </div>

        {/* Gráfico de Formulários */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Status dos Formulários
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formulariosChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {formulariosChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumo de Análise */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Resumo Analítico
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">Obras em Andamento</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.obrasAndamento}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {dashboardData.totalObras > 0 
                ? `${Math.round((dashboardData.obrasAndamento / dashboardData.totalObras) * 100)}%`
                : '0%'} do total
            </div>
          </div>

          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">Obras Novas</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.obrasNovas}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Aguardando início
            </div>
          </div>

          <div>
            <div className="text-gray-600 dark:text-gray-400 mb-2">Taxa de Validação</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dashboardData.formulariosPreenchidos > 0
                ? Math.round((dashboardData.formulariosValidados / dashboardData.formulariosPreenchidos) * 100)
                : 0}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Formulários aprovados
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Atenção */}
      {/* Removido */}
    </div>
  );
};

export default ResultadosDashboard;