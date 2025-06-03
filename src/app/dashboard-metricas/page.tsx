'use client';

import React, { useState } from 'react';
import { IncidentesMetricas } from '@/components/Charts/IncidentesMetricas';
import { CasosPruebaMetricas } from '@/components/Charts/CasosPruebaMetricas';
import { MetricasCalidadChart } from '@/components/Charts/MetricasCalidadChart';
import { useResumenMetricas, useMetricasIncidentes, useMetricasCasosPrueba } from '@/hooks/useMetricas';

export default function DashboardMetricas() {
  const [pestanaActiva, setPestanaActiva] = useState<'incidentes' | 'casos' | 'general'>('general');
  
  // Obtener datos reales
  const { resumen, isLoading: isLoadingResumen } = useResumenMetricas();
  const { metricasIncidentes, isLoading: isLoadingIncidentes } = useMetricasIncidentes(6);
  const { metricasCasosPrueba, isLoading: isLoadingCasos } = useMetricasCasosPrueba();  // Datos para gráfico de tendencia general (si hay datos disponibles)
  const meses = metricasIncidentes.map(d => d.mes);
  const incidentesPorMes = metricasIncidentes.map(d => d.total);
  const casosPorMes = metricasCasosPrueba.map(c => c.total);

  // Mostrar loading si algún dato principal está cargando
  if (isLoadingResumen || isLoadingIncidentes || isLoadingCasos) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Métricas de Calidad
          </h1>
          <p className="text-gray-600">
            Análisis interactivo de incidentes, casos de prueba y métricas de calidad
          </p>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Incidentes</p>
                <p className="text-2xl font-bold text-red-600">{resumen.totalIncidentes}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 text-xl">🐛</span>
              </div>
            </div>
          </div>          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Casos de Prueba</p>
                <p className="text-2xl font-bold text-blue-600">{resumen.totalCasosPrueba}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">% Éxito Pruebas</p>
                <p className="text-2xl font-bold text-green-600">{resumen.porcentajeExito}%</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
              </div>
            </div>
          </div>          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Casos Ejecutados</p>
                <p className="text-2xl font-bold text-purple-600">{resumen.casosEjecutados}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">⚡</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setPestanaActiva('general')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  pestanaActiva === 'general'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Vista General
              </button>
              <button
                onClick={() => setPestanaActiva('incidentes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  pestanaActiva === 'incidentes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Incidentes
              </button>
              <button
                onClick={() => setPestanaActiva('casos')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  pestanaActiva === 'casos'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Casos de Prueba
              </button>
            </nav>
          </div>
        </div>

        {/* Contenido de las pestañas */}
        <div className="space-y-6">
          {pestanaActiva === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MetricasCalidadChart
                  tipo="linea"
                  datos={incidentesPorMes}
                  etiquetas={meses}
                  titulo="Tendencia de Incidentes por Mes"
                  color="#dc2626"
                  altura={300}
                />
                
                <MetricasCalidadChart
                  tipo="barra"
                  datos={casosPorMes}
                  etiquetas={meses}
                  titulo="Casos de Prueba Creados por Mes"
                  color="#2563eb"
                  altura={300}
                />
              </div>              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Resumen Ejecutivo
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {resumen.totalCasosPrueba > 0 ? Math.round((resumen.casosEjecutados / resumen.totalCasosPrueba) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-600">Cobertura de Pruebas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600 mb-2">
                      {Math.round(resumen.totalIncidentes / 6)}
                    </div>
                    <div className="text-sm text-gray-600">Incidentes Promedio/Mes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {resumen.porcentajeExito}%
                    </div>
                    <div className="text-sm text-gray-600">Tasa de Éxito General</div>
                  </div>
                </div>
              </div>
            </div>
          )}          {pestanaActiva === 'incidentes' && (
            <IncidentesMetricas />
          )}

          {pestanaActiva === 'casos' && (
            <CasosPruebaMetricas />
          )}
        </div>
      </div>
    </div>
  );
}
