'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Incident } from '@/models/Incident';
import { FileDown } from 'lucide-react';

interface ExportExcelButtonProps {
  className?: string;
}

export function ExportExcelButton({ className }: ExportExcelButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);  const [month, setMonth] = useState<string>(new Date().getMonth().toString());
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [filter, setFilter] = useState<'month' | 'year' | 'all'>('month');
  const [isFilteredByStatus, setIsFilteredByStatus] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('Abierto');

  // Generar años desde 2020 hasta el año actual
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => (2020 + i).toString());

  const months = [
    { value: "0", label: "Enero" },
    { value: "1", label: "Febrero" },
    { value: "2", label: "Marzo" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Mayo" },
    { value: "5", label: "Junio" },
    { value: "6", label: "Julio" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Septiembre" },
    { value: "9", label: "Octubre" },
    { value: "10", label: "Noviembre" },
    { value: "11", label: "Diciembre" }
  ];

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Obtener todos los incidentes
      const response = await fetch('/api/incidents');
      const incidents = await response.json() as Incident[];      // Filtrar por mes, año y estado según la selección
      const filteredIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.fechaReporte || incident.fechaCreacion);
        
        // Filtro por fecha
        let matchesDateFilter = true;
        if (filter === 'year') {
          matchesDateFilter = incidentDate.getFullYear().toString() === year;
        } else if (filter === 'month') {
          matchesDateFilter = (
            incidentDate.getFullYear().toString() === year && 
            incidentDate.getMonth().toString() === month
          );
        }
        
        // Filtro por estado
        const matchesStatusFilter = !isFilteredByStatus || incident.estado === statusFilter;
        
        return matchesDateFilter && matchesStatusFilter;
      });// Crear encabezados y propiedades para el Excel
      const headers = [
        'ID', 'ID JIRA', 'Célula', 'Cliente', 'Estado', 'Prioridad', 'Descripción',
        'Fecha Creación', 'Fecha Reporte', 'Fecha Solución', 'Días Abierto', 
        'Informado Por', 'Asignado A', 'Tipo Bug', 'Área Afectada', 'Es Erróneo', 
        'Aplica', 'Etiquetas'
      ];
        // Función para formatear las fechas correctamente para Excel
      const formatDateForExcel = (dateString: Date | string | undefined | null): string => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      };
      
      // Preparar los datos para Excel
      const excelData = filteredIncidents.map(incident => ({
        'ID': incident.id,
        'ID JIRA': incident.idJira,
        'Célula': incident.celula,
        'Cliente': incident.cliente,
        'Estado': incident.estado,
        'Prioridad': incident.prioridad,
        'Descripción': incident.descripcion,
        'Fecha Creación': formatDateForExcel(incident.fechaCreacion),
        'Fecha Reporte': formatDateForExcel(incident.fechaReporte),
        'Fecha Solución': formatDateForExcel(incident.fechaSolucion),
        'Días Abierto': incident.diasAbierto,
        'Informado Por': incident.informadoPor,
        'Asignado A': incident.asignadoA,
        'Tipo Bug': incident.tipoBug || '-',
        'Área Afectada': incident.areaAfectada || '-',
        'Es Erróneo': incident.esErroneo ? 'Sí' : 'No',
        'Aplica': incident.aplica ? 'Sí' : 'No',
        'Etiquetas': incident.etiquetas?.join(', ') || '-'
      }));// Crear el libro y la hoja
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      
      // Ajustar anchos de columnas automáticamente
      const columnsWidths = [
        { wch: 10 }, // ID
        { wch: 15 }, // ID JIRA
        { wch: 15 }, // Célula
        { wch: 15 }, // Cliente
        { wch: 15 }, // Estado
        { wch: 10 }, // Prioridad
        { wch: 40 }, // Descripción
        { wch: 15 }, // Fecha Creación
        { wch: 15 }, // Fecha Reporte
        { wch: 15 }, // Fecha Solución
        { wch: 10 }, // Días Abierto
        { wch: 20 }, // Informado Por
        { wch: 20 }, // Asignado A
        { wch: 15 }, // Tipo Bug
        { wch: 15 }, // Área Afectada
        { wch: 10 }, // Es Erróneo
        { wch: 10 }, // Aplica
        { wch: 25 }, // Etiquetas
      ];
      worksheet['!cols'] = columnsWidths;
      
      XLSX.utils.book_append_sheet(workbook, worksheet, "Incidentes");      // Guardar el archivo
      // Obtener la fecha actual para el nombre del archivo
      const now = new Date();
      const dateStr = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
        // Construir nombre del archivo
      let fileName = `Incidentes_${dateStr}`;
      
      // Añadir información de fecha al nombre
      if (filter === 'month') {
        const monthName = months.find(m => m.value === month)?.label;
        fileName = `Incidentes_${monthName}_${year}`;
      } else if (filter === 'year') {
        fileName = `Incidentes_${year}`;
      }
      
      // Añadir información de estado si se filtró por él
      if (isFilteredByStatus) {
        fileName += `_${statusFilter.replace(' ', '')}`;
      }
      
      // Añadir la fecha de exportación al final
      fileName += `_${dateStr}`;// Convertir a blob y guardar
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `${fileName}.xlsx`);      // Preparar mensaje de resumen
      let summaryText = `Se han exportado ${excelData.length} incidentes`;
      
      if (filter === 'month') {
        const monthName = months.find(m => m.value === month)?.label;
        summaryText += ` del mes de ${monthName} de ${year}`;
      } else if (filter === 'year') {
        summaryText += ` del año ${year}`;
      }
      
      if (isFilteredByStatus) {
        summaryText += ` con estado "${statusFilter}"`;
      }
      
      // Mostrar notificación de éxito
      toast.success(`Exportación completada: ${fileName}.xlsx`, {
        description: `${summaryText}.`,
        duration: 5000
      });

      setIsOpen(false);    } catch (error) {
      console.error('Error al exportar a Excel:', error);
      toast.error('Error al exportar a Excel', {
        description: 'Ha ocurrido un problema al generar el archivo. Inténtelo de nuevo.',
        duration: 5000
      });
    }finally {
      setIsLoading(false);
    }
  };

  return (
    <>      <Button 
        onClick={() => setIsOpen(true)} 
        className={className}
        variant="secondary"
      >
        <FileDown className="mr-2 h-4 w-4" /> Exportar a Excel
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar Incidentes a Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter">Filtrar por</Label>                <Select 
                  id="filter"
                  value={filter} 
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as 'month' | 'year' | 'all')}
                  className="w-full"
                >
                <option value="month">Mes y Año</option>
                <option value="year">Año</option>
                <option value="all">Todos</option>
              </Select>
            </div>

            {filter !== 'all' && (
              <div className="space-y-2">
                <Label htmlFor="year">Año</Label>
                <Select 
                  id="year"
                  value={year} 
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </div>
            )}            {filter === 'month' && (
              <div className="space-y-2">
                <Label htmlFor="month">Mes</Label>
                <Select 
                  id="month"
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2 mt-4">
              <input
                type="checkbox"
                id="filterByStatus"
                checked={isFilteredByStatus}
                onChange={(e) => setIsFilteredByStatus(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="filterByStatus" className="text-sm font-medium text-gray-700">
                Filtrar por estado
              </Label>
            </div>
            
            {isFilteredByStatus && (
              <div className="space-y-2 mt-2">
                <Label htmlFor="status">Estado</Label>
                <Select 
                  id="status"
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full"
                >
                  <option value="Abierto">Abierto</option>
                  <option value="En Progreso">En Progreso</option>
                  <option value="Resuelto">Resuelto</option>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} variant="outline">Cancelar</Button>            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <FileDown className="mr-2 h-4 w-4" /> Exportar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
