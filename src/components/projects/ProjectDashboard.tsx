'use client';

import { Project } from '@/models/Project';
import { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  Clock, 
  PlayCircle, 
  CheckCircle2, 
  AlertTriangle,
  Users,
  Timer,
  TrendingUp 
} from 'lucide-react';

interface ProjectDashboardProps {
  projects: Project[];
}

export default function ProjectDashboard({ projects }: ProjectDashboardProps) {
  const [kpis, setKpis] = useState({
    total: 0,
    enProgreso: 0,
    porIniciar: 0, 
    certificados: 0,
    retrasados: 0,
    porEquipo: {} as Record<string, number>,
    porCelula: {} as Record<string, number>,
    proximosAEntregar: 0 // Proyectos que se entregan en los próximos 30 días
  });

  useEffect(() => {
    // Calcular los KPIs cuando cambie la lista de proyectos
    if (!projects || !projects.length) return;

    const today = new Date();
    const inThirtyDays = new Date();
    inThirtyDays.setDate(today.getDate() + 30);

    const newKpis = {
      total: projects.length,
      enProgreso: projects.filter(p => p.estadoCalculado === 'En Progreso').length,
      porIniciar: projects.filter(p => p.estadoCalculado === 'Por Iniciar').length,
      certificados: projects.filter(p => p.estadoCalculado === 'Certificado').length,
      retrasados: projects.filter(p => p.diasRetraso && p.diasRetraso > 0).length,
      porEquipo: {} as Record<string, number>,
      porCelula: {} as Record<string, number>,
      proximosAEntregar: projects.filter(p => {
        if (!p.fechaEntrega) return false;
        const entrega = new Date(p.fechaEntrega);
        return entrega >= today && entrega <= inThirtyDays && p.estadoCalculado !== 'Certificado';
      }).length
    };

    // Contar proyectos por equipo
    projects.forEach(project => {
      if (project.equipo) {
        newKpis.porEquipo[project.equipo] = (newKpis.porEquipo[project.equipo] || 0) + 1;
      }
      if (project.celula) {
        newKpis.porCelula[project.celula] = (newKpis.porCelula[project.celula] || 0) + 1;
      }
    });

    setKpis(newKpis);
  }, [projects]);

  // Encontrar el equipo con más proyectos
  const equipoConMasProyectos = Object.entries(kpis.porEquipo).reduce(
    (max, [equipo, count]) => (count > max.count ? { equipo, count } : max),
    { equipo: '', count: 0 }
  );

  return (
    <div className="mb-8">
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Proyectos */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-4 bg-white rounded-lg border border-gray-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Proyectos</h3>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{kpis.total}</p>
                  <p className="ml-2 text-sm text-gray-500">proyectos</p>
                </div>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
        
        {/* Por Iniciar */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-4 bg-white rounded-lg border border-orange-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Por Iniciar</h3>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">{kpis.porIniciar}</p>
                  <p className="ml-2 text-sm text-gray-500">proyectos</p>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {Math.round((kpis.porIniciar / kpis.total) * 100) || 0}% del total
                </p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </div>
        </div>
        
        {/* En Progreso */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-4 bg-white rounded-lg border border-blue-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">En Progreso</h3>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{kpis.enProgreso}</p>
                  <p className="ml-2 text-sm text-gray-500">proyectos</p>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {Math.round((kpis.enProgreso / kpis.total) * 100) || 0}% del total
                </p>
              </div>
              <PlayCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
        
        {/* Certificados */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-4 bg-white rounded-lg border border-green-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Certificados</h3>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">{kpis.certificados}</p>
                  <p className="ml-2 text-sm text-gray-500">proyectos</p>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {Math.round((kpis.certificados / kpis.total) * 100) || 0}% del total
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>
        
        {/* Con Retraso */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-400 to-pink-500 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-4 bg-white rounded-lg border border-red-200/50 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Con Retraso</h3>
                <div className="mt-1 flex items-baseline">
                  <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">{kpis.retrasados}</p>
                  <p className="ml-2 text-sm text-gray-500">proyectos</p>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  {Math.round((kpis.retrasados / kpis.total) * 100) || 0}% del total
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Segunda fila de indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Próximos a entregar */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-6 bg-white rounded-lg border border-orange-200/50 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg">
                  <Timer className="h-8 w-8 text-orange-500" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Próximos a entregar</h3>
                <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">{kpis.proximosAEntregar}</p>
                <p className="text-sm text-gray-500">proyectos en 30 días</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-orange-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">En progreso</p>
                <p className="font-bold text-orange-600">
                  {projects.filter(p => {
                    if (!p.fechaEntrega) return false;
                    const entrega = new Date(p.fechaEntrega);
                    const today = new Date();
                    const inThirtyDays = new Date();
                    inThirtyDays.setDate(today.getDate() + 30);
                    return entrega >= today && entrega <= inThirtyDays && p.estadoCalculado === 'En Progreso';
                  }).length}
                </p>
              </div>
              <div className="text-center p-2 bg-red-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Por iniciar</p>
                <p className="font-bold text-red-600">
                  {projects.filter(p => {
                    if (!p.fechaEntrega) return false;
                    const entrega = new Date(p.fechaEntrega);
                    const today = new Date();
                    const inThirtyDays = new Date();
                    inThirtyDays.setDate(today.getDate() + 30);
                    return entrega >= today && entrega <= inThirtyDays && p.estadoCalculado === 'Por Iniciar';
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Equipo con más proyectos */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-6 bg-white rounded-lg border border-purple-200/50 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg">
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Equipo líder</h3>
                {equipoConMasProyectos.equipo ? (
                  <>
                    <p className="text-xl font-bold bg-gradient-to-r from-purple-500 to-indigo-500 bg-clip-text text-transparent">{equipoConMasProyectos.equipo}</p>
                    <p className="text-sm text-gray-500">
                      {equipoConMasProyectos.count} proyectos ({Math.round((equipoConMasProyectos.count / kpis.total) * 100)}%)
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Sin datos suficientes</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-center p-2 bg-purple-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Total equipos</p>
                <p className="font-bold text-purple-600">{Object.keys(kpis.porEquipo).length}</p>
              </div>
              <div className="text-center p-2 bg-indigo-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Promedio</p>
                <p className="font-bold text-indigo-600">
                  {Object.keys(kpis.porEquipo).length > 0 ? 
                    Math.round(kpis.total / Object.keys(kpis.porEquipo).length) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Distribución por estado */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative p-6 bg-white rounded-lg border border-emerald-200/50 backdrop-blur-sm">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="p-3 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Distribución</h3>
                <p className="text-sm text-emerald-600 font-medium">Por estado</p>
              </div>
            </div>
            <div className="relative pt-1 mb-3">
              <div className="flex h-3 overflow-hidden text-xs rounded-full bg-gray-100">
                {kpis.porIniciar > 0 && (
                  <div
                    style={{ width: `${(kpis.porIniciar / kpis.total) * 100}%` }}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 shadow-none whitespace-nowrap transition-all duration-500"
                  />
                )}
                {kpis.enProgreso > 0 && (
                  <div
                    style={{ width: `${(kpis.enProgreso / kpis.total) * 100}%` }}
                    className="bg-gradient-to-r from-blue-400 to-cyan-500 shadow-none whitespace-nowrap transition-all duration-500"
                  />
                )}
                {kpis.certificados > 0 && (
                  <div
                    style={{ width: `${(kpis.certificados / kpis.total) * 100}%` }}
                    className="bg-gradient-to-r from-green-400 to-emerald-500 shadow-none whitespace-nowrap transition-all duration-500"
                  />
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 mr-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"></span>
                  <span>Por iniciar</span>
                </div>
                <span className="font-medium">{kpis.porIniciar}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 mr-2 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"></span>
                  <span>En progreso</span>
                </div>
                <span className="font-medium">{kpis.enProgreso}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="inline-block w-2 h-2 mr-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></span>
                  <span>Certificados</span>
                </div>
                <span className="font-medium">{kpis.certificados}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
