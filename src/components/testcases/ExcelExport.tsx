'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileDown } from 'lucide-react';
import { TestCase } from '@/models/TestCase';
import { useProjects } from '@/hooks/useProjects';

interface ExcelExportProps {
  projectId?: string;
  testCases?: TestCase[];
}

export default function ExcelExport({ projectId, testCases = [] }: ExcelExportProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');

  const handleExportToExcel = () => {
    setIsLoading(true);
    
    try {
      const project = projects.find(p => p.id === selectedProjectId || p.idJira === selectedProjectId);
      const projectName = project ? project.proyecto : 'casos_prueba';
      
      // Formatear datos para el Excel
      const mainData = [
        ['FORMATO DE CONSTRUCCION CASOS DE PRUEBAS EQUIPO QUALITY TEAMS', '', '', '', '', '', '', '', '', '', '', '', '', 'version 1.0'],
        [''],
        ['Codigo Peticion', project?.idJira || ''],
        ['Nombre del proyecto', project?.proyecto || ''],
        ['Fecha Inicio producto', project?.fechaInicio ? new Date(project.fechaInicio).toLocaleDateString() : ''],
        ['Fecha Fin Producto', project?.fechaEntrega ? new Date(project.fechaEntrega).toLocaleDateString() : ''],
        [''],
        ['Total estimacion en Horas', '', '', 'Total estimacion en Dias', ''],
        ['']
      ];
      
      // Estadísticas de ciclos
      interface CycleStats {
        disenados: number;
        exitosos: number;
        noEjecutados: number;
        defectos: number;
      }
      
      interface CycleStatsMap {
        [key: string]: CycleStats;
      }
      
      const cycleStats: CycleStatsMap = {
        'Ciclo 1': { disenados: 0, exitosos: 0, noEjecutados: 0, defectos: 0 },
        'Ciclo 2': { disenados: 0, exitosos: 0, noEjecutados: 0, defectos: 0 },
        'Ciclo 3': { disenados: 0, exitosos: 0, noEjecutados: 0, defectos: 0 }
      };
      
      // Calcular estadísticas por ciclo
      testCases.forEach(tc => {
        const cycleName = `Ciclo ${tc.cycle || 1}`;
        if (cycleStats[cycleName]) {
          cycleStats[cycleName].disenados++;
          
          if (tc.status === 'Exitoso') {
            cycleStats[cycleName].exitosos++;
          } else if (tc.status === 'No ejecutado') {
            cycleStats[cycleName].noEjecutados++;
          }
          
          if (tc.defects?.length) {
            cycleStats[cycleName].defectos += tc.defects.length;
          }
        }
      });
      
      // Añadir tabla de estadísticas
      mainData.push(['', '', '', 'Diseñados', 'Exitosos', 'No ejecutados', 'Defectos', '% casos exitoso', '% incidentes']);
      
      for (const cycle in cycleStats) {
        const stats = cycleStats[cycle];
        const exitosoPercent = stats.disenados ? Math.round((stats.exitosos / stats.disenados) * 100) : 0;
        const incidentesPercent = stats.disenados ? Math.round((stats.defectos / stats.disenados) * 100) : 0;
          mainData.push([
          '', '', cycle, String(stats.disenados), String(stats.exitosos), String(stats.noEjecutados), 
          String(stats.defectos), `${exitosoPercent}%`, `${incidentesPercent}%`
        ]);
      }
      
      mainData.push([''], [''], ['Calidad del desarrollo', '', '', '', '', '', '', '', '', '', '', '', '', '100%']);
      
      // Encabezados de la tabla de casos
      mainData.push([
        'HU', 'ID', 'Nombre del caso de prueba', 'Pasos', 'Resultado esperado', 'Tipo de Prueba', 'Estado', 
        'Defectos C1', 'Defectos C2', 'Defectos C3', 'Categoría de Incidencia', 'Evidencia Del caso', 'Observacion', 'Responsable'
      ]);
      
      // Datos de los casos
      testCases.forEach(tc => {
        const pasos = tc.steps?.map(step => step.description).join('\n') || '';
        
        mainData.push([
          tc.userStoryId,
          tc.codeRef,
          tc.name,
          pasos,
          tc.expectedResult,
          tc.testType,
          tc.status,
          tc.cycle === 1 && tc.defects?.length ? tc.defects.join('\n') : '',
          tc.cycle === 2 && tc.defects?.length ? tc.defects.join('\n') : '',
          tc.cycle === 3 && tc.defects?.length ? tc.defects.join('\n') : '',
          tc.category || '',
          tc.evidences?.length ? 'Sí' : 'No',
          '',
          tc.responsiblePerson || ''
        ]);
      });
      
      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(mainData);
      
      // Estilizar algunas celdas
      if (!ws['!merges']) ws['!merges'] = [];
      
      // Merge para el título principal
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } });
      
      // Crear libro
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Casos de Prueba');
      
      // Generar archivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Guardar archivo
      saveAs(data, `${projectName}_casos_prueba.xlsx`);
      
      toast.success('Exportación completada');
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar a Excel');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setIsExportDialogOpen(true)}
          className="flex items-center gap-2"
          disabled={testCases.length === 0}
        >
          <FileDown size={16} /> Exportar a Excel
        </Button>
      </div>

      {isExportDialogOpen && (
        <Dialog open={true} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Exportar Casos de Prueba a Excel</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Se exportarán {testCases.length} casos de prueba al formato estándar de Excel.
              </p>
              
              {!projectId && (
                <div className="space-y-2">
                  <Label htmlFor="exportProject">Proyecto</Label>
                  <Select
                    id="exportProject"
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                  >
                    <option value="">Seleccionar proyecto</option>
                    {projects.map((project) => (
                      <option key={project.id || project.idJira} value={project.idJira}>
                        {project.proyecto}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsExportDialogOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleExportToExcel}
                disabled={isLoading || (!projectId && !selectedProjectId)}
              >
                {isLoading ? 'Exportando...' : 'Exportar a Excel'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
