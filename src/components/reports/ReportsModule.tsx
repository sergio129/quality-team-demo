'use client';

import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { Project } from '@/models/Project';
import ExportToExcelButton from '../projects/ExportToExcelButton';
import { createSafeDate } from '@/utils/dateUtils';

interface ReportsModuleProps {
  projects: Project[];
  teams: string[];
  analysts: string[];
}

const ReportsModule: React.FC<ReportsModuleProps> = ({ projects, teams, analysts }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    dateRange: 'month' as 'week' | 'month' | 'year' | 'custom' | 'all',
    startDate: '',
    endDate: '',
    teams: [] as string[],
    analysts: [] as string[],
    states: [] as string[],
    cells: [] as string[]
  });

  // Estados únicos disponibles
  const uniqueStates = [...new Set(projects.map(p => p.estadoCalculado || p.estado).filter(Boolean))] as string[];
  const uniqueCells = [...new Set(projects.map(p => p.celula).filter(Boolean))] as string[];

  // Filtrar proyectos según criterios seleccionados
  const getFilteredProjects = () => {
    let filtered = [...projects];

    // Filtro por rango de fechas
    if (selectedFilters.dateRange !== 'all') {
      const today = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (selectedFilters.dateRange) {
        case 'week':
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay() + 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'year':
          startDate = new Date(today.getFullYear(), 0, 1);
          endDate = new Date(today.getFullYear(), 11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'custom':
          if (!selectedFilters.startDate || !selectedFilters.endDate) return filtered;
          startDate = new Date(selectedFilters.startDate);
          endDate = new Date(selectedFilters.endDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          return filtered;
      }

      if (selectedFilters.dateRange !== 'custom' || (selectedFilters.startDate && selectedFilters.endDate)) {
        filtered = filtered.filter(project => {
          const fechaEntrega = project.fechaEntrega ? createSafeDate(project.fechaEntrega) : null;
          const fechaCertificacion = project.fechaCertificacion ? createSafeDate(project.fechaCertificacion) : null;
          
          if (!fechaEntrega) return false;
          fechaEntrega.setHours(0, 0, 0, 0);
          if (fechaCertificacion) fechaCertificacion.setHours(0, 0, 0, 0);

          return (
            (fechaEntrega >= startDate && fechaEntrega <= endDate) ||
            (fechaCertificacion && fechaCertificacion >= startDate && fechaCertificacion <= endDate)
          );
        });
      }
    }

    // Filtro por equipos
    if (selectedFilters.teams.length > 0) {
      filtered = filtered.filter(project => 
        selectedFilters.teams.includes(project.equipo || '')
      );
    }

    // Filtro por analistas
    if (selectedFilters.analysts.length > 0) {
      filtered = filtered.filter(project => 
        selectedFilters.analysts.includes(project.analistaProducto || '')
      );
    }

    // Filtro por estados
    if (selectedFilters.states.length > 0) {
      filtered = filtered.filter(project => 
        selectedFilters.states.includes(project.estadoCalculado || project.estado || '')
      );
    }

    // Filtro por células
    if (selectedFilters.cells.length > 0) {
      filtered = filtered.filter(project => 
        selectedFilters.cells.includes(project.celula || '')
      );
    }

    return filtered;
  };

  const filteredProjects = getFilteredProjects();

  // Estadísticas del reporte
  const reportStats = {
    totalProjects: filteredProjects.length,
    totalHours: filteredProjects.reduce((sum, p) => sum + (p.horas || 0), 0),
    avgDays: filteredProjects.length > 0 
      ? Math.round(filteredProjects.reduce((sum, p) => sum + (p.dias || 0), 0) / filteredProjects.length)
      : 0,
    delayedProjects: filteredProjects.filter(p => (p.diasRetraso || 0) > 0).length
  };

  const handleFilterChange = (filterType: string, value: any) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleMultiSelectChange = (filterType: 'teams' | 'analysts' | 'states' | 'cells', value: string, checked: boolean) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: checked 
        ? [...prev[filterType], value]
        : prev[filterType].filter(item => item !== value)
    }));
  };

  const clearAllFilters = () => {
    setSelectedFilters({
      dateRange: 'all',
      startDate: '',
      endDate: '',
      teams: [],
      analysts: [],
      states: [],
      cells: []
    });
  };

  if (!isOpen) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          title="Abrir módulo de reportes"
        >
          <BarChart3 size={16} />
          <span>Reportes</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 size={24} />
              <div>
                <h2 className="text-2xl font-bold">Módulo de Reportes</h2>
                <p className="text-blue-100">Genera reportes personalizados con filtros avanzados</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-600">
                <FileText size={20} />
                <span className="font-medium">Proyectos</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{reportStats.totalProjects}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-600">
                <Clock size={20} />
                <span className="font-medium">Horas Total</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{reportStats.totalHours}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 text-purple-600">
                <TrendingUp size={20} />
                <span className="font-medium">Días Promedio</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{reportStats.avgDays}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-600">
                <Users size={20} />
                <span className="font-medium">Con Retraso</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{reportStats.delayedProjects}</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Filtros de Reporte</h3>
              <button
                onClick={clearAllFilters}
                className="ml-auto text-sm text-red-600 hover:text-red-700 underline"
              >
                Limpiar todos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Filtro de fechas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rango de Fechas
                </label>
                <select
                  value={selectedFilters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos los períodos</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                  <option value="year">Este año</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {/* Fechas personalizadas */}
              {selectedFilters.dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={selectedFilters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={selectedFilters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Filtro de equipos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Equipos ({selectedFilters.teams.length} seleccionados)
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {teams.map(team => (
                    <label key={team} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedFilters.teams.includes(team)}
                        onChange={(e) => handleMultiSelectChange('teams', team, e.target.checked)}
                        className="text-blue-600"
                      />
                      <span>{team}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de analistas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Analistas ({selectedFilters.analysts.length} seleccionados)
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {analysts.map(analyst => (
                    <label key={analyst} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedFilters.analysts.includes(analyst)}
                        onChange={(e) => handleMultiSelectChange('analysts', analyst, e.target.checked)}
                        className="text-blue-600"
                      />
                      <span>{analyst}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de estados */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estados ({selectedFilters.states.length} seleccionados)
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {uniqueStates.map(state => (
                    <label key={state} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedFilters.states.includes(state)}
                        onChange={(e) => handleMultiSelectChange('states', state, e.target.checked)}
                        className="text-blue-600"
                      />
                      <span>{state}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de células */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Células ({selectedFilters.cells.length} seleccionados)
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {uniqueCells.map(cell => (
                    <label key={cell} className="flex items-center gap-2 text-sm hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedFilters.cells.includes(cell)}
                        onChange={(e) => handleMultiSelectChange('cells', cell, e.target.checked)}
                        className="text-blue-600"
                      />
                      <span>{cell}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de exportación */}
          <div className="flex justify-center gap-4">
            <ExportToExcelButton
              projects={filteredProjects}
              exportFilterType="all"
              className="bg-green-600 hover:bg-green-700 px-6 py-3 text-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;
