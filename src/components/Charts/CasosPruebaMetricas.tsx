'use client';

import React from 'react';
import { MetricasCalidadChart } from './MetricasCalidadChart';
import { useMetricasCasosPrueba } from '@/hooks/useMetricas';

export const CasosPruebaMetricas: React.FC = () => {
  const { metricasCasosPrueba: casosPrueba, isLoading, isError } = useMetricasCasosPrueba();

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

  if (isError || !casosPrueba.length) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-gray-500">
            {isError ? 'Error cargando métricas de casos de prueba' : 'No hay datos de casos de prueba disponibles'}
          </p>
        </div>
      </div>
    );
  }
  const proyectos = casosPrueba.map(c => c.proyecto);
  const ejecutados = casosPrueba.map(c => c.ejecutados);
  const pasaron = casosPrueba.map(c => c.pasaron);
  const fallaron = casosPrueba.map(c => c.fallaron);
  const pendientes = casosPrueba.map(c => c.pendientes);

  // Calcular porcentajes de éxito
  const porcentajesExito = casosPrueba.map(c => 
    c.ejecutados > 0 ? Math.round((c.pasaron / c.ejecutados) * 100) : 0
  );

  // Totales para gráfico de dona
  const totalPasaron = pasaron.reduce((a, b) => a + b, 0);
  const totalFallaron = fallaron.reduce((a, b) => a + b, 0);
  const totalPendientes = pendientes.reduce((a, b) => a + b, 0);

  const datosEstado = [totalPasaron, totalFallaron, totalPendientes];
  const etiquetasEstado = ['Pasaron', 'Fallaron', 'Pendientes'];

  // Calcular cobertura promedio
  const coberturaPromedio = Math.round(
    casosPrueba.reduce((acc, c) => {
      const cobertura = c.total > 0 ? (c.ejecutados / c.total) * 100 : 0;
      return acc + cobertura;
    }, 0) / casosPrueba.length
  );

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-600 text-sm font-medium">Cobertura Promedio</div>
          <div className="text-2xl font-bold text-blue-700">{coberturaPromedio}%</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-600 text-sm font-medium">Casos Exitosos</div>
          <div className="text-2xl font-bold text-green-700">{totalPasaron}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-600 text-sm font-medium">Casos Fallidos</div>
          <div className="text-2xl font-bold text-red-700">{totalFallaron}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras - Porcentaje de éxito por proyecto */}
        <MetricasCalidadChart
          tipo="barra"
          datos={porcentajesExito}
          etiquetas={proyectos}
          titulo="Porcentaje de Éxito por Proyecto (%)"
          color="#16a34a"
          altura={300}
        />

        {/* Gráfico de dona - Estado general de casos */}
        <MetricasCalidadChart
          tipo="dona"
          datos={datosEstado}
          etiquetas={etiquetasEstado}
          titulo="Estado General de Casos de Prueba"
          altura={300}
        />
      </div>

      {/* Gráfico de línea - Casos ejecutados vs fallidos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MetricasCalidadChart
          tipo="linea"
          datos={ejecutados}
          etiquetas={proyectos}
          titulo="Casos Ejecutados por Proyecto"
          color="#2563eb"
          altura={300}
        />

        <MetricasCalidadChart
          tipo="barra"
          datos={fallaron}
          etiquetas={proyectos}
          titulo="Casos Fallidos por Proyecto"
          color="#dc2626"
          altura={300}
        />
      </div>

      {/* Tabla de resumen */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Resumen Detallado por Proyecto</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proyecto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ejecutados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pasaron
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fallaron
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % Éxito
                </th>
              </tr>
            </thead>            <tbody className="bg-white divide-y divide-gray-200">
              {casosPrueba.map((caso, index) => {
                const porcentajeExito = porcentajesExito[index];
                let badgeColor;
                
                if (porcentajeExito >= 80) {
                  badgeColor = 'bg-green-100 text-green-800';
                } else if (porcentajeExito >= 60) {
                  badgeColor = 'bg-yellow-100 text-yellow-800';
                } else {
                  badgeColor = 'bg-red-100 text-red-800';
                }

                return (
                  <tr key={`caso-${caso.proyecto}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {caso.proyecto}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caso.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {caso.ejecutados}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {caso.pasaron}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {caso.fallaron}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badgeColor}`}>
                        {porcentajeExito}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
