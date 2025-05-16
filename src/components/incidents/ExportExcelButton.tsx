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

interface ExportExcelButtonProps {
  className?: string;
}

export function ExportExcelButton({ className }: ExportExcelButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [month, setMonth] = useState<string>(new Date().getMonth().toString());
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [filter, setFilter] = useState<'month' | 'year' | 'all'>('month');

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
      const incidents = await response.json() as Incident[];

      // Filtrar por mes y año según la selección
      const filteredIncidents = incidents.filter(incident => {
        const incidentDate = new Date(incident.fechaReporte || incident.fechaCreacion);
        
        if (filter === 'all') {
          return true;
        } else if (filter === 'year') {
          return incidentDate.getFullYear().toString() === year;
        } else {
          // Filter by both month and year
          return (
            incidentDate.getFullYear().toString() === year && 
            incidentDate.getMonth().toString() === month
          );
        }
      });

      // Preparar los datos para Excel
      const excelData = filteredIncidents.map(incident => ({
        'ID': incident.id,
        'ID JIRA': incident.idJira,
        'Célula': incident.celula,
        'Cliente': incident.cliente,
        'Estado': incident.estado,
        'Prioridad': incident.prioridad,
        'Descripción': incident.descripcion,
        'Fecha Creación': new Date(incident.fechaCreacion).toLocaleDateString(),
        'Fecha Reporte': incident.fechaReporte ? new Date(incident.fechaReporte).toLocaleDateString() : '-',
        'Fecha Solución': incident.fechaSolucion ? new Date(incident.fechaSolucion).toLocaleDateString() : '-',
        'Días Abierto': incident.diasAbierto,
        'Informado Por': incident.informadoPor,
        'Asignado A': incident.asignadoA,
        'Tipo Bug': incident.tipoBug || '-',
        'Área Afectada': incident.areaAfectada || '-',
        'Es Erróneo': incident.esErroneo ? 'Sí' : 'No',
        'Aplica': incident.aplica ? 'Sí' : 'No',
        'Etiquetas': incident.etiquetas?.join(', ') || '-'
      }));

      // Crear el libro y la hoja
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Incidentes");

      // Guardar el archivo
      let fileName = 'Incidentes';
      if (filter === 'month') {
        const monthName = months.find(m => m.value === month)?.label;
        fileName = `Incidentes_${monthName}_${year}`;
      } else if (filter === 'year') {
        fileName = `Incidentes_${year}`;
      }      // Convertir a blob y guardar
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, `${fileName}.xlsx`);

      // Mostrar notificación de éxito
      toast.success(`Exportación completada: ${fileName}.xlsx`, {
        description: `Se han exportado ${excelData.length} incidentes.`,
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
    <>
      <Button 
        onClick={() => setIsOpen(true)} 
        className={className}
        variant="secondary"
      >
        Exportar a Excel
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Exportar Incidentes a Excel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter">Filtrar por</Label>
              <Select 
                id="filter"
                value={filter} 
                onChange={(e) => setFilter(e.target.value as 'month' | 'year' | 'all')}
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
            )}

            {filter === 'month' && (
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
          </div>
          <DialogFooter>
            <Button onClick={() => setIsOpen(false)} variant="outline">Cancelar</Button>
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? 'Exportando...' : 'Exportar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
