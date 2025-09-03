'use client';

import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Project } from '@/models/Project';
import { Download } from 'lucide-react';

interface ExportToExcelButtonProps {
  projects: Project[];
  filterType?: 'week' | 'month' | 'year' | 'all';
  exportFilterType?: 'week' | 'month' | 'year' | 'all';
  setExportFilterType?: (value: 'week' | 'month' | 'year' | 'all') => void;
  filterEquipo?: string;
  filterAnalista?: string;
  filterEstado?: string;
  filterCelula?: string;
  searchTerm?: string;
  filterAtrasado?: string | boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  className?: string;
}

const ExportToExcelButton: React.FC<ExportToExcelButtonProps> = ({ 
  projects, 
  filterType,
  exportFilterType,
  className = ''
}) => {
  // Usamos exportFilterType si está disponible, si no, usamos filterType
  const actualFilterType = exportFilterType || filterType || 'all';
  // Función para formatear fechas en el formato deseado para Excel
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  // Función para generar el nombre del archivo según el filtro
  const generateFileName = () => {
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0];
    
    let filterName = '';
    const activeFilterType = exportFilterType || filterType || 'all';
    switch (activeFilterType) {
      case 'week':
        filterName = 'Semanal';
        break;
      case 'month':
        filterName = 'Mensual';
        break;
      case 'year':
        filterName = 'Anual';
        break;
      case 'all':
        filterName = 'Completo';
        break;
    }
    
    // Incluir el número de proyectos en el nombre del archivo
    const totalProjects = projects.length;
    return `Proyectos_${filterName}_${totalProjects}_registros_${formattedDate}.xlsx`;
  };

  // Función para exportar los datos a Excel
  const exportToExcel = () => {
    // Convertir los proyectos a formato plano adecuado para Excel
    const dataForExcel = projects.map(project => ({
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

    // Crear un libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    
    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 15 },  // ID Jira
      { wch: 30 },  // Proyecto
      { wch: 15 },  // Equipo
      { wch: 15 },  // Célula
      { wch: 10 },  // Horas
      { wch: 10 },  // Días
      { wch: 15 },  // Estado
      { wch: 15 },  // Fecha Entrega
      { wch: 15 },  // Fecha Real Entrega
      { wch: 15 },  // Fecha Certificación
      { wch: 12 },  // Días Retraso
      { wch: 20 },  // Analista Producto
      { wch: 40 },  // Plan Trabajo
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Proyectos');
    
    // Exportar a Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    
    // Guardar el archivo
    saveAs(dataBlob, generateFileName());
  };

  return (
    <button
      onClick={exportToExcel}
      className={`flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors ${className}`}
      title="Exportar a Excel"
    >
      <Download size={16} />
      <span>Exportar a Excel</span>
    </button>
  );
};

export default ExportToExcelButton;
