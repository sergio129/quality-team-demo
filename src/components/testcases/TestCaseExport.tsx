'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileDown, FileText, Search } from 'lucide-react';
import { TestCase } from '@/models/TestCase';
import { useProjects } from '@/hooks/useProjects';
import { TestPlan } from '@/hooks/useTestPlans';
// Importamos jspdf correctamente
import { jsPDF } from 'jspdf';
// Importamos autotable como plugin
import autoTable from 'jspdf-autotable';

interface TestCaseExportProps {
  projectId?: string;
  testCases?: TestCase[];
}

export default function TestCaseExport({ projectId, testCases = [] }: TestCaseExportProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [projectsWithPlans, setProjectsWithPlans] = useState<any[]>([]);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const searchRef = useRef<HTMLDivElement>(null);

  // Efecto para manejar clics fuera del dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cargar planes de prueba al abrir el diálogo
  useEffect(() => {
    if (isExportDialogOpen && !projectId) {
      fetchTestPlans();
    }
  }, [isExportDialogOpen, projectId]);
  
  // Filtrar proyectos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProjects(projectsWithPlans);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = projectsWithPlans.filter(
        project => 
          project.proyecto?.toLowerCase().includes(term) || 
          project.idJira?.toLowerCase().includes(term)
      );
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projectsWithPlans]);

  // Función para obtener planes de prueba
  const fetchTestPlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await fetch('/api/test-plans');
      const plans: TestPlan[] = await response.json();
      
      // Obtener los IDs únicos de proyectos que tienen planes
      const projectIdsWithPlans = [...new Set(plans.map(plan => plan.projectId))];
      
      // Filtrar la lista de proyectos para incluir solo aquellos con planes
      const filteredProjects = projects.filter(
        project => projectIdsWithPlans.includes(project.id || '') || projectIdsWithPlans.includes(project.idJira || '')
      );
      
      setProjectsWithPlans(filteredProjects);
      setFilteredProjects(filteredProjects);
    } catch (error) {
      console.error('Error loading test plans:', error);
      toast.error('Error al cargar los planes de prueba');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleProjectSelect = (project: any) => {
    setSelectedProjectId(project.idJira || project.id || '');
    setSearchTerm(project.proyecto || '');
    setShowDropdown(false);
  };

  // Función para exportar a Excel
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
        // Calcular la calidad del desarrollo basada en defectos
      let totalDefectos = 0;
      let totalCasosDisenados = 0;
      
      for (const cycle in cycleStats) {
        totalDefectos += cycleStats[cycle].defectos;
        totalCasosDisenados += cycleStats[cycle].disenados;
      }
      
      let calidad = 100;
      if (totalCasosDisenados > 0) {
        // Calculamos la calidad como 100% menos el porcentaje de defectos sobre casos diseñados
        calidad = Math.max(0, Math.min(100, 100 - (totalDefectos / totalCasosDisenados) * 100));
      }
      
      mainData.push([''], [''], ['Calidad del desarrollo', '', '', '', '', '', '', '', '', '', '', '', '', `${Math.round(calidad)}%`]);
      
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
      
      toast.success('Exportación a Excel completada');
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar a Excel');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para exportar a PDF
  const handleExportToPDF = () => {
    setIsLoading(true);
    
    try {
      const project = projects.find(p => p.id === selectedProjectId || p.idJira === selectedProjectId);
      const projectName = project ? project.proyecto : 'casos_prueba';      // Crear un nuevo documento PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true // Activar compresión para reducir tamaño del archivo
      });
        // Añadir cabecera con información del proyecto
      doc.setFontSize(14); // Reducir tamaño de fuente para título
      doc.setTextColor(0, 51, 102); // Color azul corporativo
      doc.text('CASOS DE PRUEBA - QUALITY TEAMS', 15, 15);
      
      doc.setFontSize(10); // Reducir tamaño para información de proyecto
      doc.setTextColor(0, 0, 0);
      doc.text(`Proyecto: ${project?.proyecto || ''}`, 15, 22);
      doc.text(`Código JIRA: ${project?.idJira || ''}`, 15, 27);
      doc.text(`Fecha inicio: ${project?.fechaInicio ? new Date(project.fechaInicio).toLocaleDateString() : ''}`, 15, 32);
      doc.text(`Fecha fin: ${project?.fechaEntrega ? new Date(project.fechaEntrega).toLocaleDateString() : ''}`, 115, 32);
      
      // Calcular estadísticas por ciclo
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
      
      // Crear tabla de estadísticas
      const statsData = [];
      
      for (const cycle in cycleStats) {
        const stats = cycleStats[cycle];
        const exitosoPercent = stats.disenados ? Math.round((stats.exitosos / stats.disenados) * 100) : 0;
        const incidentesPercent = stats.disenados ? Math.round((stats.defectos / stats.disenados) * 100) : 0;
          
        statsData.push([
          cycle, 
          stats.disenados, 
          stats.exitosos, 
          stats.noEjecutados, 
          stats.defectos,
          `${exitosoPercent}%`,
          `${incidentesPercent}%`
        ]);
      }        // Añadir tabla de estadísticas
      autoTable(doc, {
        startY: 37, // Iniciar tabla más arriba
        head: [['Ciclo', 'Diseñados', 'Exitosos', 'No ejecutados', 'Defectos', '% Exitosos', '% Incidentes']],
        body: statsData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 102, 204],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8 // Fuente más pequeña
        },
        bodyStyles: {
          fontSize: 8 // Fuente más pequeña para datos
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 }
        },
        margin: { top: 5, right: 5, bottom: 5, left: 5 } // Márgenes más pequeños
      });      // Obtener la posición Y después de la tabla de estadísticas
      const finalY = (doc as any).lastAutoTable?.finalY || 55;
      
      // Calcular la calidad del desarrollo basada en defectos
      let totalDefectos = 0;
      let totalCasosDisenados = 0;
      
      for (const cycle in cycleStats) {
        totalDefectos += cycleStats[cycle].defectos;
        totalCasosDisenados += cycleStats[cycle].disenados;
      }
      
      let calidad = 100;
      if (totalCasosDisenados > 0) {
        // Calculamos la calidad como 100% menos el porcentaje de defectos sobre casos diseñados
        calidad = Math.max(0, Math.min(100, 100 - (totalDefectos / totalCasosDisenados) * 100));
      }
      
      // Añadir resumen de calidad
      doc.setFontSize(10);
      doc.setTextColor(0, 102, 0); // Color verde para calidad
      doc.text(`Calidad del desarrollo: ${Math.round(calidad)}%`, 15, finalY + 8);
        // Preparar datos para la tabla principal
      const tableData = testCases.map(tc => {
        // Acortar los pasos si son demasiado largos
        const pasos = tc.steps?.map(step => step.description).join('\n') || '';
        const pasosOptimizados = pasos.length > 300 ? pasos.substring(0, 297) + '...' : pasos;
        
        return [
          tc.userStoryId || '',
          tc.codeRef || '',
          tc.name || '',
          pasosOptimizados,
          tc.expectedResult || '',
          tc.testType || '',
          tc.status || '',
          tc.defects?.length ? tc.defects.join(', ') : '', // Usar comas en lugar de saltos para ahorrar espacio
          tc.responsiblePerson || ''
        ];
      });
        // Añadir tabla principal con casos de prueba
      autoTable(doc, {
        startY: finalY + 12, // Reducir espacio
        head: [['HU', 'ID', 'Nombre del caso', 'Pasos', 'Resultado esperado', 'Tipo', 'Estado', 'Defectos', 'Responsable']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 102, 204],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8 // Fuente más pequeña para encabezados
        },
        bodyStyles: {
          fontSize: 7 // Fuente más pequeña para contenido
        },
        columnStyles: {
          0: { cellWidth: 15 }, // HU - más estrecho
          1: { cellWidth: 15 }, // ID - más estrecho
          2: { cellWidth: 40 }, // Nombre - mantener ancho para legibilidad
          3: { cellWidth: 55 }, // Pasos - espacio adecuado
          4: { cellWidth: 40 }, // Resultado - reducido
          5: { cellWidth: 20 }, // Tipo - más estrecho
          6: { cellWidth: 20 }, // Estado - más estrecho
          7: { cellWidth: 30 }, // Defectos - mantener para legibilidad
          8: { cellWidth: 20 }  // Responsable - más estrecho
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 1 // Reducir el padding
        },        didDrawPage: (data) => {
          // Añadir pie de página
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8); // Fuente más pequeña para el pie de página
          doc.setTextColor(150);
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          
          // Guardar estado actual para restaurarlo después
          const oldFillColor = doc.getFillColor();
          
          // Añadir un rectángulo gris claro como fondo del pie de página
          doc.setFillColor(245, 245, 245);
          doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
          
          // Restaurar el color de relleno original
          doc.setFillColor(oldFillColor);
          
          // Añadir información en el pie de página
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`, 
            pageWidth - 30, 
            pageHeight - 6
          );
          doc.text(
            `Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            15,
            pageHeight - 6
          );
          
          // Añadir encabezado en páginas subsiguientes si no es la primera página
          if (data.pageNumber > 1) {
            // Guardar estado actual
            const oldFillColor = doc.getFillColor();
            
            // Añadir un rectángulo azul como encabezado
            doc.setFillColor(0, 51, 102);
            doc.rect(0, 0, pageWidth, 12, 'F');
            
            // Restaurar el color de relleno
            doc.setFillColor(oldFillColor);
            
            // Añadir texto del encabezado
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text('CASOS DE PRUEBA - QUALITY TEAMS', 15, 8);
            doc.text(`Proyecto: ${project?.proyecto || ''}`, pageWidth - 100, 8);
            
            // Restaurar colores para el contenido
            doc.setTextColor(0, 0, 0);
          }
        }
      });
      
      // Guardar archivo PDF
      doc.save(`${projectName}_casos_prueba.pdf`);
      
      toast.success('Exportación a PDF completada');
      setIsExportDialogOpen(false);    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      
      // Proporcionar un mensaje de error más detallado
      let errorMessage = 'Error al exportar a PDF';
      if (error instanceof Error) {
        errorMessage = `Error al exportar a PDF: ${error.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Función principal de exportación que decide a qué formato exportar
  const handleExport = () => {
    if (exportFormat === 'excel') {
      handleExportToExcel();
    } else {
      handleExportToPDF();
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
          <FileDown size={16} /> Exportar Casos de Prueba
        </Button>
      </div>

      {isExportDialogOpen && (
        <Dialog open={true} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Exportar Casos de Prueba</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Se exportarán {testCases.length} casos de prueba.
              </p>
              
              {!projectId && (
                <div className="space-y-2" ref={searchRef}>
                  <Label htmlFor="exportProject">Proyecto</Label>
                  <div className="relative">
                    <div className="flex items-center border rounded-md">
                      <Input
                        id="exportProject"
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          if (!showDropdown) setShowDropdown(true);
                        }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Buscar por código Jira o nombre del proyecto"
                        className="border-0"
                      />
                      <div className="px-3 py-2 text-gray-400">
                        <Search size={18} />
                      </div>
                    </div>
                    
                    {showDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border max-h-60 overflow-auto">
                        <div className="p-2 border-b text-sm text-gray-500">
                          {loadingPlans ? (
                            'Cargando proyectos...'
                          ) : filteredProjects.length > 0 ? (
                            `${filteredProjects.length} proyecto(s) encontrado(s)`
                          ) : (
                            'No se encontraron proyectos con planes de prueba'
                          )}
                        </div>
                        
                        {!loadingPlans && (
                          <ul>
                            {filteredProjects.map((project) => (
                              <li
                                key={project.id || project.idJira}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleProjectSelect(project)}
                              >
                                <div className="font-medium">{project.proyecto}</div>
                                {project.idJira && (
                                  <div className="text-xs text-gray-500">ID Jira: {project.idJira}</div>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedProjectId && (
                    <div className="text-xs text-blue-600 mt-1">
                      Proyecto seleccionado: {searchTerm}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="exportFormat">Formato de exportación</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={exportFormat === 'excel' ? 'default' : 'outline'}
                    className={`flex items-center gap-2 ${exportFormat === 'excel' ? 'bg-blue-600' : ''}`}
                    onClick={() => setExportFormat('excel')}
                  >
                    <FileDown size={16} /> Excel
                  </Button>
                  <Button
                    type="button"
                    variant={exportFormat === 'pdf' ? 'default' : 'outline'}
                    className={`flex items-center gap-2 ${exportFormat === 'pdf' ? 'bg-red-600' : ''}`}
                    onClick={() => setExportFormat('pdf')}
                  >
                    <FileText size={16} /> PDF
                  </Button>
                </div>
              </div>
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
                onClick={handleExport}
                disabled={isLoading || (!projectId && !selectedProjectId)}
              >
                {isLoading ? 'Exportando...' : `Exportar a ${exportFormat.toUpperCase()}`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
