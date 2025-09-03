"use client";

import React, { useEffect, useState } from 'react';
import { DataTable } from '@/components/analysts/AnalystTable';
import { AddAnalystButton } from '@/components/analysts/AddAnalystButton';
import { AnalystStatsDialog } from '@/components/analysts/AnalystStatsDialog';
import { AnalystWorkloadDialog } from '@/components/analysts/AnalystWorkloadDialog';
import { AnalystVacationsDialog } from '@/components/analysts/AnalystVacationsDialog';
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useAnalysts, useCells } from '@/hooks/useAnalysts';
import { useAnalystsAvailability } from '@/hooks/useAnalystAvailability';
import { QAAnalyst } from '@/models/QAAnalyst';
import {
  Users,
  UserCheck,
  Trophy,
  Target,
  TrendingUp,
  Activity,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Award,
  ChevronRight,
  BarChart3,
  FolderOpen,
  Calendar,
  ExternalLink,
  Eye,
  Briefcase,
  CalendarDays
} from 'lucide-react';

export default function AnalystsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { analysts, isLoading: analystsLoading, isError } = useAnalysts();
  const { cells, isLoading: cellsLoading } = useCells();
  const analystsAvailability = useAnalystsAvailability(analysts);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  
  // Estados para los modales
  const [selectedAnalystForStats, setSelectedAnalystForStats] = useState<QAAnalyst | null>(null);
  const [selectedAnalystForProjects, setSelectedAnalystForProjects] = useState<QAAnalyst | null>(null);
  const [selectedAnalystForVacations, setSelectedAnalystForVacations] = useState<QAAnalyst | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Funciones para manejar las acciones de las cards - usando modales como en la tabla
  const handleViewStats = (analyst: QAAnalyst) => {
    setSelectedAnalystForStats(analyst);
  };

  const handleViewProjects = (analyst: QAAnalyst) => {
    setSelectedAnalystForProjects(analyst);
  };

  const handleManageVacations = (analyst: QAAnalyst) => {
    setSelectedAnalystForVacations(analyst);
  };

  // Combinar datos de analistas con disponibilidades calculadas
  const analystsWithAvailability = React.useMemo(() => {
    if (!analysts || !analystsAvailability) return [];
    
    return analysts.map(analyst => {
      const availabilityData = analystsAvailability.find(a => a.analystId === analyst.id);
      const availability = availabilityData?.availabilityPercentage ?? 100;
      return {
        ...analyst,
        realAvailability: availability,
        availability: availability // También actualizar el campo availability original
      };
    });
  }, [analysts, analystsAvailability]);

  // Calcular estadísticas basadas en disponibilidad real
  const stats = React.useMemo(() => {
    if (!analystsWithAvailability) return { total: 0, leaders: 0, seniors: 0, juniors: 0, available: 0, busy: 0 };
    
    return {
      total: analystsWithAvailability.length,
      leaders: analystsWithAvailability.filter(a => a.role === 'QA Leader').length,
      seniors: analystsWithAvailability.filter(a => a.role === 'QA Senior').length,
      juniors: analystsWithAvailability.filter(a => a.role === 'QA Analyst').length,
      available: analystsWithAvailability.filter(a => a.availability >= 70).length,
      busy: analystsWithAvailability.filter(a => a.availability < 30).length
    };
  }, [analystsWithAvailability]);

  // Filtrar analistas con disponibilidad actualizada
  const filteredAnalysts = React.useMemo(() => {
    if (!analystsWithAvailability) return [];
    
    return analystsWithAvailability.filter(analyst => {
      const matchesSearch = analyst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           analyst.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === 'all' || analyst.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [analystsWithAvailability, searchTerm, selectedRole]);

  // Mostrar loading mientras se verifica la sesión
  if (status === "loading" || analystsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Cargando Analistas QA</h3>
            <p className="text-gray-600">Obteniendo información del equipo...</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay sesión, no mostrar nada (se redirigirá)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header Mejorado con Gradiente */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6">
            <div className="flex items-center space-x-4 mb-4 lg:mb-0">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Gestión de Analistas QA</h1>
                <p className="text-blue-100 mt-1">Administra tu equipo de calidad y sus competencias</p>
              </div>
            </div>
            
            <AddAnalystButton />
          </div>

          {/* Panel de estadísticas mejorado */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6 text-purple-200" />
              </div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-xs text-purple-200">Total</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                <Trophy className="h-6 w-6 text-yellow-300" />
              </div>
              <div className="text-2xl font-bold text-yellow-300">{stats.leaders}</div>
              <div className="text-xs text-purple-200">Líderes</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                <Award className="h-6 w-6 text-blue-300" />
              </div>
              <div className="text-2xl font-bold text-blue-300">{stats.seniors}</div>
              <div className="text-xs text-purple-200">Seniors</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                <Target className="h-6 w-6 text-green-300" />
              </div>
              <div className="text-2xl font-bold text-green-300">{stats.juniors}</div>
              <div className="text-xs text-purple-200">Analistas</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6 text-emerald-300" />
              </div>
              <div className="text-2xl font-bold text-emerald-300">{stats.available}</div>
              <div className="text-xs text-purple-200">Disponibles</div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <div className="flex justify-center mb-2 group-hover:scale-110 transition-transform">
                <Zap className="h-6 w-6 text-orange-300" />
              </div>
              <div className="text-2xl font-bold text-orange-300">{stats.busy}</div>
              <div className="text-xs text-purple-200">Ocupados</div>
            </div>
          </div>
        </div>

        {/* Controles de filtrado */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-400 h-5 w-5" />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos los roles</option>
                  <option value="QA Leader">QA Leader</option>
                  <option value="QA Senior">QA Senior</option>
                  <option value="QA Analyst">QA Analyst</option>
                </select>
              </div>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'cards'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'table'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Tabla
                </button>
              </div>
            </div>
          </div>
          
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              Mostrando {filteredAnalysts.length} de {stats.total} analistas
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {viewMode === 'table' ? (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <DataTable />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Equipo de Analistas ({filteredAnalysts.length})
                  </h3>
                  <RefreshCw className="h-5 w-5 text-gray-400 cursor-pointer hover:text-blue-600 transition-colors" />
                </div>
                
                {/* Vista de Cards */}
                <div className="grid gap-4">
                  {filteredAnalysts.map((analyst) => (
                    <div
                      key={analyst.id}
                      className="bg-gradient-to-r from-white to-blue-50 border-2 border-blue-100 hover:border-blue-300 rounded-xl p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Avatar con color personalizado */}
                          <div 
                            className="p-3 rounded-xl text-white flex items-center justify-center shadow-lg"
                            style={{ backgroundColor: analyst.color || '#3B82F6' }}
                          >
                            <Users className="h-6 w-6" />
                          </div>

                          {/* Información del analista */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-bold text-gray-800">{analyst.name}</h4>
                              
                              {/* Badge de disponibilidad */}
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                analyst.realAvailability >= 70 ? 'bg-green-100 text-green-800' :
                                analyst.realAvailability >= 30 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {analyst.realAvailability}% disponible
                              </span>

                              {/* Badge de rol */}
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                                analyst.role === 'QA Leader' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                analyst.role === 'QA Senior' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                'bg-green-100 text-green-800 border-green-200'
                              }`}>
                                {analyst.role || 'Sin rol'}
                              </span>
                            </div>

                            <div className="text-sm text-gray-600 mb-3">
                              📧 {analyst.email}
                            </div>

                            {/* Células asignadas */}
                            {analyst.cellIds && analyst.cellIds.length > 0 && (
                              <div className="flex items-center space-x-2 text-sm mb-4">
                                <Activity className="h-4 w-4 text-blue-500" />
                                <span className="text-blue-700 font-medium">
                                  {analyst.cellIds.map(cellId => 
                                    cells?.find(c => c.id === cellId)?.name || 'Célula'
                                  ).join(', ')}
                                </span>
                              </div>
                            )}

                            {/* Botones de acción */}
                            <div className="flex items-center space-x-2 mt-4">
                              <button
                                onClick={() => handleViewStats(analyst)}
                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                                title="Ver estadísticas del analista"
                              >
                                <BarChart3 className="h-4 w-4" />
                                <span>Estadísticas</span>
                              </button>
                              
                              <button
                                onClick={() => handleViewProjects(analyst)}
                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                                title="Ver proyectos asignados"
                              >
                                <Briefcase className="h-4 w-4" />
                                <span>Proyectos</span>
                              </button>
                              
                              <button
                                onClick={() => handleManageVacations(analyst)}
                                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg transform hover:scale-105"
                                title="Gestionar vacaciones y ausencias"
                              >
                                <CalendarDays className="h-4 w-4" />
                                <span>Vacaciones</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Indicador de flecha - movido arriba */}
                        <div className="flex flex-col items-center space-y-2">
                          <ChevronRight className="h-5 w-5 text-gray-300" />
                          {/* Indicador de actividad */}
                          <div className={`w-3 h-3 rounded-full ${
                            analyst.realAvailability >= 70 ? 'bg-green-400' :
                            analyst.realAvailability >= 30 ? 'bg-yellow-400' :
                            'bg-red-400'
                          } animate-pulse`}></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel lateral mejorado */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Información</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">👥 Analistas QA</h4>
                    <p className="text-sm text-blue-700">
                      Gestione la información de los analistas QA, sus habilidades, células asignadas y disponibilidad.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                    <h4 className="text-sm font-semibold text-purple-800 mb-2">🎯 Roles</h4>
                    <p className="text-sm text-purple-700">
                      Los analistas pueden tener roles Senior, Semi Senior o Junior, cada uno con diferentes niveles de responsabilidad.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">⚡ Competencias</h4>
                    <p className="text-sm text-green-700">
                      Administre las habilidades técnicas y certificaciones de cada analista para mejor asignación de recursos.
                    </p>
                  </div>

                  {/* Quick stats */}
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 text-white">
                    <h4 className="text-sm font-semibold mb-3 flex items-center">
                      <Activity className="h-4 w-4 mr-2" />
                      Resumen Rápido
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Promedio disponibilidad:</span>
                        <span className="font-semibold">
                          {analystsWithAvailability.length > 0 ? Math.round(
                            analystsWithAvailability.reduce((acc, a) => acc + a.realAvailability, 0) / analystsWithAvailability.length
                          ) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Más experimentados:</span>
                        <span className="font-semibold">{stats.leaders + stats.seniors}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modales - controlados externamente para las Cards */}
      {selectedAnalystForStats && (
        <AnalystStatsDialog 
          analyst={selectedAnalystForStats}
          open={true}
          onOpenChange={(open) => !open && setSelectedAnalystForStats(null)}
          trigger={false}
        />
      )}

      {selectedAnalystForProjects && (
        <AnalystWorkloadDialog 
          analyst={selectedAnalystForProjects}
          open={true}
          onOpenChange={(open) => !open && setSelectedAnalystForProjects(null)}
          trigger={false}
        />
      )}

      {selectedAnalystForVacations && (
        <AnalystVacationsDialog 
          analyst={selectedAnalystForVacations}
          open={true}
          onOpenChange={(open) => !open && setSelectedAnalystForVacations(null)}
          trigger={false}
        />
      )}
    </div>
  );
}
