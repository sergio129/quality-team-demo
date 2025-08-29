'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-radix';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileDown, FileUp, FileText, Sparkles, Edit2, Check, Plus, Trash2, Target, BarChart3 } from 'lucide-react';
import { createTestCase } from '@/hooks/useTestCases';
import { TestCase as BaseTestCase, TestStep } from '@/models/TestCase';
import { ExtendedTestCase, PartialExtendedTestCase } from './types';
import { v4 as uuidv4 } from 'uuid';
import { useProjects, useAllProjects } from '@/hooks/useProjects';
import { useTestPlans } from '@/hooks/useTestCases';
import { AITestCaseGeneratorService, ExcelRequirementData } from '@/services/aiTestCaseGeneratorService';
import { AITestCaseGenerator, CoverageReport } from '@/types/aiTestCaseGenerator';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ExcelTestCaseImportExportProps {
  projectId?: string;
  testCases?: BaseTestCase[];
  testPlanId?: string;
  onRefresh?: () => void;
  initialMode?: 'import' | 'export' | 'ai'; // Nueva prop para iniciar en un modo específico
}

const ExcelTestCaseImportExport = ({ 
  projectId, 
  testCases = [], 
  testPlanId, 
  onRefresh,
  initialMode 
}: ExcelTestCaseImportExportProps): React.JSX.Element => {  
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(initialMode === 'import');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(initialMode === 'export');
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedTestCases, setGeneratedTestCases] = useState<PartialExtendedTestCase[]>([]);
  const [editingTestCaseIndex, setEditingTestCaseIndex] = useState<number | null>(null);
  const [editingTestCase, setEditingTestCase] = useState<PartialExtendedTestCase | null>(null);

  // Nuevos estados para las funcionalidades adicionales
  const [userStoryInput, setUserStoryInput] = useState('');
  const [requirementsInput, setRequirementsInput] = useState('');
  const [suggestedScenarios, setSuggestedScenarios] = useState<string[]>([]);
  const [coverageReport, setCoverageReport] = useState<CoverageReport | null>(null);
  const [isUserStoryDialogOpen, setIsUserStoryDialogOpen] = useState(false);
  const [isRequirementsDialogOpen, setIsRequirementsDialogOpen] = useState(false);
  const [isScenariosDialogOpen, setIsScenariosDialogOpen] = useState(false);
  const [isCoverageDialogOpen, setIsCoverageDialogOpen] = useState(false);
  const [testPlanSearchTerm, setTestPlanSearchTerm] = useState('');
  const { projects } = useAllProjects();  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');  const { testPlans, isLoading: isLoadingPlans, isError: isErrorPlans } = useTestPlans(
    selectedProjectId && selectedProjectId !== '' && selectedProjectId !== 'select_project' ? selectedProjectId : null
  );
  const [selectedTestPlanId, setSelectedTestPlanId] = useState(testPlanId || '');
  const [cycle, setCycle] = useState<number>(1);  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [useAI, setUseAI] = useState<boolean>(initialMode === 'ai');
  
  // Obtener la sesión del usuario para debugging
  const { data: session } = useSWR('/api/auth/session', fetcher);
  
  // Depuración para ver qué está pasando con los proyectos
  useEffect(() => {
    console.log('Proyectos disponibles:', projects);
    console.log('Número de proyectos:', projects?.length || 0);
    console.log('¿Hay sesión?:', !!session);
    console.log('Sesión completa:', session);
  }, [projects, session]);

  // Depuración para ver qué está pasando con los planes de prueba
  useEffect(() => {
    console.log('selectedProjectId:', selectedProjectId);
    console.log('testPlans:', testPlans);
    console.log('isLoadingPlans:', isLoadingPlans);
    console.log('isErrorPlans:', isErrorPlans);
  }, [selectedProjectId, testPlans, isLoadingPlans, isErrorPlans]);
  
  // Efecto para inicializar proyecto automáticamente si no hay uno seleccionado
  useEffect(() => {
    if (!selectedProjectId && projects && projects.length > 0 && !projectId) {
      console.log('Inicializando proyecto automáticamente:', projects[0]);
      setSelectedProjectId(projects[0].idJira || projects[0].id || 'unknown');
    }
  }, [projects, selectedProjectId, projectId]);

  // Efecto para sincronizar proyecto cuando cambia el plan de pruebas
  useEffect(() => {
    if (testPlanId && testPlans && testPlans.length > 0) {
      const selectedPlan = testPlans.find(plan => plan.id === testPlanId);
      if (selectedPlan && selectedPlan.projectId && selectedPlan.projectId !== selectedProjectId) {
        console.log('Sincronizando proyecto desde plan:', selectedPlan.projectId);
        setSelectedProjectId(selectedPlan.projectId);
      }
    }
  }, [testPlanId, testPlans, selectedProjectId]);

  // Log para debugging del flujo de inicialización
  useEffect(() => {
    console.log('🔧 ExcelTestCaseImportExport inicializado con:');
    console.log('🔧 initialMode:', initialMode);
    console.log('🔧 projectId:', projectId);
    console.log('🔧 testPlanId:', testPlanId);
    console.log('🔧 useAI:', useAI);
    console.log('🔧 selectedProjectId:', selectedProjectId);
    console.log('🔧 selectedTestPlanId:', selectedTestPlanId);
  }, []);

  // Log para debugging del diálogo de historia de usuario
  useEffect(() => {
    if (isUserStoryDialogOpen) {
      console.log('🚨 Diálogo de historia de usuario ABIERTO');
      console.log('🚨 userStoryInput:', userStoryInput);
      console.log('🚨 selectedProjectId:', selectedProjectId);
      console.log('🚨 selectedTestPlanId:', selectedTestPlanId);
    }
  }, [isUserStoryDialogOpen]);
  
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
      const cycleStats: Record<string, { disenados: number; exitosos: number; noEjecutados: number; defectos: number }> = {
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
          tc.userStoryId || '',
          tc.codeRef || '',
          tc.name || '',
          pasos,
          tc.expectedResult || '',
          tc.testType || '',
          tc.status || '',
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
    setSelectedFileName(file.name); // Guardamos el nombre para mostrarlo en la interfaz
    
    // Mostramos una notificación del archivo seleccionado
    toast.success(`Archivo seleccionado: ${file.name}`);
    
    // Si no estamos usando IA, procesamos inmediatamente el archivo
    // De lo contrario, solo guardamos la referencia al archivo para procesarlo después
    if (!useAI) {
      if (selectedProjectId && selectedProjectId !== 'select_project') {
        processFileForImport(file);
      } else {
        toast.warning('Selecciona un proyecto antes de procesar el archivo');
      }
    }
  };
    const processFileForImport = async (file: File) => {
    // Verificar que los parámetros necesarios estén presentes
    if (!selectedProjectId || selectedProjectId === 'select_project') {
      toast.error('Selecciona un proyecto válido primero.');
      return;
    }
    
    const reader = new FileReader();
    setIsLoading(true);
    
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("El archivo Excel no contiene hojas de cálculo");
        }
        
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
        const testCases: Partial<BaseTestCase>[] = [];
        
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
          
          const testCase: Partial<BaseTestCase> = {
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
    let processedSheetName = '';

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Buscar específicamente la hoja "HU" (Historias de Usuario)
        const huSheetName = workbook.SheetNames.find(name =>
          name.toLowerCase().includes('hu') ||
          name.toLowerCase().includes('historias') ||
          name.toLowerCase().includes('user stories') ||
          name.toLowerCase().includes('stories')
        );

        if (!huSheetName) {
          toast.error('No se encontró una hoja llamada "HU", "Historias" o "User Stories" en el archivo Excel. Por favor, asegúrese de que el archivo contenga una hoja con las historias de usuario.');
          setIsGeneratingAI(false);
          return;
        }

        processedSheetName = huSheetName;

        console.log(`✅ Hoja encontrada: "${processedSheetName}". Procesando historias de usuario...`);
        toast.info(`Procesando hoja "${processedSheetName}" - Buscando historias de usuario en formato "Como/Quiero/Para"...`);

        const huSheet = workbook.Sheets[processedSheetName];
        const rows = XLSX.utils.sheet_to_json(huSheet, { header: 1 }) as any[];

        if (rows.length === 0) {
          toast.error(`La hoja "${processedSheetName}" está vacía.`);
          setIsGeneratingAI(false);
          return;
        }

        console.log(`📊 Procesando ${rows.length} filas de historias de usuario`);

        // Validar que la hoja tenga un formato reconocible de historias de usuario
        const validateHUFormat = (sheetRows: any[]): boolean => {
          if (sheetRows.length < 2) return false; // Necesita al menos encabezados y una fila de datos

          const headerRow = sheetRows[0];
          if (!headerRow || !Array.isArray(headerRow)) return false;

          // Contar cuántos encabezados de historias de usuario se reconocen
          let recognizedHeaders = 0;
          const headerText = headerRow.map(cell => String(cell || '').toLowerCase().trim());

          // Encabezados específicos de historias de usuario
          const userStoryHeaders = [
            'id', 'hu', 'historia', 'user story', 'como', 'quiero', 'para',
            'rol', 'funcionalidad', 'razón', 'actor', 'necesito', 'resultado',
            'criterios', 'aceptación', 'descripción', 'titulo', 'title',
            // NUEVOS: Encabezados específicos del formato del usuario
            'como un [rol]', 'como un', 'como [rol]',
            'necesito [característica', 'necesito [característica funcionalidad]',
            'con la finalidad de', 'con la finalidad de [razón',
            'número (#) de escenario', 'número de escenario',
            'nombre o titulo criterio', 'titulo criterio',
            'cuando [evento]', 'espero que el sistema',
            'resultado esperado', 'comportamiento esperado'
          ];

          headerText.forEach(header => {
            if (userStoryHeaders.some(ush => header.includes(ush) || ush.includes(header))) {
              recognizedHeaders++;
            }
          });

          // Para este formato específico, si encontramos al menos ID + 2 elementos del formato HU, es válido
          return recognizedHeaders >= 3; // Al menos ID + 2 encabezados de HU
        };

        if (!validateHUFormat(rows)) {
          toast.error(
            `La hoja "${processedSheetName}" no parece contener historias de usuario en el formato esperado. ` +
            'La hoja debe tener encabezados como: ID, HU, Como, Quiero, Para, Descripción, Criterios de Aceptación, etc. ' +
            'Por favor, revise el formato de su archivo Excel.'
          );
          setIsGeneratingAI(false);
          return;
        }

        // Intento de detección automática del tipo de formato para historias de usuario
        const requirements: ExcelRequirementData[] = [];          // Buscar encabezados comunes en diferentes formatos
        const possibleHeaders = [
          // Formato estándar
          ['ID Historia', 'Historia', 'HU', 'User Story', 'ID', 'Código', 'Codigo', 'Code', 'Story ID', 'ID US', 'US ID'],
          ['Nombre del Requerimiento', 'Requerimiento', 'Requisito', 'Nombre', 'Título', 'Title', 'Nombre Historia', 'Story Title', 'Nombre US'],
          ['Descripción', 'Detalle', 'Description', 'Descripcion', 'Detalles', 'Texto Historia', 'Story Description', 'Desc'],
          ['Criterios de Aceptación', 'Criterios', 'Acceptance Criteria', 'Condiciones', 'Criterios Aceptación', 'AC', 'Criterios de Éxito', 'Criterios Aceptacion'],
          // Formato historias de usuario
          ['Rol', 'Como', 'As a', 'Actor', 'Usuario', 'Perfil', 'Tipo Usuario', 'Role', 'As an', 'Como un', 'Stakeholder', 'Interesado'],
          ['Funcionalidad', 'Quiero', 'I want', 'Necesito', 'I need', 'Deseo', 'Característica', 'Caracteristica', 'Functionality', 'Want to', 'Ability', 'Capacidad', 'Need to'],
          ['Razón', 'Resultado', 'Para', 'So that', 'A fin de', 'Con el fin de', 'Beneficio', 'Objetivo', 'Reason', 'Benefit', 'Purpose', 'Propósito', 'In order to'],
          // Formato adicional: Precondiciones y datos
          ['Precondiciones', 'Precondición', 'Pre-requisitos', 'Prerequisitos', 'Precondition', 'Pre-condition', 'Condiciones previas'],
          ['Datos de prueba', 'Test Data', 'Datos', 'Ejemplos', 'Escenarios', 'Valores', 'Data'],
          // NUEVO: Formato específico del usuario
          ['como un [rol]', 'como un', 'como [rol]'],
          ['necesito [característica', 'necesito', 'requiero', 'necesito [característica funcionalidad]'],
          ['con la finalidad de', 'finalidad de', 'con el fin de', 'para [razón', 'con la finalidad de [razón'],
          ['número (#) de escenario', 'número de escenario', 'escenario', 'número (#)'],
          ['nombre o titulo criterio', 'titulo criterio', 'criterio de aceptación', 'nombre criterio'],
          ['contexto', 'condiciones', 'precondiciones'],
          ['cuando [evento]', 'cuando', 'evento'],
          ['espero que el sistema', 'resultado esperado', 'comportamiento esperado', 'espero que']
        ];
        
        // Encontrar la fila de encabezados escaneando las primeras 10 filas
        let headerRowIndex = -1;
        let headerMapping: Record<string, number> = {};
        
        for (let i = 0; i < Math.min(10, rows.length); i++) {
          if (!Array.isArray(rows[i])) continue;
          
          // Contar cuántos encabezados reconocidos hay en esta fila
          let matchCount = 0;
          const rowHeaders = rows[i].map((cell: any) => String(cell || '').trim().toLowerCase());
          const currentMapping: Record<string, number> = {};
          
          // Verificar cada columna en esta fila
          for (let j = 0; j < rowHeaders.length; j++) {
            const cellValue = rowHeaders[j];
            if (!cellValue) continue;
            
            // Buscar coincidencias con nuestros encabezados conocidos
            for (let k = 0; k < possibleHeaders.length; k++) {
              if (possibleHeaders[k].some(header => 
                cellValue.includes(header.toLowerCase()) || 
                cellValue === header.toLowerCase().substring(0, Math.min(header.length, 10))
              )) {
                matchCount++;
                // Guardar el tipo de columna y su índice
                currentMapping[k.toString()] = j;
                break;
              }
            }
          }
          
          // Si encontramos suficientes coincidencias, consideramos que esta es la fila de encabezados
          if (matchCount >= 2) { // Al menos ID y Nombre o Descripción
            headerRowIndex = i;
            headerMapping = currentMapping;
            break;
          }
        }
        
        // Si no encontramos encabezados, intentar otro enfoque
        if (headerRowIndex === -1) {
          // Buscar cualquier fila que tenga al menos una celda con "requerimiento", "requisito" o "historia"
          for (let i = 0; i < Math.min(15, rows.length); i++) {
            if (!Array.isArray(rows[i])) continue;

            const rowText = rows[i].join(' ').toLowerCase();
            if (rowText.includes('requerimiento') || rowText.includes('requisito') ||
                rowText.includes('historia') || rowText.includes('user story') ||
                rowText.includes('hu') || rowText.includes('id') ||
                rowText.includes('como') || rowText.includes('necesito')) {
              headerRowIndex = i;
              // Crear un mapeo más completo basado en el número de columnas
              const numColumns = rows[i].length;
              headerMapping = {};
              for (let j = 0; j < numColumns; j++) {
                headerMapping[j.toString()] = j;
              }
              console.log(`✅ Encabezados detectados en fila ${i + 1}, ${numColumns} columnas mapeadas`);
              break;
            }
          }
        }

        // Si aún no encontramos encabezados, usar un enfoque simplificado
        if (headerRowIndex === -1) {
          toast.warning('No se detectaron encabezados claros. Intentando procesamiento simplificado...');
          headerRowIndex = 0;
          // Crear mapeo completo para todas las columnas disponibles
          const numColumns = rows[0]?.length || 9;
          headerMapping = {};
          for (let j = 0; j < numColumns; j++) {
            headerMapping[j.toString()] = j;
          }
        }

        console.log(`📋 Header mapping final:`, headerMapping);
        console.log(`📋 Fila de encabezados detectada: ${headerRowIndex + 1}`);
        if (headerRowIndex >= 0 && rows[headerRowIndex]) {
          console.log(`📋 Encabezados encontrados:`, rows[headerRowIndex].map((cell: any) => `"${cell || ''}"`).join(', '));
        }

        // Procesar los datos desde la fila posterior a la de encabezados
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !Array.isArray(row) || row.every(cell => !cell)) continue;

          console.log(`🔍 Procesando fila ${i + 1}:`, row.map(cell => `"${cell || ''}"`).join(', '));

          // Usar índices directos basados en el formato conocido del Excel
          // Formato esperado: ID, Como un [Rol], Necesito [Característica Funcionalidad], Con la finalidad de [Razón / Resultado], etc.
          const rawUserStoryId = row[0]?.toString().trim() || '';

          // FILTRAR filas que parecen ser encabezados o plantillas
          if (rawUserStoryId === 'ID' || rawUserStoryId === '' ||
              rawUserStoryId.toLowerCase().includes('como un [rol]') ||
              rawUserStoryId.toLowerCase().includes('necesito [')) {
            console.log(`⏭️ Saltando fila ${i + 1} - parece ser encabezado o plantilla: "${rawUserStoryId}"`);
            continue;
          }

          // Generar ID de historia de usuario: usar el ID del Excel o generar HU-X basado en la fila
          const userStoryId = rawUserStoryId ? rawUserStoryId : `HU${i - headerRowIndex}`;
          const rol = row[1]?.toString().trim() || ''; // Columna 1: Como un [Rol]
          const funcionalidad = row[2]?.toString().trim() || ''; // Columna 2: Necesito [Característica Funcionalidad]
          const razon = row[3]?.toString().trim() || ''; // Columna 3: Con la finalidad de [Razón / Resultado]
          const escenario = row[4]?.toString().trim() || ''; // Columna 4: Número (#) de Escenario
          const contexto = row[6]?.toString().trim() || ''; // Columna 6: Contexto

          console.log(`📋 Valores extraídos - ID: "${userStoryId}", Rol: "${rol}", Funcionalidad: "${funcionalidad}", Razón: "${razon}"`);
          
          // Procesamiento especial para criterios de aceptación
          let acceptanceCriteria: string[] = [];
          if (row[5]) { // Columna 5: Nombre o titulo Criterio de Aceptación
            const criteriaText = row[5]?.toString() || '';
            const cleanText = criteriaText.trim();
            
            // Caso 1: Texto ya dividido por líneas con numeración o viñetas (formato más común)
            if (cleanText.match(/^\d+[\.\)-]\s|^[-*•]\s/m)) {
              acceptanceCriteria = cleanText
                .split(/\n/)
                .map((line: string) => line.trim())
                .filter(Boolean)
                // Eliminar números o viñetas del inicio para normalizar
                .map((line: string) => line.replace(/^\d+[\.\)-]\s+|^[-*•]\s+/, ''));
            }
            // Caso 2: Lista separada por puntos
            else if (cleanText.includes('. ') && cleanText.split('. ').length > 1) {
              acceptanceCriteria = cleanText
                .split(/\.\s+/)
                .map((criteria: string) => criteria.trim())
                .filter(Boolean)
                .map((criteria: string) => criteria.endsWith('.') ? criteria : criteria + '.');
            }
            // Caso 3: Texto separado por punto y coma, comas o saltos de línea
            else if (cleanText.match(/;|,|\n/)) {
              let separator = /;\s*/;
              if (cleanText.includes(',') && !cleanText.includes(';')) {
                separator = /,\s*/;
              } else if (cleanText.includes('\n') && !cleanText.includes(';') && !cleanText.includes(',')) {
                separator = /\n+/;
              }
              acceptanceCriteria = cleanText
                .split(separator)
                .map((criteria: string) => criteria.trim())
                .filter(Boolean);
            }            // Caso 4: Texto en formato "Criterio: valor" o "Dado/Cuando/Entonces" (Gherkin)
            else {
              // Primero buscamos formato etiqueta: valor
              const criteriaWithLabels = cleanText.match(/([A-Za-z\s]+):\s*([^\n]+)/g);
              
              // Luego buscamos formato Gherkin (Dado/Cuando/Entonces o Given/When/Then)
              const gherkinFormat = cleanText.match(/(Dado|Cuando|Entonces|Given|When|Then|And|Y|Pero|But)\s+([^\n]+)/gi);
              
              if (criteriaWithLabels && criteriaWithLabels.length >= 1) {
                // Formato etiqueta: valor
                acceptanceCriteria = criteriaWithLabels.map((c: string) => c.trim());
              } 
              else if (gherkinFormat && gherkinFormat.length >= 1) {
                // Formato Gherkin - intentamos reconstruir los escenarios
                if (cleanText.match(/Escenario:|Scenario:|Example:/i)) {
                  // Si hay múltiples escenarios, intentamos separarlos
                  const scenarios = cleanText.split(/(?=Escenario:|Scenario:|Example:)/i);
                  
                  acceptanceCriteria = scenarios.map((scenario: string) => {
                    // Limpiar espacios extras y formatear cada escenario
                    return scenario.trim()
                      .replace(/\n+/g, ' ')
                      .replace(/\s{2,}/g, ' ');
                  }).filter(Boolean);
                } else {
                  // Un solo escenario Gherkin sin encabezado explícito
                  acceptanceCriteria = gherkinFormat.map((c: string) => c.trim());
                }
              } 
              else {
                // Caso por defecto: considerar todo como un solo criterio
                acceptanceCriteria = [cleanText];
              }
            }
          // Crear descripción completa basada en el formato de historia de usuario
          const fullDescription = rol && funcionalidad ?
            `Como ${rol}, necesito ${funcionalidad}${razon ? ` con la finalidad de ${razon}` : ''}` :
            `${rol || ''} ${funcionalidad || ''} ${razon || ''}`.trim();

          // Crear nombre y descripción basados en el formato
          let requirementName = userStoryId ? `Historia ${userStoryId}` : `HU-${i}`;
          let description = fullDescription;

          // Variables para índices de columnas adicionales (inicialmente no definidas)
          const prioridadColIndex = -1; // No mapeado aún
          const complejidadColIndex = -1; // No mapeado aún
          const precondicionesColIndex = -1; // No mapeado aún
          const datosColIndex = -1; // No mapeado aún

          // Extraer prioridad y complejidad si están disponibles
          let prioridad = '';
          if (prioridadColIndex !== -1) {
            const prioridadText = row[prioridadColIndex]?.toString()?.toLowerCase() || '';
            if (prioridadText.includes('alta') || prioridadText.includes('high') || prioridadText.includes('crítica')) {
              prioridad = 'Alta';
            } else if (prioridadText.includes('media') || prioridadText.includes('medium') || prioridadText.includes('normal')) {
              prioridad = 'Media';
            } else if (prioridadText.includes('baja') || prioridadText.includes('low')) {
              prioridad = 'Baja';
            }
          }

          let complejidad = '';
          if (complejidadColIndex !== -1) {
            const complejidadText = row[complejidadColIndex]?.toString()?.toLowerCase() || '';
            if (complejidadText.includes('alta') || complejidadText.includes('high') || complejidadText.includes('complex')) {
              complejidad = 'Alta';
            } else if (complejidadText.includes('media') || complejidadText.includes('medium')) {
              complejidad = 'Media';
            } else if (complejidadText.includes('baja') || complejidadText.includes('low') || complejidadText.includes('simple')) {
              complejidad = 'Baja';
            }
          }

          // Extraer precondiciones y datos de prueba si están disponibles
          const precondiciones = precondicionesColIndex !== -1 ? row[precondicionesColIndex]?.toString() || '' : '';
          const datosPrueba = datosColIndex !== -1 ? row[datosColIndex]?.toString() || '' : '';

          const requirement: ExcelRequirementData = {
            userStoryId,
            requirementName: requirementName || `HU-${userStoryId || (i + 1)}`,
            description: fullDescription,
            acceptanceCriteria,
            functionalDescription: contexto || escenario || '',
            priority: prioridad || 'Media', // Usar prioridad extraída o default
            complexity: complejidad || 'Media', // Usar complejidad extraída o default
            preconditions: precondiciones || contexto || '',
            testData: datosPrueba || ''
          };

          console.log(`📋 Requerimiento creado:`, {
            userStoryId: requirement.userStoryId,
            requirementName: requirement.requirementName,
            description: requirement.description?.substring(0, 100) + '...',
            acceptanceCriteriaCount: requirement.acceptanceCriteria?.length || 0
          });
          
          // Solo añadimos requerimientos con información suficiente
          if ((requirement.requirementName && requirement.requirementName.trim()) ||
              (requirement.description && requirement.description.trim())) {
            requirements.push(requirement);
          }
        }

        if (requirements.length === 0) {
          toast.error('No se encontraron requerimientos válidos en el archivo.');
          setIsGeneratingAI(false);
          return;
        }

        // Verificar si se encontraron historias en formato user story o requerimientos tradicionales
        const userStoryCount = requirements.filter(req =>
          req.description &&
          (req.description.includes('Como ') || req.description.includes('Quiero ') || req.description.includes('Para '))
        ).length;

        // Mostrar feedback para que el usuario sepa qué tipo de formato se detectó
        if (userStoryCount > 0) {
          toast.info(`Se detectaron ${userStoryCount} historias de usuario en formato "Como/Quiero/Para" de la hoja "${processedSheetName}".`);
        } else {
          toast.info(`Se detectaron ${requirements.length} requerimientos en formato tradicional de la hoja "${processedSheetName}".`);
        }

        // Agregar delay para evitar rate limiting de Groq
        const initialDelay = 5000;
        const perRequirementDelay = 5000;
        const estimatedTotalTime = initialDelay + (requirements.length * perRequirementDelay);

        toast.info(`Procesando ${requirements.length} requisitos con IA. Tiempo estimado: ${Math.ceil(estimatedTotalTime/1000)} segundos.`, {
          duration: 5000,
        });

        console.log(`⏳ Esperando ${initialDelay/1000} segundos antes de llamar a la API de Groq...`);
        await new Promise(resolve => setTimeout(resolve, initialDelay));

        // Llamar al servicio de IA para generar los casos de prueba
        const aiResult = await AITestCaseGeneratorService.generateTestCasesWithAI(
          requirements,
          {
            projectId: selectedProjectId,
            testPlanId: selectedTestPlanId,
            cycleNumber: Number(cycle),
            contextualInfo: selectedTestPlanId ?
              `Estos casos de prueba se generaron desde la hoja "${processedSheetName}" del archivo Excel y forman parte del plan de pruebas con ID: ${selectedTestPlanId}. Los casos pertenecerán al ciclo ${cycle}.` :
              `Estos casos de prueba se generaron desde la hoja "${processedSheetName}" del archivo Excel. Los casos pertenecerán al ciclo ${cycle}.`
          }
        );

        if (aiResult.success && aiResult.data.length > 0) {
          console.log('✅ Respuesta exitosa de Groq:', aiResult);
          console.log('📊 Número de casos generados:', aiResult.data.length);
          console.log('📋 Primer caso de ejemplo:', aiResult.data[0]);
          console.log('📋 Todos los casos generados:', aiResult.data);

          // Convertir los datos del servicio IA al tipo esperado por el componente
          const convertedTestCases: PartialExtendedTestCase[] = aiResult.data.map(tc => ({
            ...tc,
            observations: '', // Campo adicional de ExtendedTestCase
            // Asegurar que todos los campos opcionales estén presentes
            testPlanId: tc.testPlanId || '',
            category: tc.category || '',
            responsiblePerson: tc.responsiblePerson || '',
            priority: tc.priority || 'Media' as const
          }));

          console.log('🔄 Casos convertidos:', convertedTestCases);
          console.log('🔄 Longitud de casos convertidos:', convertedTestCases.length);

          setGeneratedTestCases(convertedTestCases);

          // Guardar automáticamente los casos generados
          toast.success(`Se generaron ${aiResult.data.length} casos de prueba desde la hoja "${processedSheetName}". Guardando automáticamente...`);

          // Pasar los datos convertidos directamente en lugar de depender del estado
          console.log('🚀 EXCEL - Llamando a handleSaveGeneratedCases con datos convertidos...');
          console.log('🚀 EXCEL - Datos que se pasan:', convertedTestCases);
          console.log('🚀 EXCEL - Longitud de datos que se pasan:', convertedTestCases.length);
          await handleSaveGeneratedCases(true, convertedTestCases);
        } else {
          console.log('❌ Respuesta fallida de Groq:', aiResult);

          // Verificar si es un error de rate limiting
          if (aiResult.error && (aiResult.error.includes('Rate limit') || aiResult.error.includes('429'))) {
            toast.error(`Límite de tasa alcanzado. Se procesaron algunos requisitos. Considera esperar unos minutos antes de procesar más archivos.`, {
              duration: 8000,
            });
          } else {
            toast.error(aiResult.error || `Error al generar casos de prueba desde la hoja "${processedSheetName}".`);
          }
        }
    }
  }
  catch (error) {
    console.error('Error al procesar archivo para IA:', error);
    const sheetInfo = processedSheetName ? ` desde la hoja "${processedSheetName}"` : '';

    // Verificar si es un error de rate limiting en la excepción
    if (error instanceof Error && (error.message.includes('Rate limit') || error.message.includes('429'))) {
      toast.error(`Límite de tasa de la API alcanzado${sheetInfo}. Espera unos minutos antes de intentar nuevamente.`, {
        duration: 8000,
      });
    } else {
      toast.error(`Error al procesar el archivo${sheetInfo} para generación con IA`);
    }
  } finally {
    setIsGeneratingAI(false);
  }
};
    
    reader.readAsArrayBuffer(file);
  };
  const handleGenerateAI = async () => {
    if (!selectedFile) {
      toast.error('Selecciona un archivo Excel primero.');
      return;
    }
    
    if (!selectedProjectId || selectedProjectId === 'select_project') {
      toast.error('Selecciona un proyecto válido primero.');
      return;
    }
    
    if (!selectedTestPlanId || selectedTestPlanId === 'select_plan') {
      toast.warning('No has seleccionado un plan de prueba. Se recomienda asociar los casos a un plan.');
    }
    
    await processFileForAI(selectedFile);
  };
  
  // Método para mostrar la vista previa de casos generados
  const handlePreviewGeneratedCases = () => {
    if (generatedTestCases.length === 0) {
      toast.error('No hay casos de prueba generados para previsualizar.');
      return;
    }
    
    // Asegurarnos que todos los casos tengan la información necesaria
    const casesToPreview = generatedTestCases.map((tc: PartialExtendedTestCase) => ({
      ...tc,
      projectId: selectedProjectId,
      testPlanId: selectedTestPlanId || '',
      cycle: Number(cycle),
      updatedAt: new Date().toISOString()
    }));
    
    setGeneratedTestCases(casesToPreview);
    setIsAIDialogOpen(false);
    setIsPreviewDialogOpen(true);
  };

  const handleSaveGeneratedCases = async (autoSave: boolean = false, testCasesData?: PartialExtendedTestCase[]) => {
    console.log('🎯 handleSaveGeneratedCases llamada con parámetros:');
    console.log('🎯 autoSave:', autoSave);
    console.log('🎯 testCasesData recibido:', testCasesData);
    console.log('🎯 testCasesData length:', testCasesData?.length || 0);
    console.log('🎯 Estado generatedTestCases actual:', generatedTestCases);
    console.log('🎯 Estado generatedTestCases length:', generatedTestCases?.length || 0);

    // Usar los datos proporcionados o los del estado
    let casesToSave = testCasesData || generatedTestCases;

    // Si se proporcionaron datos directamente, usarlos sin esperar
    if (testCasesData && testCasesData.length > 0) {
      casesToSave = testCasesData;
      console.log('✅ Usando datos proporcionados directamente:', casesToSave.length);
    }
    // Si no hay datos proporcionados Y el estado está vacío, intentar esperar un poco más
    else if (!testCasesData && casesToSave.length === 0) {
      console.log('⏳ Esperando a que el estado se actualice...');
      // Esperar más tiempo para permitir que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 500));
      casesToSave = generatedTestCases;
      console.log('⏳ Estado después del delay extendido:', casesToSave);
    }

    console.log('� Intentando guardar casos de prueba...');
    console.log('📊 Casos a guardar:', casesToSave.length);
    console.log('📋 Datos de casos:', casesToSave);

    if (casesToSave.length === 0) {
      console.log('❌ No hay casos para guardar');
      toast.error('No hay casos de prueba generados para guardar.');
      return;
    }

    if (!selectedProjectId) {
      toast.error('Selecciona un proyecto para guardar los casos.');
      return;
    }
    
    // Verificar si se ha seleccionado un plan de prueba
    if (!selectedTestPlanId) {
      toast.warning('No has seleccionado un plan de prueba. Los casos se guardarán sin asociarse a un plan específico.');
    }
    
    setIsLoading(true);
    
    try {
      let created = 0;
      let errors = 0;

      // Asegurarnos que todos los casos tengan los datos necesarios
      const processedCasesToSave = casesToSave.map((tc: PartialExtendedTestCase) => ({
        ...tc,
        projectId: selectedProjectId,
        testPlanId: selectedTestPlanId || '',
        cycle: Number(cycle),
        updatedAt: new Date().toISOString()
      }));

      // Si es guardado automático o pocos casos, guardar directamente
      // Si es guardado manual y hay muchos casos, mostrar vista previa
      if (autoSave || processedCasesToSave.length <= 5 || isPreviewDialogOpen) {
        console.log('💾 Guardando casos directamente...');
        // Guardado directo
        for (const testCase of processedCasesToSave) {
          try {
            console.log('📝 Guardando caso:', testCase.name || 'Sin nombre');
            await createTestCase(testCase);
            created++;
            console.log('✅ Caso guardado exitosamente');
          } catch (error) {
            console.error('❌ Error al guardar caso de prueba:', error);
            errors++;
          }
        }
        
        console.log(`📊 Resultado del guardado - Creados: ${created}, Errores: ${errors}`);
        toast.success(`Guardado completado. ${created} casos creados. ${errors} errores.`);
        setIsAIDialogOpen(false);
        setIsPreviewDialogOpen(false);
        
        // Si hay una función de refresh, la llamamos para actualizar la vista
        if (onRefresh) {
          console.log('🔄 Llamando a onRefresh para actualizar la tabla...');
          onRefresh();
        }
        
        // También intentar refrescar directamente si hay un refreshData disponible
        // Esto es una medida adicional por si SWR no está revalidando correctamente
        setTimeout(() => {
          if (onRefresh) {
            console.log('🔄 Refresh adicional después de timeout...');
            onRefresh();
          }
        }, 1000);
      } else {
        // Abrir vista previa para confirmación manual
        setGeneratedTestCases(processedCasesToSave);
        setIsAIDialogOpen(false);
        setIsPreviewDialogOpen(true);
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error al guardar los casos generados:', error);
      toast.error('Error al guardar los casos generados');
    } finally {
      setIsLoading(false);
    }
  };  const handleDownloadTemplate = () => {
    try {
      // Crear datos para la plantilla
      const templateData = [
        ['PLANTILLA DE HISTORIAS DE USUARIO PARA GENERACIÓN DE CASOS DE PRUEBA CON IA', '', '', '', '', '', '', '', '', ''],
        [''],
        ['INSTRUCCIONES:', 'Complete las columnas según el formato de historia de usuario "Como [rol] Quiero [funcionalidad] Para [razón]"', '', '', '', '', '', '', '', ''],
        ['También puede agregar una descripción adicional y detallar los criterios de aceptación, precondiciones y datos de prueba para mejorar la generación de casos', '', '', '', '', '', '', '', '', ''],
        [''],
        ['ID', 'Rol', 'Funcionalidad', 'Razón/Resultado', 'Criterios de Aceptación', 'Descripción Adicional', 'Prioridad', 'Complejidad', 'Precondiciones', 'Datos de Prueba'],
        ['HU-001', 'Como administrador del sistema', 'Quiero poder gestionar usuarios', 'Para controlar quién tiene acceso al sistema', '1. Poder ver lista de usuarios\n2. Poder crear nuevos usuarios\n3. Poder editar usuarios existentes\n4. Poder desactivar usuarios', 'El sistema debe permitir la gestión completa del ciclo de vida de usuarios, incluyendo la asignación de roles y permisos.', 'Alta', 'Media', 'Usuario con rol de administrador ya autenticado en el sistema', 'Usuario1 (admin), Usuario2 (normal), Usuario3 (bloqueado)'],
        ['HU-002', 'Como usuario registrado', 'Quiero poder restablecer mi contraseña', 'Para recuperar el acceso a mi cuenta cuando olvido mi contraseña', '1. Recibir email con enlace para restablecer contraseña\n2. Enlace debe expirar después de 24 horas\n3. Poder crear una nueva contraseña que cumpla los requisitos de seguridad', 'El proceso debe ser seguro y confirmar al usuario cuando se ha cambiado la contraseña correctamente.', 'Media', 'Baja', 'Usuario registrado con email verificado', 'Email: usuario@example.com, Contraseña válida: Abc123!45'],
        ['HU-003', 'Como analista de calidad', 'Quiero poder generar reportes de test', 'Para evaluar la cobertura y resultado de las pruebas', '1. Filtrar reportes por fecha\n2. Filtrar reportes por proyecto\n3. Exportar reportes en formato Excel\n4. Visualizar gráficos de resultados', 'Los reportes deben incluir métricas de éxito, cobertura y defectos encontrados durante las pruebas.', 'Alta', 'Alta', 'Existen datos de pruebas en el sistema para al menos un proyecto', 'Proyecto: Sistema de Pagos, Fecha: 01/01/2025 al 30/05/2025'],
        ['HU-004', 'Como usuario del sistema', 'Quiero poder personalizar mi perfil', 'Para ajustar la configuración según mis preferencias', 'Dado que soy un usuario registrado\nCuando accedo a la sección de perfil\nEntonces puedo modificar mi información personal\nY puedo cambiar la configuración de notificaciones\nY puedo seleccionar un tema visual', 'La función debe guardar automáticamente los cambios y aplicarlos inmediatamente.', 'Baja', 'Media', 'Usuario con sesión iniciada', 'Temas disponibles: claro, oscuro, azul; Configuración de notificaciones: email, push, ninguna'],
      ];
      
      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      
      // Estilizar algunas celdas
      if (!ws['!merges']) ws['!merges'] = [];
        // Merge para el título principal y las instrucciones
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
      ws['!merges'].push({ s: { r: 2, c: 1 }, e: { r: 2, c: 9 } });
      ws['!merges'].push({ s: { r: 3, c: 0 }, e: { r: 3, c: 9 } });
        // Configurar anchos de columna para mejor legibilidad
      ws['!cols'] = [
        { width: 10 }, // ID
        { width: 25 }, // Rol
        { width: 30 }, // Funcionalidad
        { width: 30 }, // Razón
        { width: 40 }, // Criterios
        { width: 40 }, // Descripción
        { width: 10 }, // Prioridad
        { width: 10 }, // Complejidad
        { width: 30 }, // Precondiciones
        { width: 30 }  // Datos de Prueba
      ];
      
      // Crear libro
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Historias de Usuario');
      
      // Generar archivo Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      // Guardar archivo
      saveAs(data, 'plantilla_historias_usuario.xlsx');
      
      toast.success('Plantilla de historias de usuario descargada con éxito');
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      toast.error('Error al descargar la plantilla');
    }
  };

  const handleDownloadHUTemplate = () => {
    try {
      // Crear datos para la plantilla de historias de usuario
      const templateData = [
        ['PLANTILLA DE HISTORIAS DE USUARIO PARA GENERACIÓN DE CASOS DE PRUEBA CON IA', '', '', '', '', '', '', '', '', ''],
        [''],
        ['IMPORTANTE: Esta hoja debe llamarse "HU" o contener "Historias" en el nombre', '', '', '', '', '', '', '', '', ''],
        ['INSTRUCCIONES:', 'Complete las columnas según el formato de historia de usuario "Como [rol] Quiero [funcionalidad] Para [razón]"', '', '', '', '', '', '', '', ''],
        ['También puede agregar criterios de aceptación detallados para mejorar la generación de casos de prueba', '', '', '', '', '', '', '', '', ''],
        [''],
        ['ID', 'Como (Rol)', 'Quiero (Funcionalidad)', 'Para (Razón/Beneficio)', 'Descripción Detallada', 'Criterios de Aceptación', 'Prioridad', 'Complejidad', 'Precondiciones', 'Datos de Prueba'],
        ['HU-001', 'Como administrador del sistema', 'Quiero poder gestionar usuarios', 'Para controlar quién tiene acceso al sistema', 'El sistema debe permitir la gestión completa del ciclo de vida de usuarios, incluyendo la asignación de roles y permisos.', '1. Poder ver lista de usuarios\n2. Poder crear nuevos usuarios\n3. Poder editar usuarios existentes\n4. Poder desactivar usuarios', 'Alta', 'Media', 'Usuario con rol de administrador ya autenticado', 'Usuario1 (admin), Usuario2 (normal), Usuario3 (bloqueado)'],
        ['HU-002', 'Como usuario registrado', 'Quiero poder restablecer mi contraseña', 'Para recuperar el acceso a mi cuenta', 'El proceso debe ser seguro y confirmar al usuario cuando se ha cambiado la contraseña correctamente.', '1. Recibir email con enlace para restablecer\n2. Enlace debe expirar después de 24 horas\n3. Poder crear nueva contraseña que cumpla requisitos', 'Media', 'Baja', 'Usuario registrado con email verificado', 'Email: usuario@example.com'],
        ['HU-003', 'Como analista de calidad', 'Quiero poder generar reportes', 'Para evaluar la cobertura de pruebas', 'Los reportes deben incluir métricas de éxito, cobertura y defectos encontrados durante las pruebas.', '1. Filtrar reportes por fecha\n2. Filtrar reportes por proyecto\n3. Exportar en formato Excel\n4. Visualizar gráficos de resultados', 'Alta', 'Alta', 'Datos de pruebas existentes en el sistema', 'Proyecto: Sistema de Pagos, Fechas: 01/01/2025-30/05/2025'],
        ['HU-004', 'Como usuario del sistema', 'Quiero personalizar mi perfil', 'Para ajustar configuración según mis preferencias', 'La función debe guardar automáticamente los cambios y aplicarlos inmediatamente.', '1. Modificar información personal\n2. Cambiar configuración de notificaciones\n3. Seleccionar tema visual\n4. Guardar cambios automáticamente', 'Baja', 'Media', 'Usuario con sesión iniciada', 'Temas: claro, oscuro, azul'],
        [''],
        ['NOTAS IMPORTANTES:', '', '', '', '', '', '', '', '', ''],
        ['1. La primera columna debe contener IDs únicos (HU-001, HU-002, etc.)', '', '', '', '', '', '', '', '', ''],
        ['2. Las columnas "Como", "Quiero" y "Para" son obligatorias para el formato de historia de usuario', '', '', '', '', '', '', '', '', ''],
        ['3. Los criterios de aceptación pueden estar en una sola celda separados por saltos de línea', '', '', '', '', '', '', '', '', ''],
        ['4. La prioridad y complejidad ayudan a la IA a generar casos más apropiados', '', '', '', '', '', '', '', '', ''],
        ['5. Guarde esta hoja con el nombre "HU" en su archivo Excel', '', '', '', '', '', '', '', '', '']
      ];

      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(templateData);

      // Estilizar algunas celdas
      if (!ws['!merges']) ws['!merges'] = [];
      // Merge para el título principal
      ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } });
      ws['!merges'].push({ s: { r: 2, c: 0 }, e: { r: 2, c: 9 } });
      ws['!merges'].push({ s: { r: 3, c: 1 }, e: { r: 3, c: 9 } });
      ws['!merges'].push({ s: { r: 4, c: 0 }, e: { r: 4, c: 9 } });

      // Configurar anchos de columna
      ws['!cols'] = [
        { width: 12 }, // ID
        { width: 30 }, // Como (Rol)
        { width: 35 }, // Quiero (Funcionalidad)
        { width: 35 }, // Para (Razón)
        { width: 40 }, // Descripción
        { width: 50 }, // Criterios
        { width: 10 }, // Prioridad
        { width: 12 }, // Complejidad
        { width: 35 }, // Precondiciones
        { width: 30 }  // Datos de Prueba
      ];

      // Crear libro de trabajo con la hoja "HU"
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'HU');

      // Guardar archivo
      saveAs(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' }), 'plantilla_historias_usuario.xlsx');

      toast.success('Plantilla de historias de usuario descargada correctamente');
    } catch (error) {
      console.error('Error al descargar plantilla HU:', error);
      toast.error('Error al descargar la plantilla de historias de usuario');
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
  const mapTestType = (type: string = ''): BaseTestCase['testType'] => {
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
  const mapStatus = (status: string = ''): BaseTestCase['status'] => {
    const lowerStatus = status.toLowerCase();

    if (lowerStatus.includes('exit')) return 'Exitoso';
    if (lowerStatus.includes('fall')) return 'Fallido';
    if (lowerStatus.includes('bloq')) return 'Bloqueado';
    if (lowerStatus.includes('progres')) return 'En progreso';

    return 'No ejecutado'; // Valor por defecto
  }

  // ============ NUEVAS FUNCIONES PARA LA INTERFAZ AITestCaseGenerator ============

  /**
   * Generar casos de prueba desde una historia de usuario específica
   */
  const handleGenerateFromUserStory = async (userStory: string) => {
    if (!userStory.trim()) {
      toast.error('Por favor ingresa una historia de usuario');
      return;
    }

    if (!selectedProjectId) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const service = new AITestCaseGeneratorService();
      const testCases = await service.generateFromUserStory(userStory, {
        projectId: selectedProjectId,
        testPlanId: selectedTestPlanId,
        cycleNumber: cycle,
        contextualInfo: `Proyecto: ${projects.find(p => p.id === selectedProjectId)?.proyecto || 'Proyecto sin nombre'}`
      });

      // NO actualizar el estado primero - guardar directamente
      // setGeneratedTestCases(testCases as PartialExtendedTestCase[]);

      // Guardar automáticamente los casos generados - PASAR LOS DATOS DIRECTAMENTE
      if (testCases.length > 0) {
        console.log('🔥 GENERANDO DESDE HISTORIA DE USUARIO - Guardando automáticamente...');
        toast.success(`Generados ${testCases.length} casos de prueba. Guardando automáticamente...`);
        await handleSaveGeneratedCases(true, testCases as PartialExtendedTestCase[]);
      } else {
        toast.success(`Generados ${testCases.length} casos de prueba desde la historia de usuario`);
      }
    } catch (error) {
      console.error('Error generando casos desde historia de usuario:', error);
      toast.error('Error generando casos de prueba');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  /**
   * Generar casos de prueba desde múltiples requisitos
   */
  const handleGenerateFromRequirements = async (requirements: string[]) => {
    if (!requirements.length || requirements.every(req => !req.trim())) {
      toast.error('Por favor ingresa al menos un requisito');
      return;
    }

    if (!selectedProjectId) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const service = new AITestCaseGeneratorService();
      const testCases = await service.generateFromRequirements(requirements, {
        projectId: selectedProjectId,
        testPlanId: selectedTestPlanId,
        cycleNumber: cycle,
        contextualInfo: `Proyecto: ${projects.find(p => p.id === selectedProjectId)?.proyecto || 'Proyecto sin nombre'}`
      });

      // NO actualizar el estado primero - guardar directamente
      // setGeneratedTestCases(testCases as PartialExtendedTestCase[]);

      // Guardar automáticamente los casos generados - PASAR LOS DATOS DIRECTAMENTE
      if (testCases.length > 0) {
        console.log('🔥 GENERANDO DESDE REQUISITOS - Guardando automáticamente...');
        toast.success(`Generados ${testCases.length} casos de prueba. Guardando automáticamente...`);
        await handleSaveGeneratedCases(true, testCases as PartialExtendedTestCase[]);
      } else {
        toast.success(`Generados ${testCases.length} casos de prueba desde los requisitos`);
      }
    } catch (error) {
      console.error('Error generando casos desde requisitos:', error);
      toast.error('Error generando casos de prueba');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  /**
   * Sugerir escenarios de prueba para el proyecto
   */
  const handleSuggestScenarios = async () => {
    if (!selectedProjectId) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) {
      toast.error('Proyecto no encontrado');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const service = new AITestCaseGeneratorService();
      const scenarios = await service.suggestTestScenarios(project as any, {
        contextualInfo: `Proyecto con ${testCases.length} casos de prueba existentes`
      });

      setSuggestedScenarios(scenarios);
      setIsScenariosDialogOpen(true);
      toast.success(`Generadas ${scenarios.length} sugerencias de escenarios`);

    } catch (error) {
      console.error('Error generando sugerencias de escenarios:', error);
      toast.error('Error generando sugerencias de escenarios');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  /**
   * Analizar cobertura de pruebas del proyecto
   */
  const handleAnalyzeCoverage = async () => {
    if (!selectedProjectId) {
      toast.error('Selecciona un proyecto primero');
      return;
    }

    setIsGeneratingAI(true);
    try {
      const service = new AITestCaseGeneratorService();
      const report = await service.analyzeTestCoverage(selectedProjectId, testCases as BaseTestCase[]);

      setCoverageReport(report);
      setIsCoverageDialogOpen(true);
      toast.success('Análisis de cobertura completado');

    } catch (error) {
      console.error('Error analizando cobertura:', error);
      toast.error('Error analizando cobertura de pruebas');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const renderContent = (): JSX.Element => {
    console.log('renderContent called with initialMode:', initialMode);
    console.log('projects length:', projects?.length || 0);

    return (
      <div>
        {/* Mostrar botones de IA cuando esté en modo AI */}
        {initialMode === 'ai' && (
          <div className="space-y-4">
            {/* Selector de proyecto y plan de pruebas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="aiProject">Proyecto</Label>
                <Select
                  value={selectedProjectId}
                  onValueChange={(value) => {
                    setSelectedProjectId(value);
                    setSelectedTestPlanId(''); // Limpiar plan seleccionado
                  }}
                >
                  <SelectTrigger id="aiProject">
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select_project">Seleccionar proyecto</SelectItem>
                    {projects && projects.length > 0 ? (
                      projects.map((project) => (
                        <SelectItem key={project.id || project.idJira || 'unknown'} value={project.idJira || project.id || 'unknown'}>
                          {project.proyecto} {project.idJira && `(${project.idJira})`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no_projects" disabled>
                        No hay proyectos disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aiTestPlan">Plan de Prueba</Label>
                <div className="relative">
                  <Input
                    id="testPlanSearch"
                    placeholder="Buscar plan de prueba..."
                    value={testPlanSearchTerm}
                    onChange={(e) => setTestPlanSearchTerm(e.target.value)}
                    className="pr-8"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                <Select
                  value={selectedTestPlanId}
                  onValueChange={setSelectedTestPlanId}
                  disabled={!selectedProjectId || isLoadingPlans}
                >
                  <SelectTrigger id="aiTestPlan">
                    <SelectValue placeholder={isLoadingPlans ? "Cargando..." : "Seleccionar plan"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select_plan">Seleccionar plan de prueba</SelectItem>
                    {(() => {
                      const filteredPlans = testPlans && testPlans.length > 0 ? 
                        testPlans.filter((plan) => {
                          // Solo filtrar por término de búsqueda (el filtrado por proyecto ya se hace en el hook)
                          const searchMatch = !testPlanSearchTerm ||
                            plan.codeReference?.toLowerCase().includes(testPlanSearchTerm.toLowerCase()) ||
                            plan.id?.toLowerCase().includes(testPlanSearchTerm.toLowerCase());
                          
                          return searchMatch;
                        }) : [];
                      
                      console.log('Planes totales para proyecto:', testPlans?.length || 0);
                      console.log('Planes filtrados por búsqueda:', filteredPlans.length);
                      console.log('Proyecto seleccionado:', selectedProjectId);
                      
                      return filteredPlans.length > 0 ? (
                        filteredPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.codeReference || `Plan ${plan.id.substring(0, 8)}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_plans" disabled>
                          {isLoadingPlans ? "Cargando planes..." : `No hay planes disponibles para el proyecto seleccionado`}
                        </SelectItem>
                      );
                    })()}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Botones de funcionalidades de IA */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setIsUserStoryDialogOpen(true)}
                className="flex items-center gap-2"
                disabled={!selectedProjectId}
              >
                <FileText size={16} /> Desde Historia Usuario
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsRequirementsDialogOpen(true)}
                className="flex items-center gap-2"
                disabled={!selectedProjectId}
              >
                <Target size={16} /> Desde Requisitos
              </Button>

              <Button
                variant="outline"
                onClick={handleSuggestScenarios}
                className="flex items-center gap-2"
                disabled={!selectedProjectId || isGeneratingAI}
              >
                <BarChart3 size={16} />
                {isGeneratingAI ? 'Generando...' : 'Sugerir Escenarios'}
              </Button>

              <Button
                variant="outline"
                onClick={handleAnalyzeCoverage}
                className="flex items-center gap-2"
                disabled={!selectedProjectId || isGeneratingAI}
              >
                <BarChart3 size={16} />
                {isGeneratingAI ? 'Analizando...' : 'Analizar Cobertura'}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setUseAI(true);
                  setIsImportDialogOpen(true);
                }}
                className="flex items-center gap-2"
                disabled={!selectedProjectId}
              >
                <FileUp size={16} /> Desde Excel
              </Button>
            </div>
          </div>
        )}

        {/* Solo mostrar los botones si no se especificó un modo inicial */}
        {!initialMode && (
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
            
            <Button
              variant="outline"
              onClick={() => {
                setUseAI(true);
                setIsImportDialogOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Sparkles size={16} /> Generar casos con IA
            </Button>

            {/* Nuevos botones para funcionalidades específicas */}
            <Button
              variant="outline"
              onClick={() => setIsUserStoryDialogOpen(true)}
              className="flex items-center gap-2"
              disabled={!selectedProjectId}
            >
              <FileText size={16} /> Desde Historia Usuario
            </Button>

            <Button
              variant="outline"
              onClick={() => setIsRequirementsDialogOpen(true)}
              className="flex items-center gap-2"
              disabled={!selectedProjectId}
            >
              <Target size={16} /> Desde Requisitos
            </Button>

            <Button
              variant="outline"
              onClick={handleSuggestScenarios}
              className="flex items-center gap-2"
              disabled={!selectedProjectId || isGeneratingAI}
            >
              <BarChart3 size={16} />
              {isGeneratingAI ? 'Generando...' : 'Sugerir Escenarios'}
            </Button>

            <Button
              variant="outline"
              onClick={handleAnalyzeCoverage}
              className="flex items-center gap-2"
              disabled={!selectedProjectId || isGeneratingAI}
            >
              <BarChart3 size={16} />
              {isGeneratingAI ? 'Analizando...' : 'Analizar Cobertura'}
            </Button>
          </div>
        )}

        {isImportDialogOpen && (
          <Dialog 
            open={true}
            onOpenChange={setIsImportDialogOpen}
          >
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>
                  {useAI ? 'Generar Casos de Prueba con IA' : 'Importar Casos de Prueba desde Excel'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="importProject">Proyecto</Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                    disabled={!!projectId}
                  >                    <SelectTrigger id="importProject">
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select_project">Seleccionar proyecto</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id || project.idJira} value={project.idJira}>
                          {project.proyecto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="importTestPlan">Plan de Prueba</Label>
                <Select
                    value={selectedTestPlanId}
                    onValueChange={setSelectedTestPlanId}
                    disabled={!selectedProjectId || selectedProjectId === 'select_project' || isLoadingPlans}
                  >
                    <SelectTrigger id="importTestPlan">
                      <SelectValue placeholder={isLoadingPlans ? "Cargando planes..." : "Seleccionar plan de prueba"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select_plan">Seleccionar plan de prueba</SelectItem>
                      {testPlans && testPlans.length > 0 ? (
                        testPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.codeReference || `Plan ${plan.id.substring(0, 6)}`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no_plans" disabled>
                          No hay planes disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {/* Componente de depuración */}
                  {isLoadingPlans ? (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      Cargando planes de prueba...
                    </div>
                  ) : isErrorPlans ? (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm">
                      Error al cargar planes: {isErrorPlans.toString()}
                    </div>
                  ) : testPlans && testPlans.length === 0 && selectedProjectId && selectedProjectId !== 'select_project' ? (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      No hay planes de prueba para este proyecto. 
                      <br />
                      ProjectID: {selectedProjectId}
                    </div>
                  ) : null}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="importCycle">Ciclo</Label>
                  <Select
                    value={cycle.toString()}
                    onValueChange={(value) => setCycle(Number(value))}
                  >
                    <SelectTrigger id="importCycle">
                      <SelectValue placeholder="Seleccionar ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Ciclo 1</SelectItem>
                      <SelectItem value="2">Ciclo 2</SelectItem>
                      <SelectItem value="3">Ciclo 3</SelectItem>
                    </SelectContent>
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
                        </p>                        <p className="text-xs text-gray-500 mb-4">                          {useAI 
                            ? 'El archivo debe contener historias de usuario (Como/Quiero/Para) o requerimientos tradicionales para generar casos de prueba con IA'
                            : 'El archivo debe seguir el formato estándar de casos de prueba'}
                        </p>                          <Input
                          id="fileUpload"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                          disabled={isLoading || !selectedProjectId}
                          className="hidden"
                        />                        <div className="space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleDownloadHUTemplate}
                            disabled={isLoading}
                            className="mb-2"
                          >
                            <FileText className="h-4 w-4 mr-2" /> Descargar Plantilla Historias Usuario
                          </Button>
                          {/* Usando un Button que abra el input de archivo mediante JavaScript */}
                          <Button
                            type="button" 
                            variant="outline"
                            disabled={isLoading || !selectedProjectId}
                            className="cursor-pointer"
                            onClick={() => {
                              // Usar JavaScript para disparar el evento click en el input
                              const fileInput = document.getElementById('fileUpload') as HTMLInputElement;
                              if (fileInput) {
                                fileInput.click();
                              }
                            }}
                          >
                            <FileUp className="h-4 w-4 mr-2" /> Seleccionar archivo
                          </Button>
                            {/* Mostrar el nombre del archivo si se ha seleccionado */}
                          {selectedFile && (
                            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-blue-500" />
                              <span className="text-blue-700">{selectedFileName}</span>
                            </div>
                          )}
                          
                          {useAI && selectedFile && (
                            <Button
                              type="button"
                              onClick={handleGenerateAI}
                              disabled={isGeneratingAI || !selectedFile || !selectedProjectId}
                              className="ml-2 mt-2"
                            >
                              {isGeneratingAI ? 'Generando...' : 'Generar casos con IA'}
                              {!isGeneratingAI && <Sparkles className="h-4 w-4 ml-2" />}
                            </Button>
                          )}
                        </div>
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
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                {!useAI && (                  <Button
                    onClick={async () => {
                      if (!selectedFile) {
                        toast.error('Seleccione un archivo primero');
                        return;
                      }
                      if (!selectedProjectId || selectedProjectId === 'select_project') {
                        toast.error('Seleccione un proyecto primero');
                        return;
                      }
                      await processFileForImport(selectedFile);
                    }}
                    disabled={isLoading || !selectedFile || !selectedProjectId || selectedProjectId === 'select_project'}
                  >
                    {isLoading ? 'Importando...' : 'Importar'}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

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
                    value={selectedProjectId}
                    onValueChange={setSelectedProjectId}
                  >                    <SelectTrigger id="exportProject">
                      <SelectValue placeholder="Seleccionar proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="select_project">Seleccionar proyecto</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id || project.idJira} value={project.idJira}>
                          {project.proyecto}
                        </SelectItem>
                      ))}
                    </SelectContent>
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

        {/* Diálogo para generación de casos con IA */}
        <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Casos de Prueba Generados por IA</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Se han generado {generatedTestCases.length} casos de prueba basados en los requerimientos del archivo.
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleDownloadGeneratedCases}
                    className="flex-1"
                  >
                    <FileDown className="h-4 w-4 mr-2" /> Descargar Casos
                  </Button>
                  
                  <Button
                    onClick={() => {
                      // Verificar que haya un plan de prueba seleccionado
                      if (!selectedTestPlanId) {
                        toast.warning('No se ha seleccionado un plan de prueba. Se recomienda asociar los casos a un plan específico.');
                      }
                      
                      // Actualizar los casos con plan de prueba e información adicional
                      const updatedCases = generatedTestCases.map(tc => ({
                        ...tc,
                        projectId: selectedProjectId,
                        testPlanId: selectedTestPlanId || '',
                        cycle: Number(cycle)
                      }));
                      
                      setGeneratedTestCases(updatedCases);
                      handleSaveGeneratedCases(false);
                    }}
                    className="flex-1"
                  >
                    Guardar Casos en Proyecto
                  </Button>
                </div>
                
                <Button 
                  variant="secondary"
                  onClick={() => {
                    // Asegurar que los casos tengan la información necesaria
                    const casesToPreview = generatedTestCases.map(tc => ({
                      ...tc,
                      projectId: selectedProjectId,
                      testPlanId: selectedTestPlanId || '',
                      cycle: Number(cycle)
                    }));
                    
                    setGeneratedTestCases(casesToPreview);
                    setIsAIDialogOpen(false);
                    setIsPreviewDialogOpen(true);
                  }}
                >
                  <Edit2 className="h-4 w-4 mr-2" /> Ver y Editar Casos Generados
                </Button>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAIDialogOpen(false)}
                disabled={isLoading}
              >
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>        {/* Diálogo para vista previa de casos generados con IA */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vista Previa de Casos de Prueba Generados</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                A continuación se muestran los casos de prueba que serán creados en el proyecto.
              </p>
              
              <Accordion type="single" collapsible>
                {generatedTestCases.map((testCase, index) => (
                  <AccordionItem key={testCase.id} value={`testcase-${testCase.id}`} className="border rounded-md mb-2">
                    <AccordionTrigger className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-semibold">{testCase.name}</span>
                        <span className="text-xs text-gray-500">{testCase.codeRef}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTestCaseIndex(index);
                            setEditingTestCase({...testCase});
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            
                            // Eliminar el caso generado de la lista
                            const updatedCases = generatedTestCases.filter((_, i) => i !== index);
                            setGeneratedTestCases(updatedCases);
                            
                            toast.success('Caso de prueba eliminado de la lista');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-semibold">HU</Label>
                          <p>{testCase.userStoryId}</p>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">ID</Label>
                          <p>{testCase.codeRef}</p>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Nombre</Label>
                          <p>{testCase.name}</p>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Estado</Label>
                          <p>{testCase.status}</p>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Tipo de Prueba</Label>
                          <p>{testCase.testType}</p>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Ciclo</Label>
                          <p>{testCase.cycle}</p>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Prioridad</Label>
                          <p>{testCase.priority}</p>
                        </div>
                        
                        <div>
                          <Label className="font-semibold">Categoría</Label>
                          <p>{testCase.category}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <Label className="font-semibold">Pasos</Label>
                        <Textarea
                          value={testCase.steps?.map(step => step.description).join('\n')}
                          readOnly
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <Label className="font-semibold">Resultado Esperado</Label>
                        <Textarea
                          value={testCase.expectedResult}
                          readOnly
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <Label className="font-semibold">Observaciones</Label>
                        <Textarea
                          value={testCase.observations}
                          onChange={(e) => {
                            const updatedCases = [...generatedTestCases];
                            updatedCases[index].observations = e.target.value;
                            setGeneratedTestCases(updatedCases);
                          }}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPreviewDialogOpen(false)}
                disabled={isLoading}
              >
                Cerrar
              </Button>
              <Button
                onClick={async () => {
                  setIsLoading(true);
                  try {
                    let created = 0;
                    let errors = 0;
                    
                    for (const testCase of generatedTestCases) {
                      try {
                        await createTestCase(testCase);
                        created++;
                      } catch (error) {
                        console.error('Error al guardar caso de prueba:', error);
                        errors++;
                      }
                    }
                    
                    toast.success(`Guardado completado. ${created} casos creados. ${errors} errores.`);
                    setIsPreviewDialogOpen(false);
                    if (onRefresh) {
                      onRefresh();
                    }
                  } catch (error) {
                    console.error('Error al guardar los casos:', error);
                    toast.error('Error al guardar los casos');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading || generatedTestCases.length === 0}
              >
                {isLoading ? 'Guardando...' : 'Guardar Todos los Casos'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>        {/* Diálogo para edición de caso individual */}
        {isEditDialogOpen && editingTestCase && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Caso de Prueba</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="editName">Nombre</Label>
                    <Input
                      id="editName"
                      value={editingTestCase.name || ''}
                      onChange={(e) => setEditingTestCase({...editingTestCase, name: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editRef">ID de Referencia</Label>
                    <Input
                      id="editRef"
                      value={editingTestCase.codeRef || ''}
                      onChange={(e) => setEditingTestCase({...editingTestCase, codeRef: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editHU">Historia de Usuario</Label>
                    <Input
                      id="editHU"
                      value={editingTestCase.userStoryId || ''}
                      onChange={(e) => setEditingTestCase({...editingTestCase, userStoryId: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="editType">Tipo de Prueba</Label>
                    <Select
                      value={editingTestCase.testType || 'Funcional'}
                      onValueChange={(value) => setEditingTestCase({...editingTestCase, testType: value as BaseTestCase['testType']})}
                    >
                      <SelectTrigger id="editType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Funcional">Funcional</SelectItem>
                        <SelectItem value="No Funcional">No Funcional</SelectItem>
                        <SelectItem value="Regresión">Regresión</SelectItem>
                        <SelectItem value="Exploratoria">Exploratoria</SelectItem>
                        <SelectItem value="Integración">Integración</SelectItem>
                        <SelectItem value="Rendimiento">Rendimiento</SelectItem>
                        <SelectItem value="Seguridad">Seguridad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editSteps">Pasos</Label>
                  <Textarea
                    id="editSteps"
                    value={editingTestCase.steps?.map(step => step.description).join('\n') || ''}
                    onChange={(e) => {
                      const stepsText = e.target.value;
                      const stepsArray = stepsText.split('\n').filter(Boolean);
                      const steps = stepsArray.map(step => ({
                        id: uuidv4(),
                        description: step,
                        expected: ''
                      }));
                      setEditingTestCase({...editingTestCase, steps});
                    }}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editResult">Resultado Esperado</Label>
                  <Textarea
                    id="editResult"
                    value={editingTestCase.expectedResult || ''}
                    onChange={(e) => setEditingTestCase({...editingTestCase, expectedResult: e.target.value})}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editObservations">Observaciones</Label>
                  <Textarea
                    id="editObservations"
                    value={editingTestCase.observations || ''}
                    onChange={(e) => setEditingTestCase({...editingTestCase, observations: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    if (editingTestCaseIndex !== null) {
                      const updatedCases = [...generatedTestCases];
                      updatedCases[editingTestCaseIndex] = editingTestCase;
                      setGeneratedTestCases(updatedCases);
                    }
                    setIsEditDialogOpen(false);
                    toast.success('Caso de prueba actualizado');
                  }}
                >
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Nuevo diálogo: Generar desde Historia de Usuario */}
        {isUserStoryDialogOpen && (
          <Dialog open={isUserStoryDialogOpen} onOpenChange={setIsUserStoryDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generar Casos desde Historia de Usuario
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="userStory">Historia de Usuario</Label>
                  <Textarea
                    id="userStory"
                    value={userStoryInput}
                    onChange={(e) => setUserStoryInput(e.target.value)}
                    placeholder="Como [usuario], quiero [funcionalidad] para [beneficio]..."
                    rows={4}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Ejemplo:</strong> Como administrador del sistema, quiero poder gestionar usuarios para controlar quién tiene acceso al sistema.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUserStoryDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleGenerateFromUserStory(userStoryInput);
                    setIsUserStoryDialogOpen(false);
                  }}
                  disabled={isGeneratingAI || !userStoryInput.trim()}
                >
                  {isGeneratingAI ? 'Generando...' : 'Generar Casos'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Nuevo diálogo: Generar desde Requisitos */}
        {isRequirementsDialogOpen && (
          <Dialog open={isRequirementsDialogOpen} onOpenChange={setIsRequirementsDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Generar Casos desde Requisitos
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="requirements">Requisitos (uno por línea)</Label>
                  <Textarea
                    id="requirements"
                    value={requirementsInput}
                    onChange={(e) => setRequirementsInput(e.target.value)}
                    placeholder="El sistema debe permitir login
El sistema debe validar contraseñas
El sistema debe mostrar dashboard..."
                    rows={6}
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <p><strong>Consejo:</strong> Escribe cada requisito en una línea separada para mejores resultados.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRequirementsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    const requirements = requirementsInput
                      .split('\n')
                      .map(req => req.trim())
                      .filter(req => req.length > 0);
                    handleGenerateFromRequirements(requirements);
                    setIsRequirementsDialogOpen(false);
                  }}
                  disabled={isGeneratingAI || !requirementsInput.trim()}
                >
                  {isGeneratingAI ? 'Generando...' : 'Generar Casos'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Nuevo diálogo: Escenarios Sugeridos */}
        {isScenariosDialogOpen && (
          <Dialog open={isScenariosDialogOpen} onOpenChange={setIsScenariosDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Escenarios de Prueba Sugeridos
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {suggestedScenarios.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedScenarios.map((scenario, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                        <div className="font-medium text-sm">Escenario {index + 1}</div>
                        <div className="text-sm mt-1">{scenario}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay escenarios sugeridos aún. Haz clic en "Sugerir Escenarios" para generarlos.
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsScenariosDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    handleSuggestScenarios();
                  }}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? 'Generando...' : 'Regenerar Escenarios'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Nuevo diálogo: Reporte de Cobertura */}
        {isCoverageDialogOpen && (
          <Dialog open={isCoverageDialogOpen} onOpenChange={setIsCoverageDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análisis de Cobertura de Pruebas
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {coverageReport ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {coverageReport.coveragePercentage}%
                      </div>
                      <div className="text-sm text-gray-600">Cobertura Actual</div>
                    </div>

                    {coverageReport.missingScenarios.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-600 mb-2">Escenarios Faltantes:</h4>
                        <ul className="space-y-1">
                          {coverageReport.missingScenarios.map((scenario, index) => (
                            <li key={index} className="text-sm">• {scenario}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {coverageReport.riskAreas.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-orange-600 mb-2">Áreas de Riesgo:</h4>
                        <ul className="space-y-1">
                          {coverageReport.riskAreas.map((risk, index) => (
                            <li key={index} className="text-sm">• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {coverageReport.recommendations.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Recomendaciones:</h4>
                        <ul className="space-y-1">
                          {coverageReport.recommendations.map((rec, index) => (
                            <li key={index} className="text-sm">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No hay reporte de cobertura aún. Haz clic en "Analizar Cobertura" para generarlo.
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCoverageDialogOpen(false)}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    handleAnalyzeCoverage();
                  }}
                  disabled={isGeneratingAI}
                >
                  {isGeneratingAI ? 'Analizando...' : 'Regenerar Análisis'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    );
  }

  return renderContent();
};

export default ExcelTestCaseImportExport;