'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileDown, FileUp, FileText } from 'lucide-react';
import { createTestCase } from '@/hooks/useTestCases';
import { TestCase, TestStep } from '@/models/TestCase';
import { v4 as uuidv4 } from 'uuid';
import { useProjects } from '@/hooks/useProjects';

interface ExcelImportExportProps {
  projectId?: string;
  testCases?: TestCase[];
}

export default function ExcelImportExport({ projectId, testCases = [] }: ExcelImportExportProps) {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [cycle, setCycle] = useState<number>(1);

  const handleDownloadTemplate = () => {
    try {
      const mainData = [
        ['FORMATO DE CONSTRUCCION CASOS DE PRUEBAS EQUIPO QUALITY TEAMS', '', '', '', '', '', '', '', '', '', '', '', '', 'version 1.0'],
        [''],
        ['Codigo Peticion', ''],
        ['Nombre del proyecto', ''],
        ['Fecha Inicio producto', ''],
        ['Fecha Fin Producto', ''],
        [''],
        ['Total estimacion en Horas', '', '', 'Total estimacion en Dias', ''],
        [''],
        ['ESTADÍSTICAS'],
        ['', '', '', 'Diseñados', 'Exitosos', 'No ejecutados', 'Defectos', '% casos exitoso', '% incidentes'],
        ['', '', 'Ciclo 1', '', '', '', '', '', ''],
        [''],
        ['Calidad del desarrollo', '', '', '', '', '', '', '', '', '', '', '', '', '100%'],
        [''],
        [
          'HU', 'ID', 'Nombre del caso de prueba', 'Pasos', 'Resultado esperado', 'Tipo de Prueba', 'Estado', 
          'Defectos C1', 'Defectos C2', 'Defectos C3', 'Categoría de Incidencia', 'Evidencia Del caso', 'Observacion', 'Responsable'
        ],
        [
          'HU-01', 
          'TEST-001', 
          'Ejemplo: Validar inicio de sesión correcto',
          '1. Ingresar al sistema\n2. Ingresar credenciales válidas\n3. Hacer clic en Ingresar',
          'El usuario debe ingresar exitosamente al sistema',
          'Funcional',
          'No ejecutado',
          '', '', '', '', 'No', '', ''
        ]
      ];

      const ws = XLSX.utils.aoa_to_sheet(mainData);
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
        { s: { r: 13, c: 0 }, e: { r: 13, c: 13 } }
      );

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(data, 'plantilla_casos_prueba.xlsx');

      toast.success('Plantilla descargada exitosamente');
    } catch (error) {
      console.error('Error al generar plantilla:', error);
      toast.error('Error al descargar la plantilla');
    }
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
      const cycleStats = {
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
          '', '', cycle, stats.disenados, stats.exitosos, stats.noEjecutados, 
          stats.defectos, `${exitosoPercent}%`, `${incidentesPercent}%`
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
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const reader = new FileReader();
    
    setIsLoading(true);
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[];
        
        // Identificar la fila de encabezados
        let headerRowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
          if (Array.isArray(rows[i]) && 
              rows[i].includes('HU') && 
              rows[i].includes('ID') && 
              rows[i].includes('Nombre del caso de prueba')) {
            headerRowIndex = i;
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          toast.error('Formato no válido. No se encontró la fila de encabezados.');
          setIsLoading(false);
          return;
        }
        
        // Obtener índices de columnas
        const headers = rows[headerRowIndex];
        
        const getColIndex = (name: string) => headers.findIndex((h: string) => h && h.toString().includes(name));
        
        const huColIndex = getColIndex('HU');
        const idColIndex = getColIndex('ID');
        const nameColIndex = getColIndex('Nombre del caso de prueba');
        const stepsColIndex = getColIndex('Pasos');
        const resultColIndex = getColIndex('Resultado esperado');
        const typeColIndex = getColIndex('Tipo de Prueba');
        const statusColIndex = getColIndex('Estado');
        const responsibleColIndex = getColIndex('Responsable');
        
        // Importar casos de prueba
        const testCases: Partial<TestCase>[] = [];
        
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          
          if (!row || !Array.isArray(row) || row.length === 0 || !row[nameColIndex]) continue;
          
          const stepsText = row[stepsColIndex]?.toString() || '';
          const stepsArray = stepsText.split('\n').filter(Boolean);
          
          const steps: TestStep[] = stepsArray.map(step => ({
            id: uuidv4(),
            description: step,
            expected: ''
          }));
          
          const testCase: Partial<TestCase> = {
            id: uuidv4(),
            projectId: selectedProjectId,
            userStoryId: row[huColIndex]?.toString() || '',
            codeRef: row[idColIndex]?.toString() || '',
            name: row[nameColIndex]?.toString() || '',
            steps,
            expectedResult: row[resultColIndex]?.toString() || '',
            testType: mapTestType(row[typeColIndex]?.toString()),
            status: mapStatus(row[statusColIndex]?.toString()),
            cycle: Number(cycle),
            defects: [],
            evidences: [],
            responsiblePerson: row[responsibleColIndex]?.toString() || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          testCases.push(testCase);
        }
        
        // Validar casos antes de crear
        const validationErrors: { row: number; errors: string[] }[] = [];
        const validTestCases: Partial<TestCase>[] = [];

        testCases.forEach((testCase, index) => {
          const rowErrors: string[] = [];
          
          // Validar campos requeridos
          if (!testCase.userStoryId?.trim()) {
            rowErrors.push('Historia de Usuario (HU) es requerida');
          }
          if (!testCase.name?.trim()) {
            rowErrors.push('Nombre del caso de prueba es requerido');
          }
          if (!testCase.expectedResult?.trim()) {
            rowErrors.push('Resultado esperado es requerido');
          }
          if (testCase.steps?.length === 0) {
            rowErrors.push('Debe incluir al menos un paso');
          }

          // Si hay errores, agregar a la lista de errores
          if (rowErrors.length > 0) {
            validationErrors.push({ row: index + headerRowIndex + 2, errors: rowErrors });
          } else {
            validTestCases.push(testCase);
          }
        });

        // Si hay errores de validación, mostrar resumen y preguntar si continuar
        if (validationErrors.length > 0) {
          const totalErrors = validationErrors.reduce((sum, v) => sum + v.errors.length, 0);
          const errorSummary = `Se encontraron ${totalErrors} errores en ${validationErrors.length} casos:`;
          const detailedErrors = validationErrors
            .map(v => `\nFila ${v.row}: ${v.errors.join(', ')}`)
            .join('');

          if (!window.confirm(`${errorSummary}${detailedErrors}\n\n¿Desea continuar con la importación de los ${validTestCases.length} casos válidos?`)) {
            toast.info('Importación cancelada por el usuario');
            setIsLoading(false);
            return;
          }
        }

        // Crear casos en la base de datos
        let created = 0;
        let errors = 0;
        const importErrors: { name: string; error: string }[] = [];

        for (const testCase of validTestCases) {
          try {
            await createTestCase(testCase);
            created++;
          } catch (error) {
            console.error('Error al crear caso de prueba:', error);
            errors++;
            importErrors.push({
              name: testCase.name || 'Caso sin nombre',
              error: error instanceof Error ? error.message : 'Error desconocido'
            });
          }
        }

        // Mostrar resumen de la importación
        if (errors === 0) {
          toast.success(`Importación completada exitosamente. ${created} casos creados.`);
        } else {
          const errorSummary = `Importación completada con errores. ${created} casos creados, ${errors} errores:`;
          const detailedErrors = importErrors
            .map(e => `\n- ${e.name}: ${e.error}`)
            .join('');
          toast.error(`${errorSummary}${detailedErrors}`);
        }

        setIsImportDialogOpen(false);
      } catch (error) {
        console.error('Error al importar:', error);
        toast.error(`Error al importar desde Excel: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // Mapear tipo de prueba desde el Excel a los valores del modelo
  const mapTestType = (type: string = ''): TestCase['testType'] => {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('funcional')) return 'Funcional';
    if (lowerType.includes('no funcional')) return 'No Funcional';
    if (lowerType.includes('regresion') || lowerType.includes('regresión')) return 'Regresión';
    if (lowerType.includes('explorator')) return 'Exploratoria';
    if (lowerType.includes('integra')) return 'Integración';
    if (lowerType.includes('rendim')) return 'Rendimiento';
    if (lowerType.includes('segur')) return 'Seguridad';
    
    return 'Funcional'; // Valor por defecto
  };
  
  // Mapear estado desde el Excel a los valores del modelo
  const mapStatus = (status: string = ''): TestCase['status'] => {
    const lowerStatus = status.toLowerCase();
    
    if (lowerStatus.includes('exit')) return 'Exitoso';
    if (lowerStatus.includes('fall')) return 'Fallido';
    if (lowerStatus.includes('bloq')) return 'Bloqueado';
    if (lowerStatus.includes('progres')) return 'En progreso';
    
    return 'No ejecutado'; // Valor por defecto
  };

  return (
    <div className="excel-import-export">
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => setIsImportDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <FileUp size={16} /> Importar desde Excel
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setIsExportDialogOpen(true)}
          className="flex items-center gap-2"
          disabled={testCases.length === 0}
        >
          <FileDown size={16} /> Exportar a Excel
        </Button>
      </div>

      {isImportDialogOpen && (
        <Dialog 
          open={true}
          onOpenChange={setIsImportDialogOpen}
        >
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Importar Casos de Prueba desde Excel</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="importProject">Proyecto</Label>
                <Select
                  id="importProject"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  disabled={!!projectId}
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map((project) => (
                    <option key={project.id || project.idJira} value={project.idJira}>
                      {project.proyecto}
                    </option>
                  ))}
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="importCycle">Ciclo</Label>
                <Select
                  id="importCycle"
                  value={cycle.toString()}
                  onChange={(e) => setCycle(Number(e.target.value))}
                >
                  <option value="1">Ciclo 1</option>
                  <option value="2">Ciclo 2</option>
                  <option value="3">Ciclo 3</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileUpload">Archivo Excel</Label>
                <div 
                  className={`border-2 border-dashed rounded-md p-6 text-center transition-colors duration-200 ${
                    isLoading ? 'bg-gray-50' : 'hover:border-primary hover:bg-gray-50'
                  } ${!selectedProjectId ? 'opacity-50' : 'cursor-pointer'}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!selectedProjectId || isLoading) return;
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!selectedProjectId || isLoading) return;
                    
                    const file = e.dataTransfer.files[0];
                    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
                      const event = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                      handleFileUpload(event);
                    } else {
                      toast.error('Solo se permiten archivos Excel (.xlsx, .xls)');
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">Procesando archivo...</p>
                    </>
                  ) : (
                    <>
                      <FileText size={40} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedProjectId ? 'Seleccione o arrastre un archivo Excel' : 'Seleccione un proyecto primero'}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        El archivo debe seguir el formato estándar de casos de prueba
                      </p>
                      
                      <Input
                        id="fileUpload"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isLoading || !selectedProjectId}
                        className="hidden"
                      />
                      
                      {selectedProjectId && (
                        <div className="space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownloadTemplate}
                            disabled={isLoading}
                            className="mb-2"
                          >
                            <FileText className="h-4 w-4 mr-2" /> Descargar Plantilla
                          </Button>
                          <label htmlFor="fileUpload">
                            <Button
                              type="button" 
                              variant="outline"
                              disabled={isLoading}
                              className="cursor-pointer"
                            >
                              Seleccionar archivo
                            </Button>
                          </label>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsImportDialogOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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
