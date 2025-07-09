'use client';

import React from 'react';
import { MetricasCalidadChart } from './MetricasCalidadChart';
import { useMetricasIncidentes } from '@/hooks/useMetricas';

interface IncidentesMetricasProps {
  mesesAtras?: number;
}

export const IncidentesMetricas: React.FC<IncidentesMetricasProps> = ({ mesesAtras = 6 }) => {
  const { metricasIncidentes: incidentes, isLoading, isError } = useMetricasIncidentes(mesesAtras);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 rounded"></div>
            <div className="h-80 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !incidentes.length) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">
            {isError ? 'Error cargando métricas de incidentes' : 'No hay datos de incidentes disponibles'}
          </p>
        </div>
      </div>
    );
  }
  const meses = incidentes.map(i => i.mes);
  const totales = incidentes.map(i => i.total);
  const criticos = incidentes.map(i => i.criticos);
  const altos = incidentes.map(i => i.altos);
  const medios = incidentes.map(i => i.medios);
  const bajos = incidentes.map(i => i.bajos);

  // Datos para gráfico de dona de severidad
  const totalCriticos = criticos.reduce((a, b) => a + b, 0);
  const totalAltos = altos.reduce((a, b) => a + b, 0);
  const totalMedios = medios.reduce((a, b) => a + b, 0);
  const totalBajos = bajos.reduce((a, b) => a + b, 0);

  const datosSeveridad = [totalCriticos, totalAltos, totalMedios, totalBajos];
  const etiquetasSeveridad = ['Críticos', 'Altos', 'Medios', 'Bajos'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de línea - Tendencia total de incidentes */}
        <MetricasCalidadChart
          tipo="linea"
          datos={totales}
          etiquetas={meses}
          titulo="Tendencia Total de Incidentes"
          color="#dc2626"
          altura={300}
        />

        {/* Gráfico de dona - Distribución por severidad */}
        <MetricasCalidadChart
          tipo="dona"
          datos={datosSeveridad}
          etiquetas={etiquetasSeveridad}
          titulo="Distribución por Severidad"
          altura={300}
        />
      </div>

      {/* Gráfico de barras - Incidentes críticos por mes */}
      <MetricasCalidadChart
        tipo="barra"
        datos={criticos}
        etiquetas={meses}
        titulo="Incidentes Críticos por Mes"
        color="#dc2626"
        altura={350}
      />

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 text-sm font-medium">Críticos</div>
          <div className="text-2xl font-bold text-red-700">{totalCriticos}</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-orange-600 text-sm font-medium">Altos</div>
          <div className="text-2xl font-bold text-orange-700">{totalAltos}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-yellow-600 text-sm font-medium">Medios</div>
          <div className="text-2xl font-bold text-yellow-700">{totalMedios}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">Bajos</div>
          <div className="text-2xl font-bold text-green-700">{totalBajos}</div>
        </div>
      </div>
    </div>
  );
};
