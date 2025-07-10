'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';
import { Project } from '@/models/Project';
import ExportToExcelButton from './ExportToExcelButton';

interface AdvancedFiltersPanelProps {
  filterEquipo: string;
  setFilterEquipo: (value: string) => void;
  filterAnalista: string;
  setFilterAnalista: (value: string) => void;
  equipos: string[];
  analistas: string[];
  filterEstado: string;
  setFilterEstado: (value: string) => void;
  filterCelula: string;
  setFilterCelula: (value: string) => void;
  celulas: { id: string; name: string; teamId: string }[];
  teamsData?: { id: string; name: string }[]; // Lista completa de equipos con ID
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterAtrasado: string;
  setFilterAtrasado: (value: string) => void;
  resetFilters: () => void;  startDate?: Date;
  setStartDate?: React.Dispatch<React.SetStateAction<Date>>;
  endDate?: Date | null;
  setEndDate?: React.Dispatch<React.SetStateAction<Date | null>>;
  projects?: Project[]; // Lista de proyectos para exportar
  exportFilterType?: 'week' | 'month' | 'year' | 'all'; // Tipo de filtro para exportación
  setExportFilterType?: (value: 'week' | 'month' | 'year' | 'all') => void;
}

export default function AdvancedFiltersPanel({
  filterEquipo,
  setFilterEquipo,
  filterAnalista,
  setFilterAnalista,
  equipos,
  analistas,
  filterEstado,
  setFilterEstado,
  filterCelula,
  setFilterCelula,
  celulas,
  teamsData = [], // Valor por defecto de array vacío
  searchTerm,
  setSearchTerm,
  filterAtrasado,
  setFilterAtrasado,
  resetFilters,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  projects,
  exportFilterType,
  setExportFilterType
}: AdvancedFiltersPanelProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  
  // Efecto para hacer seguimiento a cambios en el equipo seleccionado
  useEffect(() => {
    if (filterEquipo) {
      const selectedTeam = teamsData.find(team => team.name === filterEquipo);
      
      // Si hay un cambio de equipo, y hay células filtradas disponibles para ese equipo,
      // pero no hay una célula seleccionada, resetear el filtro de células
      if (!filterCelula) {
        const availableCells = celulas.filter(celula => 
          selectedTeam ? celula.teamId === selectedTeam.id : false
        );
        
        if (availableCells.length === 0) {
          console.log('No hay células disponibles para este equipo');
        }
      }
    }
  }, [filterEquipo, teamsData, celulas, filterCelula]);
  
  // Calcula cuántos filtros están activos
  useEffect(() => {
    let count = 0;
    if (filterEquipo) count++;
    if (filterAnalista) count++;
    if (filterEstado) count++;
    if (filterCelula) count++;
    if (searchTerm) count++;
    if (filterAtrasado !== 'todos') count++;
    if (startDate) count++;
    if (endDate) count++;
    
    setActiveFilters(count);
  }, [filterEquipo, filterAnalista, filterEstado, filterCelula, searchTerm, filterAtrasado, startDate, endDate]);

  const estados = ['Todos', 'Pendiente', 'En Progreso', 'Completado', 'Certificado', 'Finalizado', 'Cancelado'];
  
  return (
    <div className="mb-4">
      {/* Botón para mostrar/ocultar filtros avanzados */}
      <div className="flex items-center">
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          aria-expanded={isPanelOpen}
          aria-controls="advanced-filters-panel"
        >
          <Filter size={16} />
          Filtros avanzados
          {isPanelOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {activeFilters > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full" aria-label={`${activeFilters} filtros activos`}>
              {activeFilters}
            </span>
          )}
        </button>
          {activeFilters > 0 && (
          <button
            onClick={() => {
              resetFilters();
              // Show visual confirmation
              const btn = document.getElementById('reset-filters-btn');
              if (btn) {
                btn.classList.add('bg-green-100', 'text-green-800');
                setTimeout(() => {
                  btn.classList.remove('bg-green-100', 'text-green-800');
                }, 1000);
              }
            }}
            id="reset-filters-btn"
            className="ml-4 flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Limpiar todos los filtros"
          >
            <X size={14} /> Limpiar filtros
          </button>
        )}
      </div>
      
      {/* Panel de filtros avanzados */}
      {isPanelOpen && (        <div 
          id="advanced-filters-panel" 
          className="mt-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm animate-in fade-in duration-300" 
          role="region" 
          aria-label="Panel de filtros avanzados"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Búsqueda por texto */}
            <div className="lg:col-span-3">
              <label htmlFor="filter-search" className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <input
                  id="filter-search"
                  type="text"
                  placeholder="Buscar por nombre, ID Jira, descripción..."
                  className="w-full border rounded-md pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={searchTerm}
                  onChange={(e) => {
                    // Using setTimeout for a basic debounce implementation
                    const value = e.target.value;
                    clearTimeout((window as any).searchTimeout);
                    (window as any).searchTimeout = setTimeout(() => {
                      setSearchTerm(value);
                    }, 300);
                  }}
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Filtro por equipo */}
            <div>
              <label htmlFor="filter-equipo" className="block text-sm font-medium text-gray-700 mb-1">
                Equipo
              </label>              <select
                id="filter-equipo"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterEquipo}
                onChange={(e) => {
                  const newTeamValue = e.target.value;
                  setFilterEquipo(newTeamValue);
                  
                  // Si se cambia de equipo, verificar si la célula actual sigue siendo válida
                  if (filterCelula && newTeamValue) {
                    const selectedTeam = teamsData.find(team => team.name === newTeamValue);
                    const selectedCellBelongsToNewTeam = celulas.some(
                      celula => celula.id === filterCelula && selectedTeam && celula.teamId === selectedTeam.id
                    );
                    
                    // Si la célula no pertenece al nuevo equipo, resetear el filtro de célula
                    if (!selectedCellBelongsToNewTeam) {
                      setFilterCelula('');
                    }
                  }
                }}
              >
                <option value="">Todos los equipos</option>
                {equipos.map(equipo => (
                  <option key={equipo} value={equipo}>{equipo}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro por célula (dependiente del equipo) */}
            <div>
              <label htmlFor="filter-celula" className="block text-sm font-medium text-gray-700 mb-1">
                Célula
              </label>              <div>
                <select
                  id="filter-celula"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterCelula}
                  onChange={(e) => setFilterCelula(e.target.value)}
                  disabled={!filterEquipo}
                >
                  <option value="">Todas las células</option>
                  {celulas
                    .filter(celula => {
                      if (!filterEquipo) return true;
                      // Buscar el ID del equipo correspondiente al nombre seleccionado
                      const selectedTeam = teamsData.find(team => team.name === filterEquipo);
                      return selectedTeam ? celula.teamId === selectedTeam.id : false;
                    })
                    .map(celula => (
                      <option key={celula.id} value={celula.id}>{celula.name}</option>
                    ))}
                </select>
                {filterEquipo && celulas
                  .filter(celula => {
                    const selectedTeam = teamsData.find(team => team.name === filterEquipo);
                    return selectedTeam ? celula.teamId === selectedTeam.id : false;
                  }).length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">No hay células disponibles para este equipo</p>
                )}
              </div>
            </div>
            
            {/* Filtro por analista */}
            <div>
              <label htmlFor="filter-analista" className="block text-sm font-medium text-gray-700 mb-1">
                Analista
              </label>
              <select
                id="filter-analista"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterAnalista}
                onChange={(e) => setFilterAnalista(e.target.value)}
              >
                <option value="">Todos los analistas</option>
                {analistas.map(analista => (
                  <option key={analista} value={analista}>{analista}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro por estado */}
            <div>
              <label htmlFor="filter-estado" className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                id="filter-estado"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
              >
                <option value="">Todos los estados</option>                {estados.map((estado) => (
                  <option key={estado} value={estado === 'Todos' ? '' : estado}>{estado}</option>
                ))}
              </select>
            </div>
            
            {/* Filtro por proyectos atrasados */}
            <div>
              <label htmlFor="filter-atrasado" className="block text-sm font-medium text-gray-700 mb-1">
                Proyectos atrasados
              </label>
              <select
                id="filter-atrasado"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={filterAtrasado}
                onChange={(e) => setFilterAtrasado(e.target.value)}
              >
                <option value="todos">Todos los proyectos</option>
                <option value="atrasados">Solo atrasados</option>
                <option value="no_atrasados">No atrasados</option>
              </select>
            </div>
            
            {/* Filtro por fecha de inicio */}
            {setStartDate && (
              <div>                <label htmlFor="filter-fecha-inicio" className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    Fecha inicio
                  </div>
                </label>
                <input
                  id="filter-fecha-inicio"
                  type="date"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={startDate ? new Date(startDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => {                    if (e.target.value) {
                      setStartDate(new Date(e.target.value));
                    }
                  }}
                />
              </div>
            )}
            
            {/* Filtro por fecha de fin */}
            {setEndDate && (
              <div>                <label htmlFor="filter-fecha-fin" className="block text-sm font-medium text-gray-700 mb-1">
                  <div className="flex items-center">
                    Fecha fin
                  </div>
                </label>
                <input
                  id="filter-fecha-fin"
                  type="date"
                  className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={endDate ? new Date(endDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    setEndDate(date);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {/* Botón de exportación a Excel */}
      <div className="mt-4">
        <ExportToExcelButton 
          projects={projects || []}
          filterEquipo={filterEquipo}
          filterAnalista={filterAnalista}
          filterEstado={filterEstado}
          filterCelula={filterCelula}
          searchTerm={searchTerm}
          filterAtrasado={filterAtrasado}
          startDate={startDate}
          endDate={endDate}
          exportFilterType={exportFilterType}
          setExportFilterType={setExportFilterType}
        />
      </div>
    </div>
  );
}
