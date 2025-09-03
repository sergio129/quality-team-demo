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
  Clock,
  X,
  CheckCircle,
  AlertTriangle,
  Target,
  Building2,
  UserCheck,
  MapPin
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
          className="group flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-medium"
          title="Abrir módulo de reportes"
        >
          <div className="p-1 bg-white bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all duration-200">
            <BarChart3 size={18} />
          </div>
          <span>Reportes Avanzados</span>
          <TrendingUp size={16} className="ml-1 opacity-70 group-hover:opacity-100 transition-opacity duration-200" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header Moderno */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 text-white p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white bg-opacity-10 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white bg-opacity-5 rounded-full"></div>
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white bg-opacity-20 rounded-xl backdrop-blur-sm">
                <BarChart3 size={28} />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">Módulo de Reportes</h2>
                <p className="text-indigo-100 text-lg">Genera reportes personalizados con filtros avanzados</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-xl transition-all duration-200 group"
              title="Cerrar módulo"
            >
              <X size={24} className="group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(95vh-160px)]">
          {/* Estadísticas rápidas mejoradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <FileText size={24} className="text-white" />
                </div>
                <TrendingUp size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Proyectos</p>
                <p className="text-3xl font-bold text-blue-700">{reportStats.totalProjects}</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Clock size={24} className="text-white" />
                </div>
                <Target size={16} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Horas Totales</p>
                <p className="text-3xl font-bold text-emerald-700">{reportStats.totalHours}</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border border-purple-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <Calendar size={24} className="text-white" />
                </div>
                <TrendingUp size={16} className="text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 mb-1">Días Promedio</p>
                <p className="text-3xl font-bold text-purple-700">{reportStats.avgDays}</p>
              </div>
            </div>

            <div className="group bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-2xl border border-red-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-500 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <AlertTriangle size={24} className="text-white" />
                </div>
                <CheckCircle size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Con Retraso</p>
                <p className="text-3xl font-bold text-red-700">{reportStats.delayedProjects}</p>
              </div>
            </div>
          </div>

          {/* Filtros mejorados */}
          <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-8 mb-8 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Filter size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Filtros de Reporte</h3>
                  <p className="text-sm text-gray-600">Personaliza tu reporte con estos criterios</p>
                </div>
              </div>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors duration-200 font-medium border border-red-200"
              >
                Limpiar todos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Filtro de fechas mejorado */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={18} className="text-indigo-600" />
                  <label className="text-sm font-semibold text-gray-700">Rango de Fechas</label>
                </div>
                <select
                  value={selectedFilters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                >
                  <option value="all">Todos los períodos</option>
                  <option value="week">Esta semana</option>
                  <option value="month">Este mes</option>
                  <option value="year">Este año</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {/* Fechas personalizadas mejoradas */}
              {selectedFilters.dateRange === 'custom' && (
                <>
                  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={18} className="text-indigo-600" />
                      <label className="text-sm font-semibold text-gray-700">Fecha Inicio</label>
                    </div>
                    <input
                      type="date"
                      value={selectedFilters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                    />
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar size={18} className="text-indigo-600" />
                      <label className="text-sm font-semibold text-gray-700">Fecha Fin</label>
                    </div>
                    <input
                      type="date"
                      value={selectedFilters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                    />
                  </div>
                </>
              )}

              {/* Filtro de equipos mejorado */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-indigo-600" />
                    <label className="text-sm font-semibold text-gray-700">Equipos</label>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">
                    {selectedFilters.teams.length} seleccionados
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {teams.map(team => (
                    <label key={team} className="flex items-center gap-3 text-sm hover:bg-white p-2 rounded-lg cursor-pointer transition-colors duration-150">
                      <input
                        type="checkbox"
                        checked={selectedFilters.teams.includes(team)}
                        onChange={(e) => handleMultiSelectChange('teams', team, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                      <span className="text-gray-700">{team}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de analistas mejorado */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck size={18} className="text-indigo-600" />
                    <label className="text-sm font-semibold text-gray-700">Analistas</label>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">
                    {selectedFilters.analysts.length} seleccionados
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {analysts.map(analyst => (
                    <label key={analyst} className="flex items-center gap-3 text-sm hover:bg-white p-2 rounded-lg cursor-pointer transition-colors duration-150">
                      <input
                        type="checkbox"
                        checked={selectedFilters.analysts.includes(analyst)}
                        onChange={(e) => handleMultiSelectChange('analysts', analyst, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                      <span className="text-gray-700">{analyst}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de estados mejorado */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-indigo-600" />
                    <label className="text-sm font-semibold text-gray-700">Estados</label>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">
                    {selectedFilters.states.length} seleccionados
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {uniqueStates.map(state => (
                    <label key={state} className="flex items-center gap-3 text-sm hover:bg-white p-2 rounded-lg cursor-pointer transition-colors duration-150">
                      <input
                        type="checkbox"
                        checked={selectedFilters.states.includes(state)}
                        onChange={(e) => handleMultiSelectChange('states', state, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                      <span className="text-gray-700">{state}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filtro de células mejorado */}
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-indigo-600" />
                    <label className="text-sm font-semibold text-gray-700">Células</label>
                  </div>
                  <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full font-medium">
                    {selectedFilters.cells.length} seleccionados
                  </span>
                </div>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                  {uniqueCells.map(cell => (
                    <label key={cell} className="flex items-center gap-3 text-sm hover:bg-white p-2 rounded-lg cursor-pointer transition-colors duration-150">
                      <input
                        type="checkbox"
                        checked={selectedFilters.cells.includes(cell)}
                        onChange={(e) => handleMultiSelectChange('cells', cell, e.target.checked)}
                        className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                      <span className="text-gray-700">{cell}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de exportación mejorados */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-500 rounded-2xl">
                    <Download size={28} className="text-white" />
                  </div>
                </div>
                <h4 className="text-lg font-bold text-green-800 mb-2">Exportar Reporte</h4>
                <p className="text-sm text-green-600 mb-4">
                  Descarga un archivo Excel con {filteredProjects.length} proyecto{filteredProjects.length !== 1 ? 's' : ''} filtrado{filteredProjects.length !== 1 ? 's' : ''}
                </p>
                <ExportToExcelButton
                  projects={filteredProjects}
                  exportFilterType="all"
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;
