'use client';

import { Project } from '@/models/Project';
import { useState, useEffect } from 'react';

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
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Proyectos</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{kpis.total}</p>
            <p className="ml-2 text-sm text-gray-500">proyectos</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border border-yellow-400">
          <h3 className="text-sm font-medium text-gray-500">Por Iniciar</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-amber-500">{kpis.porIniciar}</p>
            <p className="ml-2 text-sm text-gray-500">proyectos</p>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {Math.round((kpis.porIniciar / kpis.total) * 100) || 0}% del total
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border border-blue-400">
          <h3 className="text-sm font-medium text-gray-500">En Progreso</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-blue-600">{kpis.enProgreso}</p>
            <p className="ml-2 text-sm text-gray-500">proyectos</p>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {Math.round((kpis.enProgreso / kpis.total) * 100) || 0}% del total
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border border-green-400">
          <h3 className="text-sm font-medium text-gray-500">Certificados</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-green-600">{kpis.certificados}</p>
            <p className="ml-2 text-sm text-gray-500">proyectos</p>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {Math.round((kpis.certificados / kpis.total) * 100) || 0}% del total
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border border-red-400">
          <h3 className="text-sm font-medium text-gray-500">Con Retraso</h3>
          <div className="mt-1 flex items-baseline">
            <p className="text-2xl font-semibold text-red-600">{kpis.retrasados}</p>
            <p className="ml-2 text-sm text-gray-500">proyectos</p>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {Math.round((kpis.retrasados / kpis.total) * 100) || 0}% del total
          </p>
        </div>
      </div>
      
      {/* Segunda fila de indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Próximos a entregar (30 días)</h3>
          <div className="mt-2 flex items-center">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-xl font-semibold text-gray-900">{kpis.proximosAEntregar}</p>
              <p className="text-sm text-gray-500">proyectos por entregar pronto</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Equipo con más proyectos</h3>
          <div className="mt-2 flex items-center">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              {equipoConMasProyectos.equipo ? (
                <>
                  <p className="text-lg font-semibold text-gray-900">{equipoConMasProyectos.equipo}</p>
                  <p className="text-sm text-gray-500">
                    {equipoConMasProyectos.count} proyectos ({Math.round((equipoConMasProyectos.count / kpis.total) * 100)}%)
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Sin datos suficientes</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Distribución por estado</h3>
          <div className="relative pt-1">
            <div className="flex h-4 overflow-hidden text-xs rounded">
              {kpis.porIniciar > 0 && (
                <div
                  style={{ width: `${(kpis.porIniciar / kpis.total) * 100}%` }}
                  className="flex flex-col justify-center text-center text-white bg-amber-500 shadow-none whitespace-nowrap"
                />
              )}
              {kpis.enProgreso > 0 && (
                <div
                  style={{ width: `${(kpis.enProgreso / kpis.total) * 100}%` }}
                  className="flex flex-col justify-center text-center text-white bg-blue-500 shadow-none whitespace-nowrap"
                />
              )}
              {kpis.certificados > 0 && (
                <div
                  style={{ width: `${(kpis.certificados / kpis.total) * 100}%` }}
                  className="flex flex-col justify-center text-center text-white bg-green-500 shadow-none whitespace-nowrap"
                />
              )}
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-1 bg-amber-500 rounded-full"></span>
              <span className="text-xs">Por iniciar</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-1 bg-blue-500 rounded-full"></span>
              <span className="text-xs">En progreso</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 mr-1 bg-green-500 rounded-full"></span>
              <span className="text-xs">Certificados</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
