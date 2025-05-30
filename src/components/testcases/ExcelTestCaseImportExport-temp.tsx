'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileDown, FileUp, FileText, Sparkles } from 'lucide-react';
import { createTestCase } from '@/hooks/useTestCases';
import { TestCase, TestStep } from '@/models/TestCase';
import { v4 as uuidv4 } from 'uuid';
import { useProjects } from '@/hooks/useProjects';
import { AITestCaseGeneratorService, ExcelRequirementData } from '@/services/aiTestCaseGeneratorService';

interface ExcelTestCaseImportExportProps {
  projectId?: string;
  testCases?: TestCase[];
}

type CycleStats = {
  [key: string]: { 
    disenados: number;
    exitosos: number;
    noEjecutados: number;
    defectos: number;
  }
}

const ExcelTestCaseImportExport = ({ projectId, testCases = [] }: ExcelTestCaseImportExportProps): JSX.Element => {
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedTestCases, setGeneratedTestCases] = useState<Partial<TestCase>[]>([]);
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [cycle, setCycle] = useState<number>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [useAI, setUseAI] = useState<boolean>(false);
  
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
      const cycleStats: CycleStats = {
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
    setSelectedFile(file);
    
    if (!useAI) {
      processFileForImport(file);
    }
  };
  
  const processFileForImport = async (file: File) => {
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
          
          const steps: TestStep[] = stepsArray.map((step: string) => ({
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
        
        // Crear casos en la base de datos
        let created = 0;
        let errors = 0;
        
        for (const testCase of testCases) {
          try {
            await createTestCase(testCase);
            created++;
          } catch (error) {
            console.error('Error al crear caso de prueba:', error);
            errors++;
          }
        }
        
        toast.success(`Importación completada. ${created} casos creados. ${errors} errores.`);
        setIsImportDialogOpen(false);
      } catch (error) {
        console.error('Error al importar:', error);
        toast.error('Error al importar desde Excel');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  // Procesar el archivo para generar casos con IA
  const processFileForAI = async (file: File) => {
    const reader = new FileReader();
    setIsGeneratingAI(true);
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[];
        
        // Identificar la fila de encabezados de requerimientos
        let headerRowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (Array.isArray(row) && 
             (row.some(cell => cell && cell.toString().includes('Historia')) || 
              row.some(cell => cell && cell.toString().includes('Requisito')) ||
              row.some(cell => cell && cell.toString().includes('Requerimiento')))) {
            headerRowIndex = i;
            break;
          }
        }
        
        if (headerRowIndex === -1) {
          toast.error('Formato no válido para generación con IA. No se encontraron requerimientos.');
          setIsGeneratingAI(false);
          return;
        }
        
        // Obtener índices de columnas para requerimientos
        const headers = rows[headerRowIndex];
        const getColIndex = (keywords: string[]) => {
          return headers.findIndex((h: string) => {
            if (!h) return false;
            const text = h.toString().toLowerCase();
            return keywords.some(keyword => text.includes(keyword.toLowerCase()));
          });
        };
        
        const idColIndex = getColIndex(['id', 'código', 'codigo', 'hu']);
        const nameColIndex = getColIndex(['nombre', 'titulo', 'título', 'historia']);
        const descColIndex = getColIndex(['descripción', 'descripcion', 'detalle']);
        const criteriaColIndex = getColIndex(['criterio', 'aceptación', 'aceptacion', 'condición', 'condicion']);
        
        // Extraer requerimientos
        const requirements: ExcelRequirementData[] = [];
        
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !Array.isArray(row) || row.length === 0) continue;
          
          // Procesamos los criterios de aceptación que pueden estar en múltiples filas o en una sola celda
          let acceptanceCriteria: string[] = [];
          if (criteriaColIndex >= 0 && row[criteriaColIndex]) {
            const criteriaText = row[criteriaColIndex].toString();
            // Si hay números o viñetas, dividimos por líneas
            if (criteriaText.match(/^\d+[\.\)]\s|^[-*•]\s/m)) {
              acceptanceCriteria = criteriaText
                .split(/\n/)
                .map((line: string) => line.trim())
                .filter(Boolean);
            } else {
              acceptanceCriteria = [criteriaText];
            }
          }
          
          const requirement: ExcelRequirementData = {
            userStoryId: idColIndex >= 0 ? row[idColIndex]?.toString() || '' : '',
            requirementName: nameColIndex >= 0 ? row[nameColIndex]?.toString() || '' : '',
            description: descColIndex >= 0 ? row[descColIndex]?.toString() || '' : '',
            acceptanceCriteria,
            functionalDescription: ''  // Este campo podría extraerse de otro lugar si existe
          };
          
          // Solo añadimos requerimientos con información suficiente
          if (requirement.requirementName || requirement.description) {
            requirements.push(requirement);
          }
        }
        
        if (requirements.length === 0) {
          toast.error('No se encontraron requerimientos válidos en el archivo.');
          setIsGeneratingAI(false);
          return;
        }
        
        // Llamar al servicio de IA para generar los casos de prueba
        const aiResult = await AITestCaseGeneratorService.generateTestCasesWithAI(requirements);
        
        if (aiResult.success && aiResult.data.length > 0) {
          setGeneratedTestCases(aiResult.data);
          toast.success(`Se generaron ${aiResult.data.length} casos de prueba con IA.`);
          setIsAIDialogOpen(true);
        } else {
          toast.error(aiResult.error || 'Error al generar casos de prueba con IA.');
        }
      } catch (error) {
        console.error('Error al procesar archivo para IA:', error);
        toast.error('Error al procesar el archivo para generación con IA');
      } finally {
        setIsGeneratingAI(false);
      }
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  const handleGenerateAI = async () => {
    if (!selectedFile || !selectedProjectId) {
      toast.error('Selecciona un proyecto y un archivo Excel primero.');
      return;
    }
    
    await processFileForAI(selectedFile);
  };

  const handleSaveGeneratedCases = async () => {
    if (generatedTestCases.length === 0) {
      toast.error('No hay casos de prueba generados para guardar.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      let created = 0;
      let errors = 0;
      
      // Asegurarnos que todos los casos tengan el projectId actual
      const casesToSave = generatedTestCases.map(tc => ({
        ...tc,
        projectId: selectedProjectId,
        cycle: Number(cycle)
      }));
      
      for (const testCase of casesToSave) {
        try {
          await createTestCase(testCase);
          created++;
        } catch (error) {
          console.error('Error al guardar caso de prueba:', error);
          errors++;
        }
      }
      
      toast.success(`Guardado completado. ${created} casos creados. ${errors} errores.`);
      setIsAIDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar los casos generados:', error);
      toast.error('Error al guardar los casos generados');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadTemplate = () => {
    try {
      // Crear datos para la plantilla
      const templateData = [
        ['PLANTILLA DE REQUERIMIENTOS PARA GENERACIÓN DE CASOS DE PRUEBA CON IA', '', '', '', ''],
        [''],
        ['ID Historia', 'Nombre del Requerimiento', 'Descripción', 'Criterios de Aceptación', 'Descripción Funcional'],
        ['US-001', 'Login de Usuario', 'El sistema debe permitir que los usuarios inicien sesión con email y contraseña', '1. El usuario debe poder ingresar su email\n2. El usuario debe poder ingresar su contraseña\n3. El sistema debe validar las credenciales\n4. El sistema debe mostrar un mensaje de error si las credenciales son incorrectas', 'El formulario de login debe contener campos para email y contraseña, con validación de formato de email y un botón de "Iniciar Sesión"'],
        ['US-002', 'Registro de Usuario', 'El sistema debe permitir que los nuevos usuarios se registren', '1. El formulario debe incluir: nombre, email, contraseña y confirmación\n2. Validar que el email no esté ya registrado\n3. La contraseña debe tener al menos 8 caracteres', 'La página de registro debe mostrar el formulario con validaciones en tiempo real y mostrar errores específicos'],
      ];
      
      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      
      // Estilizar algunas celdas
      if (!ws['!merges']) ws['!merges'] = [];
      
      // Merge para el título principal
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });
      
      // Crear libro
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Requerimientos');
      
      // Generar archivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Guardar archivo
      saveAs(data, 'plantilla_requerimientos.xlsx');
      
      toast.success('Plantilla descargada con éxito');
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      toast.error('Error al descargar la plantilla');
    }
  };
  
  const handleDownloadGeneratedCases = () => {
    if (generatedTestCases.length === 0) {
      toast.error('No hay casos de prueba generados para descargar.');
      return;
    }
    
    try {
      const project = projects.find(p => p.id === selectedProjectId || p.idJira === selectedProjectId);
      const projectName = project ? project.proyecto : 'casos_prueba';
      
      // Formatear datos para el Excel
      const mainData = [
        ['CASOS DE PRUEBA GENERADOS POR IA - EQUIPO QUALITY TEAMS', '', '', '', '', '', '', '', '', '', '', '', '', 'version 1.0'],
        [''],
        ['Codigo Peticion', project?.idJira || ''],
        ['Nombre del proyecto', project?.proyecto || ''],
        ['Fecha Generación', new Date().toLocaleDateString()],
        [''],
        ['Total de Casos Generados', generatedTestCases.length.toString()],
        ['']
      ];
      
      // Encabezados de la tabla de casos
      mainData.push([
        'HU', 'ID', 'Nombre del caso de prueba', 'Pasos', 'Resultado esperado', 'Tipo de Prueba', 'Estado', 
        'Prioridad', 'Categoría', 'Responsable'
      ]);
      
      // Datos de los casos
      generatedTestCases.forEach(tc => {
        const pasos = tc.steps?.map(step => step.description).join('\n') || '';
        
        mainData.push([
          tc.userStoryId || '',
          tc.codeRef || '',
          tc.name || '',
          pasos,
          tc.expectedResult || '',
          tc.testType || '',
          tc.status || '',
          tc.priority || '',
          tc.category || '',
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
      XLSX.utils.book_append_sheet(wb, ws, 'Casos IA');
      
      // Generar archivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Guardar archivo
      saveAs(data, `${projectName}_casos_prueba_ia.xlsx`);
      
      toast.success('Casos descargados con éxito');
    } catch (error) {
      console.error('Error al descargar casos generados:', error);
      toast.error('Error al descargar los casos generados');
    }
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
    <div>
      <div className="flex gap-2 mb-4">
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
        
        <Button
          variant="outline"
          onClick={() => {
            setUseAI(true);
            setIsImportDialogOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Sparkles size={16} className="text-yellow-500" /> Generar con IA
        </Button>
      </div>

      {/* Diálogo de Importación */}
      {isImportDialogOpen && (
        <Dialog 
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setIsImportDialogOpen(false);
              setUseAI(false);
              setSelectedFile(null);
            }
          }}
        >
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>
                {useAI 
                  ? "Generar Casos de Prueba con IA" 
                  : "Importar Casos de Prueba desde Excel"}
              </DialogTitle>
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
                <Label htmlFor="fileUpload">
                  {useAI 
                    ? "Archivo Excel con Requerimientos" 
                    : "Archivo Excel con Casos de Prueba"}
                </Label>
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
                  {isLoading || isGeneratingAI ? (
                    <>
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">
                        {isGeneratingAI ? 'Generando casos con IA...' : 'Procesando archivo...'}
                      </p>
                    </>
                  ) : (
                    <>
                      {useAI ? <Sparkles size={40} className="mx-auto text-yellow-500 mb-2" /> : <FileText size={40} className="mx-auto text-gray-400 mb-2" />}
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedProjectId 
                          ? 'Seleccione o arrastre un archivo Excel' 
                          : 'Seleccione un proyecto primero'}
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        {useAI 
                          ? 'El archivo debe contener los requerimientos para generar casos de prueba' 
                          : 'El archivo debe seguir el formato estándar de casos de prueba'}
                      </p>
                      
                      <Input
                        id="fileUpload"
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileUpload}
                        disabled={isLoading || isGeneratingAI || !selectedProjectId}
                        className="hidden"
                      />
                      <div className="space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleDownloadTemplate}
                          disabled={isLoading || isGeneratingAI}
                          className="mb-2"
                        >
                          <FileText className="h-4 w-4 mr-2" /> Descargar Plantilla
                        </Button>
                        <label htmlFor="fileUpload">
                          <Button
                            type="button" 
                            variant="outline"
                            disabled={isLoading || isGeneratingAI || !selectedProjectId}
                            className="cursor-pointer"
                          >
                            Seleccionar archivo
                          </Button>
                        </label>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-4 text-sm text-gray-600">
                          <p>Archivo seleccionado: <span className="font-medium">{selectedFile.name}</span></p>
                          {useAI && (
                            <Button 
                              onClick={handleGenerateAI}
                              disabled={isGeneratingAI || !selectedProjectId || !selectedFile}
                              className="mt-2"
                            >
                              <Sparkles size={16} className="mr-2" /> Generar Casos con IA
                            </Button>
                          )}
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
                onClick={() => {
                  setIsImportDialogOpen(false);
                  setUseAI(false);
                  setSelectedFile(null);
                }}
                disabled={isLoading || isGeneratingAI}
              >
                Cancelar
              </Button>
              
              {!useAI && selectedFile && (
                <Button
                  onClick={() => processFileForImport(selectedFile)}
                  disabled={isLoading || !selectedProjectId || !selectedFile}
                >
                  Importar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de Exportación */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
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

      {/* Diálogo de Casos Generados con IA */}
      <Dialog 
        open={isAIDialogOpen} 
        onOpenChange={(open) => !isLoading && setIsAIDialogOpen(open)}
      >
        <DialogContent className="sm:max-w-[650px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Casos de Prueba Generados por IA</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Se han generado {generatedTestCases.length} casos de prueba utilizando IA.
            </p>
            
            {/* Vista previa de los casos generados */}
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h3 className="text-sm font-medium">Vista previa de casos generados</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto p-4">
                {generatedTestCases.map((tc, idx) => (
                  <div key={idx} className="mb-4 pb-4 border-b last:border-b-0">
                    <div className="flex justify-between">
                      <h4 className="font-medium">{tc.name}</h4>
                      <span className="text-sm text-gray-500">{tc.codeRef}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div>
                        <p className="text-gray-500">HU: <span className="text-gray-700">{tc.userStoryId || 'No especificada'}</span></p>
                        <p className="text-gray-500">Tipo: <span className="text-gray-700">{tc.testType}</span></p>
                        <p className="text-gray-500">Prioridad: <span className="text-gray-700">{tc.priority}</span></p>
                      </div>
                      <div>
                        <p className="text-gray-500">Resultado esperado:</p>
                        <p className="text-gray-700">{tc.expectedResult}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-500">Pasos:</p>
                      <ol className="list-decimal pl-5 text-sm">
                        {tc.steps?.map((step, stepIdx) => (
                          <li key={stepIdx} className="text-gray-700">{step.description}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAIDialogOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadGeneratedCases}
                disabled={isLoading}
              >
                <FileDown size={16} className="mr-2" /> Descargar Excel
              </Button>
              <Button
                onClick={handleSaveGeneratedCases}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar Casos'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExcelTestCaseImportExport;
