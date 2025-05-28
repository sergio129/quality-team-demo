"use client";

import { Project } from "@/models/Project";
import { QAAnalyst } from "@/models/QAAnalyst";
import { memo, useEffect, useMemo, useState } from "react";
import { formatDate, isProjectActive } from "./TimelineUtils";
import { isWorkingDay } from "./TimelineComponents";

/**
 * Componente para depurar y mostrar información detallada sobre un proyecto específico
 */

interface ProjectDebugProps {
  projectId: string;
  projects: Project[];
  analysts: QAAnalyst[];
  startDate: Date;
  endDate: Date;
}

export const ProjectDebug = memo(({ 
  projectId, 
  projects, 
  analysts, 
  startDate, 
  endDate 
}: ProjectDebugProps) => {
  const [dateRange, setDateRange] = useState<Date[]>([]);

  // Generar rango de fechas entre startDate y endDate
  useEffect(() => {
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setDateRange(dates);
  }, [startDate, endDate]);

  // Obtener el proyecto específico por ID
  const project = useMemo(() => {
    return projects.find(p => p.idJira === projectId);
  }, [projects, projectId]);

  if (!project) {
    return (
      <div className="p-4 bg-red-100 border border-red-200 rounded-lg">
        <h3 className="text-lg font-bold text-red-700">Proyecto no encontrado</h3>
        <p>No se encontró ningún proyecto con ID: {projectId}</p>
      </div>
    );
  }

  // Obtener el analista asignado al proyecto
  const analista = analysts.find(a => a.name === project.analistaProducto);
  // Función para obtener información detallada sobre las fechas
  const formatDebugDate = (date: Date | string | null | undefined): string => {
    if (!date) return 'No definida';
    const d = new Date(date);
    return `${d.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })} (${d.toISOString().split('T')[0]})`;
  };
  
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-bold">Información de depuración para proyecto {projectId}</h3>
      
      {project && (
        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <p><strong>Período de actividad:</strong></p>
          <p>• Fecha de entrega: {formatDebugDate(project.fechaEntrega)}</p>
          <p>• Fecha de certificación: {formatDebugDate(project.fechaCertificacion)}</p>
          <p><strong>Estado del proyecto:</strong> {project.estadoCalculado || 'No definido'}</p>
          <p className="mt-2 text-blue-600 font-semibold">
            El proyecto debería aparecer desde el día de entrega hasta el día de certificación (ambos inclusive).
          </p>
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-bold text-blue-700">Detalles del proyecto</h4>
          <table className="mt-2 border-collapse w-full">
            <tbody>
              <tr className="border-b">
                <td className="font-bold pr-4 py-1">ID:</td>
                <td>{project.idJira}</td>
              </tr>
              <tr className="border-b">
                <td className="font-bold pr-4 py-1">Nombre:</td>
                <td>{project.proyecto}</td>
              </tr>
              <tr className="border-b">
                <td className="font-bold pr-4 py-1">Analista:</td>
                <td>{project.analistaProducto}</td>
              </tr>
              <tr className="border-b">
                <td className="font-bold pr-4 py-1">Fecha Entrega:</td>
                <td>{formatDate(project.fechaEntrega)}</td>
              </tr>
              <tr className="border-b">
                <td className="font-bold pr-4 py-1">Fecha Certificación:</td>
                <td>{project.fechaCertificacion ? formatDate(project.fechaCertificacion) : 'No definida'}</td>
              </tr>
              <tr className="border-b">
                <td className="font-bold pr-4 py-1">Estado:</td>
                <td>{project.estadoCalculado || 'No definido'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>          <h4 className="font-bold text-blue-700">Días activos</h4>
          <div className="mt-2 border rounded-md">
            <table className="border-collapse w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border-b px-2 py-1 text-left">Fecha</th>
                  <th className="border-b px-2 py-1 text-center">Día</th>
                  <th className="border-b px-2 py-1 text-center">¿Día Laborable?</th>
                  <th className="border-b px-2 py-1 text-center">¿Activo?</th>
                  <th className="border-b px-2 py-1 text-center">Condición</th>
                </tr>
              </thead>
              <tbody>
                {dateRange.map((date) => {
                  const isWorkDay = isWorkingDay(date);
                  const active = isProjectActive(project, date, isWorkDay);
                    // Determinar por qué está activo o inactivo
                  let condition = '';
                  
                  // Convertir a formato YYYY-MM-DD para comparación simple
                  const dateStr = new Date(date).toISOString().split('T')[0];
                  const entregaStr = project.fechaEntrega ? new Date(project.fechaEntrega).toISOString().split('T')[0] : '';
                  const certStr = project.fechaCertificacion ? new Date(project.fechaCertificacion).toISOString().split('T')[0] : '';
                  const todayStr = new Date().toISOString().split('T')[0];
                  
                  if (!isWorkDay) {
                    condition = 'No día laborable';
                  } else if (project.fechaCertificacion) {
                    if (dateStr < entregaStr) {
                      condition = 'Antes de entrega';
                    } else if (dateStr > certStr) {
                      condition = 'Después de certif.';
                    } else {
                      condition = 'En rango activo';
                    }                  } else {
                    if (dateStr < entregaStr) {
                      condition = 'Antes de entrega';
                    } else if (dateStr === entregaStr) {
                      condition = 'Día entrega';
                    } else if (dateStr > todayStr) {
                      condition = 'Futuro';
                    } else {
                      condition = 'En curso';
                    }
                  }
                  
                  return (                    <tr key={date.toISOString()} 
                        className={`border-b hover:bg-gray-50 ${
                          dateStr === entregaStr ? 'bg-yellow-50' : 
                          (certStr && dateStr === certStr) ? 'bg-green-50' : ''
                        }`}>
                      <td className="px-2 py-1">{formatDate(date)}</td>
                      <td className="px-2 py-1 text-center">{date.toLocaleDateString('es-ES', { weekday: 'short' })}</td>
                      <td className="px-2 py-1 text-center">
                        {isWorkDay ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-800 rounded-full">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 rounded-full">✗</span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {active ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full">✓</span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-400 rounded-full">✗</span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-center text-xs">
                        {condition}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});

ProjectDebug.displayName = 'ProjectDebug';
