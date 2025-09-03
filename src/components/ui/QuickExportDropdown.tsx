'use client';

import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import { Project } from '@/models/Project';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface QuickExportDropdownProps {
  projects: Project[];
  filteredProjects: Project[];
}

const QuickExportDropdown: React.FC<QuickExportDropdownProps> = ({ 
  projects, 
  filteredProjects 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const exportOptions = [
    {
      label: 'Exportar Vista Actual',
      description: `${filteredProjects.length} proyectos filtrados`,
      projects: filteredProjects,
      type: 'current' as const
    },
    {
      label: 'Exportar Todo',
      description: `${projects.length} proyectos completos`,
      projects: projects,
      type: 'all' as const
    }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all duration-200 hover:shadow-md border border-green-500"
        title="Opciones de exportación rápida"
      >
        <Download size={16} />
        <span>Exportar</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el dropdown */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="py-2">
              <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider border-b border-gray-100">
                Exportación Rápida
              </div>
              
              {exportOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => {
                    // Función para formatear fechas
                    const formatDate = (date: Date | string | null | undefined) => {
                      if (!date) return '';
                      const d = new Date(date);
                      return d.toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      });
                    };

                    // Convertir los proyectos a formato Excel
                    const dataForExcel = option.projects.map(project => ({
                      'ID Jira': project.idJira || '',
                      'Proyecto': project.proyecto || '',
                      'Equipo': project.equipo || '',
                      'Célula': project.celula || '',
                      'Horas': project.horas || 0,
                      'Días': project.dias || 0,
                      'Estado': project.estadoCalculado || project.estado || '',
                      'Fecha Entrega': formatDate(project.fechaEntrega),
                      'Fecha Real Entrega': formatDate(project.fechaRealEntrega),
                      'Fecha Certificación': formatDate(project.fechaCertificacion),
                      'Días Retraso': project.diasRetraso || 0,
                      'Analista Producto': project.analistaProducto || '',
                      'Plan Trabajo': project.planTrabajo || ''
                    }));

                    // Crear Excel
                    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
                    const workbook = XLSX.utils.book_new();
                    
                    // Ajustar anchos de columnas
                    const columnWidths = [
                      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, 
                      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
                      { wch: 12 }, { wch: 20 }, { wch: 40 }
                    ];
                    worksheet['!cols'] = columnWidths;
                    
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyectos');
                    
                    // Generar nombre de archivo
                    const currentDate = new Date().toISOString().split('T')[0];
                    const fileName = `Proyectos_${option.type === 'current' ? 'Filtrados' : 'Completo'}_${option.projects.length}_registros_${currentDate}.xlsx`;
                    
                    // Exportar
                    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
                    saveAs(dataBlob, fileName);
                    
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Download size={16} className="text-green-600 group-hover:text-green-700" />
                    <div>
                      <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {option.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickExportDropdown;
