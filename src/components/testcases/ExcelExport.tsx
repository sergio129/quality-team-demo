'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileDown, Search } from 'lucide-react';
import { TestCase } from '@/models/TestCase';
import { useProjects, useAllProjects } from '@/hooks/useProjects';
import { TestPlan } from '@/hooks/useTestPlans';

interface ExcelExportProps {
  projectId?: string;
  testCases?: TestCase[];
}

export default function ExcelExport({ projectId, testCases = [] }: ExcelExportProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const { projects } = useAllProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [projectsWithPlans, setProjectsWithPlans] = useState<any[]>([]);
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
