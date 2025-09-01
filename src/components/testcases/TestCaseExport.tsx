'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { FileDown, FileText, Search, FileType } from 'lucide-react';
import { TestCase } from '@/models/TestCase';
import { useProjects, useAllProjects } from '@/hooks/useProjects';
import { TestPlan } from '@/hooks/useTestPlans';
// Importamos jspdf correctamente
import { jsPDF } from 'jspdf';
// Importamos autotable como plugin
import autoTable from 'jspdf-autotable';
// Importamos docx para generar documentos de Word
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableCell, 
  TableRow, 
  HeadingLevel, 
  AlignmentType, 
  BorderStyle,
  WidthType,
  ShadingType
} from 'docx';

interface TestCaseExportProps {
  projectId?: string;
  testCases?: TestCase[];
}

export default function TestCaseExport({ projectId, testCases = [] }: TestCaseExportProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const { projects } = useAllProjects();
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [projectsWithPlans, setProjectsWithPlans] = useState<any[]>([]);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'word'>('excel');
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
      
      // Filtrar solo los casos de prueba que pertenecen al proyecto seleccionado
      const filteredTestCases = testCases.filter(tc => tc.projectId === selectedProjectId);
      
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
      filteredTestCases.forEach(tc => {
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
      }      // Calcular la calidad del desarrollo usando el mismo algoritmo que la API
      let totalCasosDisenados = 0;
      let ejecutados = 0;
      let exitosos = 0;
      let totalDefectos = 0;
      let tiposPrueba = new Set();
      
      for (const cycle in cycleStats) {
        totalCasosDisenados += cycleStats[cycle].disenados;
        ejecutados += (cycleStats[cycle].disenados - cycleStats[cycle].noEjecutados);
        exitosos += cycleStats[cycle].exitosos;
        totalDefectos += cycleStats[cycle].defectos;
      }
      
      // Recolectar tipos únicos de prueba
      filteredTestCases.forEach(tc => {
        if (tc.testType) {
          tiposPrueba.add(tc.testType);
        }
      });
      
      let calidad = 100;
      
      if (totalCasosDisenados > 0) {
        // 1. Cobertura de ejecución: porcentaje de casos ejecutados vs. diseñados
        const coverageScore = (ejecutados / totalCasosDisenados) * 100;
        
        // 2. Eficacia: porcentaje de casos exitosos vs. ejecutados
        const effectivenessScore = ejecutados > 0 ? (exitosos / ejecutados) * 100 : 100;
        
        // 3. Densidad de defectos: defectos por caso de prueba (invertido)
        const defectDensity = totalDefectos / totalCasosDisenados;
        // Usar función exponencial para penalizar más fuertemente densidades altas
        const defectScore = 100 * Math.exp(-defectDensity);
        
        // 4. Diversidad de tipos de prueba
        const uniqueTestTypes = tiposPrueba.size;
        const testTypeScore = Math.min(uniqueTestTypes * 20, 100); // 20 puntos por cada tipo, máximo 100
        
        // Ponderación de factores (igual que en la API)
        const weightCoverage = 0.35; // 35%
        const weightEffectiveness = 0.35; // 35%
        const weightDefects = 0.20; // 20%
        const weightTestTypes = 0.10; // 10%
        
        // Cálculo del puntaje final
        calidad = (
          (coverageScore * weightCoverage) +
          (effectivenessScore * weightEffectiveness) +
          (defectScore * weightDefects) +
          (testTypeScore * weightTestTypes)
        );
        
        // Redondear a 2 decimales
        calidad = Math.round(calidad * 100) / 100;
      }
      
      mainData.push([''], [''], ['Calidad del desarrollo', '', '', '', '', '', '', '', '', '', '', '', '', `${Math.round(calidad)}%`]);
      
      // Encabezados de la tabla de casos
      mainData.push([
        'HU', 'ID', 'Nombre del caso de prueba', 'Pasos', 'Resultado esperado', 'Tipo de Prueba', 'Estado', 
        'Defectos C1', 'Defectos C2', 'Defectos C3', 'Categoría de Incidencia', 'Evidencia Del caso', 'Observacion', 'Responsable'
      ]);
      
      // Datos de los casos
      filteredTestCases.forEach(tc => {
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
      const projectName = project ? project.proyecto : 'casos_prueba';   
      
      // Filtrar solo los casos de prueba que pertenecen al proyecto seleccionado
      const filteredTestCases = testCases.filter(tc => tc.projectId === selectedProjectId);
      
      // Crear un nuevo documento PDF
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
        // Configuramos un estilo más moderno para la información del proyecto
      const primaryColor = [41, 98, 255]; // Azul más moderno
      const secondaryColor = [45, 55, 72]; // Azul oscuro para texto
      
      // Añadimos un rectángulo redondeado como fondo para la información del proyecto
      doc.setFillColor(248, 250, 252); // Fondo gris muy claro
      doc.roundedRect(10, 20, 270, 15, 3, 3, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        // Aseguramos que las fechas se formateen correctamente
      let fechaInicio = '';
      if (project?.fechaInicio) {
        try {
          // Verificamos si la fecha es un string o un objeto Date
          const fechaObj = typeof project.fechaInicio === 'string' ? 
            new Date(project.fechaInicio) : project.fechaInicio;
          
          // Formateamos la fecha manualmente para asegurar consistencia
          fechaInicio = `${fechaObj.getDate().toString().padStart(2, '0')}/${
            (fechaObj.getMonth()+1).toString().padStart(2, '0')}/${
            fechaObj.getFullYear()}`;
        } catch (e) {
          console.error('Error al formatear fecha inicio:', e);
          fechaInicio = 'No disponible';
        }
      } else {
        fechaInicio = 'No disponible';
      }
      
      let fechaFin = '';
      if (project?.fechaEntrega) {
        try {
          const fechaObj = typeof project.fechaEntrega === 'string' ? 
            new Date(project.fechaEntrega) : project.fechaEntrega;
          
          fechaFin = `${fechaObj.getDate().toString().padStart(2, '0')}/${
            (fechaObj.getMonth()+1).toString().padStart(2, '0')}/${
            fechaObj.getFullYear()}`;
        } catch (e) {
          console.error('Error al formatear fecha fin:', e);
          fechaFin = 'No disponible';
        }
      } else {
        fechaFin = 'No disponible';
      }
      
      // Crear diseño moderno para la información del proyecto con iconos y colores
      // Primero dibujamos un rectángulo redondeado con gradiente como fondo para las fechas
      const gradientCoords = { x1: 140, y1: 20, x2: 280, y2: 32 };
      doc.setFillColor(230, 240, 255);
      doc.roundedRect(140, 20, 140, 15, 3, 3, 'F');
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Proyecto: ${project?.proyecto || ''}`, 15, 27);
      doc.text(`Código JIRA: ${project?.idJira || ''}`, 15, 32);
      
      // Dibujar un icono de calendario más elegante en lugar de emoji
      doc.setFillColor(41, 98, 255); // Color azul para los iconos
      doc.circle(145, 27, 2, 'F'); // Círculo para "Fecha inicio"
      doc.circle(145, 32, 2, 'F'); // Círculo para "Fecha fin"
      
      // Texto de las fechas con fuente más estilizada
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 64, 80); // Color oscuro para textos importantes
      doc.text(`Fecha inicio:`, 150, 27);
      doc.text(`Fecha fin:`, 150, 32);
      
      // Los valores de fechas con otro color para destacar
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(41, 98, 255); // Azul para los valores de fecha
      const xPosValueInicio = doc.getTextWidth(`Fecha inicio:`) + 153;
      const xPosValueFin = doc.getTextWidth(`Fecha fin:`) + 153;
      doc.text(fechaInicio, xPosValueInicio, 27);
      doc.text(fechaFin, xPosValueFin, 32);
      
      // Restaurar color de texto para el resto del documento
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      
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
      filteredTestCases.forEach(tc => {
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
      }      // Añadir tabla de estadísticas con estilo moderno
      autoTable(doc, {
        startY: 37, // Iniciar tabla más arriba
        head: [['Ciclo', 'Diseñados', 'Exitosos', 'No ejecutados', 'Defectos', '% Exitosos', '% Incidentes']],
        body: statsData,
        theme: 'striped', // Tabla con filas alternadas para mejor lectura
        headStyles: {
          fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8, // Fuente más pequeña
          halign: 'center' // Centrar encabezados
        },
        bodyStyles: {
          fontSize: 8, // Fuente más pequeña para datos
          halign: 'center' // Centrar contenido
        },
        alternateRowStyles: {
          fillColor: [245, 250, 255] // Color para filas alternadas
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
        margin: { top: 5, right: 5, bottom: 5, left: 5 }, // Márgenes más pequeños
        styles: {
          cellPadding: 2,
          lineWidth: 0.1,
          lineColor: [220, 220, 220] // Líneas de tabla más sutiles
        }
      });      // Obtener la posición Y después de la tabla de estadísticas
      const finalY = (doc as any).lastAutoTable?.finalY || 55;
      
      // Calcular la calidad del desarrollo usando el mismo algoritmo que la API
      let totalCasosDisenados = 0;
      let ejecutados = 0;
      let exitosos = 0;
      let totalDefectos = 0;
      let tiposPrueba = new Set();
      
      for (const cycle in cycleStats) {
        totalCasosDisenados += cycleStats[cycle].disenados;
        ejecutados += (cycleStats[cycle].disenados - cycleStats[cycle].noEjecutados);
        exitosos += cycleStats[cycle].exitosos;
        totalDefectos += cycleStats[cycle].defectos;
      }
      
      // Recolectar tipos únicos de prueba
      filteredTestCases.forEach(tc => {
        if (tc.testType) {
          tiposPrueba.add(tc.testType);
        }
      });
      
      let calidad = -1; // Valor predeterminado N/A
      
      if (totalCasosDisenados > 0) {
        // 1. Cobertura de ejecución: porcentaje de casos ejecutados vs. diseñados
        const coverageScore = (ejecutados / totalCasosDisenados) * 100;
        
        // 2. Eficacia: porcentaje de casos exitosos vs. ejecutados
        const effectivenessScore = ejecutados > 0 ? (exitosos / ejecutados) * 100 : 100;
        
        // 3. Densidad de defectos: defectos por caso de prueba (invertido)
        const defectDensity = totalDefectos / totalCasosDisenados;
        // Usar función exponencial para penalizar más fuertemente densidades altas
        const defectScore = 100 * Math.exp(-defectDensity);
        
        // 4. Diversidad de tipos de prueba
        const uniqueTestTypes = tiposPrueba.size;
        const testTypeScore = Math.min(uniqueTestTypes * 20, 100); // 20 puntos por cada tipo, máximo 100
        
        // Ponderación de factores (igual que en la API)
        const weightCoverage = 0.35; // 35%
        const weightEffectiveness = 0.35; // 35%
        const weightDefects = 0.20; // 20%
        const weightTestTypes = 0.10; // 10%
        
        // Cálculo del puntaje final
        calidad = (
          (coverageScore * weightCoverage) +
          (effectivenessScore * weightEffectiveness) +
          (defectScore * weightDefects) +
          (testTypeScore * weightTestTypes)
        );
        
        // Redondear a 2 decimales
        calidad = Math.round(calidad * 100) / 100;
      }
        // Añadir resumen de calidad con estilo moderno
      // Crear un recuadro con estilo para la información de calidad
      doc.setFillColor(230, 247, 235); // Fondo verde claro para calidad positiva
      doc.roundedRect(10, finalY + 2, 120, 10, 3, 3, 'F');
        // Añadir un indicador visual de nivel de calidad (círculo de color)
      const calidadColor = calidad === -1 ? [128, 128, 128] : // Gris para N/A
                           calidad > 80 ? [46, 160, 67] : // Verde para alta calidad
                           calidad > 60 ? [255, 170, 0] : // Naranja para calidad media
                           [220, 53, 69]; // Rojo para calidad baja
      
      doc.setFillColor(calidadColor[0], calidadColor[1], calidadColor[2]);
      doc.circle(18, finalY + 7, 2.5, 'F');
      
      // Texto de calidad con estilo mejorado
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text('Calidad del desarrollo:', 25, finalY + 7);
        // Destacar el porcentaje con color según el nivel de calidad
      doc.setTextColor(calidadColor[0], calidadColor[1], calidadColor[2]);
      doc.setFontSize(10);
      doc.text(calidad === -1 ? 'N/A' : `${Math.round(calidad)}%`, 85, finalY + 7);
        // Preparar datos para la tabla principal
      const tableData = filteredTestCases.map(tc => {
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
      });      // Añadir tabla principal con casos de prueba con diseño moderno
      autoTable(doc, {
        startY: finalY + 14, // Reducir espacio
        head: [['HU', 'ID', 'Nombre del caso', 'Pasos', 'Resultado esperado', 'Tipo', 'Estado', 'Defectos', 'Responsable']],
        body: tableData,
        theme: 'striped', // Tema con filas alternadas
        headStyles: {
          fillColor: [primaryColor[0], primaryColor[1], primaryColor[2]],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8, // Fuente más pequeña para encabezados
          halign: 'center' // Centrar encabezados
        },
        bodyStyles: {
          fontSize: 7, // Fuente más pequeña para contenido
          lineColor: [220, 220, 220] // Líneas más claras
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Color suave para filas alternadas
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' }, // HU - más estrecho y centrado
          1: { cellWidth: 15, halign: 'center' }, // ID - más estrecho y centrado
          2: { cellWidth: 40 }, // Nombre - mantener ancho para legibilidad
          3: { cellWidth: 55, fontSize: 6 }, // Pasos - espacio adecuado y fuente más pequeña
          4: { cellWidth: 40, fontSize: 6 }, // Resultado - reducido y fuente más pequeña
          5: { cellWidth: 20, halign: 'center' }, // Tipo - más estrecho y centrado
          6: { cellWidth: 20, halign: 'center' }, // Estado - más estrecho y centrado
          7: { cellWidth: 30 }, // Defectos - mantener para legibilidad
          8: { cellWidth: 20, halign: 'center' }  // Responsable - más estrecho y centrado
        },
        styles: {
          overflow: 'linebreak',
          cellPadding: 1, // Reducir el padding
          lineWidth: 0.1, // Líneas más finas
          valign: 'middle' // Alinear verticalmente al centro
        },        didDrawPage: (data) => {
          // Añadir pie de página con diseño moderno
          const pageCount = doc.getNumberOfPages();
          const pageWidth = doc.internal.pageSize.width;
          const pageHeight = doc.internal.pageSize.height;
          
          // Guardar estado actual para restaurarlo después
          const oldFillColor = doc.getFillColor();
          
          // Añadir un fondo con gradiente sutil para el pie de página
          doc.setFillColor(245, 248, 252); // Fondo claro con tono azulado
          doc.roundedRect(0, pageHeight - 12, pageWidth, 12, 0, 0, 'F');
          
          // Añadir una línea sutil en la parte superior del pie de página
          doc.setDrawColor(220, 230, 245);
          doc.setLineWidth(0.5);
          doc.line(0, pageHeight - 12, pageWidth, pageHeight - 12);
          
          // Restaurar el color de relleno original
          doc.setFillColor(oldFillColor);
          
          // Añadir información en el pie de página con diseño moderno
          doc.setFontSize(7.5);
          doc.setTextColor(100, 120, 150); // Color azul grisáceo para texto del pie
          doc.setFont('helvetica', 'italic');
          
          // Añadir el número de página con estilo
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`, 
            pageWidth - 30, 
            pageHeight - 5
          );
          
          // Añadir fecha de generación con estilo
          const fecha = new Date().toLocaleDateString();
          const hora = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          doc.text(
            `Generado: ${fecha} a las ${hora}`,
            15,
            pageHeight - 5
          );
          
          // Añadir encabezado en páginas subsiguientes si no es la primera página
          if (data.pageNumber > 1) {
            // Guardar estado actual
            const oldFillColor = doc.getFillColor();
            
            // Añadir un rectángulo con el color primario como encabezado
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.roundedRect(0, 0, pageWidth, 14, 0, 0, 'F');
            
            // Restaurar el color de relleno
            doc.setFillColor(oldFillColor);
            
            // Añadir texto del encabezado con estilo 
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('CASOS DE PRUEBA - QUALITY TEAMS', 15, 9);
            
            // Añadir información del proyecto
            doc.setFontSize(8);
            doc.text(`Proyecto: ${project?.proyecto || ''} (${project?.idJira || ''})`, pageWidth - 100, 9);
            
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

  // Función para exportar a Word con formato profesional
  const handleExportToWord = async () => {
    setIsLoading(true);
    
    try {
      const project = projects.find(p => p.id === selectedProjectId || p.idJira === selectedProjectId);
      const projectName = project ? project.proyecto : 'casos_prueba';
      
      // Filtrar solo los casos de prueba que pertenecen al proyecto seleccionado
      const filteredTestCases = testCases.filter(tc => tc.projectId === selectedProjectId);
      
      // Calcular estadísticas por ciclo (igual que en PDF)
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
      
      // Calcular estadísticas
      filteredTestCases.forEach(tc => {
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

      // Formatear fechas
      let fechaInicio = '';
      if (project?.fechaInicio) {
        try {
          const fechaObj = typeof project.fechaInicio === 'string' ? 
            new Date(project.fechaInicio) : project.fechaInicio;
          fechaInicio = `${fechaObj.getDate().toString().padStart(2, '0')}/${
            (fechaObj.getMonth()+1).toString().padStart(2, '0')}/${
            fechaObj.getFullYear()}`;
        } catch (e) {
          fechaInicio = 'No disponible';
        }
      } else {
        fechaInicio = 'No disponible';
      }
      
      let fechaFin = '';
      if (project?.fechaEntrega) {
        try {
          const fechaObj = typeof project.fechaEntrega === 'string' ? 
            new Date(project.fechaEntrega) : project.fechaEntrega;
          fechaFin = `${fechaObj.getDate().toString().padStart(2, '0')}/${
            (fechaObj.getMonth()+1).toString().padStart(2, '0')}/${
            fechaObj.getFullYear()}`;
        } catch (e) {
          fechaFin = 'No disponible';
        }
      } else {
        fechaFin = 'No disponible';
      }

      // Calcular calidad del desarrollo
      let totalCasosDisenados = 0;
      let ejecutados = 0;
      let exitosos = 0;
      let totalDefectos = 0;
      let tiposPrueba = new Set();
      
      for (const cycle in cycleStats) {
        totalCasosDisenados += cycleStats[cycle].disenados;
        ejecutados += (cycleStats[cycle].disenados - cycleStats[cycle].noEjecutados);
        exitosos += cycleStats[cycle].exitosos;
        totalDefectos += cycleStats[cycle].defectos;
      }
      
      filteredTestCases.forEach(tc => {
        if (tc.testType) {
          tiposPrueba.add(tc.testType);
        }
      });
      
      let calidad = -1;
      
      if (totalCasosDisenados > 0) {
        const coverageScore = (ejecutados / totalCasosDisenados) * 100;
        const effectivenessScore = ejecutados > 0 ? (exitosos / ejecutados) * 100 : 100;
        const defectDensity = totalDefectos / totalCasosDisenados;
        const defectScore = 100 * Math.exp(-defectDensity);
        const uniqueTestTypes = tiposPrueba.size;
        const testTypeScore = Math.min(uniqueTestTypes * 20, 100);
        
        const weightCoverage = 0.35;
        const weightEffectiveness = 0.35;
        const weightDefects = 0.20;
        const weightTestTypes = 0.10;
        
        calidad = (
          (coverageScore * weightCoverage) +
          (effectivenessScore * weightEffectiveness) +
          (defectScore * weightDefects) +
          (testTypeScore * weightTestTypes)
        );
        
        calidad = Math.round(calidad * 100) / 100;
      }

      // Crear el documento de Word
      const doc = new Document({
        sections: [
          {
            children: [
              // Título principal
              new Paragraph({
                children: [
                  new TextRun({
                    text: "CASOS DE PRUEBA - QUALITY TEAMS",
                    bold: true,
                    size: 36,
                    color: "1F4E79"
                  })
                ],
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
              }),

              // Línea decorativa
              new Paragraph({
                children: [
                  new TextRun({
                    text: "═══════════════════════════════════════════════════════════════",
                    color: "1F4E79",
                    size: 24
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
              }),

              // Información del proyecto
              new Paragraph({
                children: [
                  new TextRun({
                    text: "INFORMACIÓN DEL PROYECTO",
                    bold: true,
                    size: 28,
                    color: "1F4E79"
                  })
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 300 }
              }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                  bottom: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                  left: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                  right: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D5E0F0" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D5E0F0" }
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "Proyecto:", bold: true, color: "FFFFFF" })],
                          alignment: AlignmentType.CENTER
                        })],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: project?.proyecto || '', size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        shading: { type: ShadingType.CLEAR, color: "F8FAFC" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "Código JIRA:", bold: true, color: "FFFFFF" })],
                          alignment: AlignmentType.CENTER
                        })],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: project?.idJira || '', size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        shading: { type: ShadingType.CLEAR, color: "F8FAFC" }
                      })
                    ]
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "Fecha inicio:", bold: true, color: "FFFFFF" })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: fechaInicio, size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "F8FAFC" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "Fecha fin:", bold: true, color: "FFFFFF" })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: fechaFin, size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "F8FAFC" }
                      })
                    ]
                  })
                ]
              }),

              // Espacio y línea decorativa
              new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 400, after: 200 } }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: "───────────────────────────────────────────────────────────────",
                    color: "D5E0F0",
                    size: 20
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
              }),

              // Estadísticas por ciclo
              new Paragraph({
                children: [
                  new TextRun({
                    text: "ESTADÍSTICAS POR CICLO",
                    bold: true,
                    size: 28,
                    color: "1F4E79"
                  })
                ],
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 200, after: 300 }
              }),

              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                  bottom: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                  left: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                  right: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D5E0F0" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D5E0F0" }
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "Ciclo", bold: true, color: "FFFFFF", size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "Diseñados", bold: true, color: "FFFFFF", size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "Exitosos", bold: true, color: "FFFFFF", size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "No ejecutados", bold: true, color: "FFFFFF", size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "Defectos", bold: true, color: "FFFFFF", size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "% Exitosos", bold: true, color: "FFFFFF", size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "% Incidentes", bold: true, color: "FFFFFF", size: 22 })],
                          alignment: AlignmentType.CENTER
                        })],
                        shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                      })
                    ]
                  }),
                  ...Object.entries(cycleStats).map(([cycle, stats], index) => {
                    const exitosoPercent = stats.disenados ? Math.round((stats.exitosos / stats.disenados) * 100) : 0;
                    const incidentesPercent = stats.disenados ? Math.round((stats.defectos / stats.disenados) * 100) : 0;
                    const isEvenRow = index % 2 === 0;
                    
                    return new TableRow({
                      children: [
                        new TableCell({ 
                          children: [new Paragraph({ 
                            children: [new TextRun({ text: cycle, size: 20, bold: true })],
                            alignment: AlignmentType.CENTER
                          })],
                          shading: isEvenRow ? { type: ShadingType.CLEAR, color: "F8FAFC" } : { type: ShadingType.CLEAR, color: "FFFFFF" }
                        }),
                        new TableCell({ 
                          children: [new Paragraph({ 
                            children: [new TextRun({ text: String(stats.disenados), size: 20 })],
                            alignment: AlignmentType.CENTER
                          })],
                          shading: isEvenRow ? { type: ShadingType.CLEAR, color: "F8FAFC" } : { type: ShadingType.CLEAR, color: "FFFFFF" }
                        }),
                        new TableCell({ 
                          children: [new Paragraph({ 
                            children: [new TextRun({ text: String(stats.exitosos), size: 20 })],
                            alignment: AlignmentType.CENTER
                          })],
                          shading: isEvenRow ? { type: ShadingType.CLEAR, color: "F8FAFC" } : { type: ShadingType.CLEAR, color: "FFFFFF" }
                        }),
                        new TableCell({ 
                          children: [new Paragraph({ 
                            children: [new TextRun({ text: String(stats.noEjecutados), size: 20 })],
                            alignment: AlignmentType.CENTER
                          })],
                          shading: isEvenRow ? { type: ShadingType.CLEAR, color: "F8FAFC" } : { type: ShadingType.CLEAR, color: "FFFFFF" }
                        }),
                        new TableCell({ 
                          children: [new Paragraph({ 
                            children: [new TextRun({ text: String(stats.defectos), size: 20 })],
                            alignment: AlignmentType.CENTER
                          })],
                          shading: isEvenRow ? { type: ShadingType.CLEAR, color: "F8FAFC" } : { type: ShadingType.CLEAR, color: "FFFFFF" }
                        }),
                        new TableCell({ 
                          children: [new Paragraph({ 
                            children: [new TextRun({ text: `${exitosoPercent}%`, size: 20 })],
                            alignment: AlignmentType.CENTER
                          })],
                          shading: isEvenRow ? { type: ShadingType.CLEAR, color: "F8FAFC" } : { type: ShadingType.CLEAR, color: "FFFFFF" }
                        }),
                        new TableCell({ 
                          children: [new Paragraph({ 
                            children: [new TextRun({ text: `${incidentesPercent}%`, size: 20 })],
                            alignment: AlignmentType.CENTER
                          })],
                          shading: isEvenRow ? { type: ShadingType.CLEAR, color: "F8FAFC" } : { type: ShadingType.CLEAR, color: "FFFFFF" }
                        })
                      ]
                    });
                  })
                ]
              }),

              // Espacio y línea decorativa final
              new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 400, after: 200 } }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "───────────────────────────────────────────────────────────────",
                    color: "D5E0F0",
                    size: 20
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
              }),

              // Nueva página para los casos de prueba
              new Paragraph({
                children: [new TextRun({ text: "" })],
                pageBreakBefore: true,
                spacing: { before: 0, after: 400 }
              }),

              // Título de casos de prueba
              new Paragraph({
                children: [
                  new TextRun({
                    text: "CASOS DE PRUEBA DETALLADOS",
                    bold: true,
                    size: 32,
                    color: "1F4E79"
                  })
                ],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 400 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "═══════════════════════════════════════════════════════════════",
                    color: "1F4E79",
                    size: 24
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
              }),

              // Generar cada caso de prueba con su sección de evidencias
              ...filteredTestCases.map((tc, index) => {
                
                return [
                  // Título del caso de prueba
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `CASO DE PRUEBA: ${tc.codeRef || `TC-${index + 1}`}`,
                        bold: true,
                        size: 26,
                        color: "1F4E79"
                      })
                    ],
                    spacing: { before: 400, after: 300 },
                    pageBreakBefore: index > 0 // Nueva página para cada caso después del primero
                  }),

                  // Información del caso de prueba en tabla elegante
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                      bottom: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                      left: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                      right: { style: BorderStyle.SINGLE, size: 2, color: "1F4E79" },
                      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D5E0F0" },
                      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D5E0F0" }
                    },
                    rows: [
                      // Fila 1: HU y Estado en una sola fila
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({ 
                              children: [new TextRun({ text: "Historia de Usuario:", bold: true, color: "000000", size: 20 })],
                              alignment: AlignmentType.CENTER
                            })],
                            width: { size: 30, type: WidthType.PERCENTAGE },
                            shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                          }),
                          new TableCell({
                            children: [new Paragraph({ 
                              children: [new TextRun({ text: tc.userStoryId || '', size: 20, bold: true })],
                              alignment: AlignmentType.CENTER
                            })],
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            shading: { type: ShadingType.CLEAR, color: "F8FAFC" }
                          })
                        ]
                      }),
                      // Fila 2: Nombre del caso
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({ 
                              children: [new TextRun({ text: "Nombre del Caso:", bold: true, color: "000000", size: 20 })],
                              alignment: AlignmentType.CENTER
                            })],
                            shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                          }),
                          new TableCell({
                            children: [new Paragraph({ 
                              children: [new TextRun({ text: tc.name || '', size: 18 })],
                              alignment: AlignmentType.LEFT
                            })],
                            shading: { type: ShadingType.CLEAR, color: "FFFFFF" }
                          })
                        ]
                      }),
                      // Fila 3: Pasos de ejecución
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({ 
                              children: [new TextRun({ text: "Pasos de Ejecución:", bold: true, color: "000000", size: 20 })],
                              alignment: AlignmentType.CENTER
                            })],
                            shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                          }),
                          new TableCell({
                            children: [
                              // Generar cada paso como un párrafo separado
                              ...(tc.steps?.map((step, stepIndex) => 
                                new Paragraph({ 
                                  children: [new TextRun({ 
                                    text: `${stepIndex + 1}. ${step.description}`, 
                                    size: 16 
                                  })],
                                  alignment: AlignmentType.LEFT,
                                  spacing: { after: 120 }
                                })
                              ) || [new Paragraph({ children: [new TextRun({ text: "No hay pasos definidos", size: 16 })] })])
                            ],
                            shading: { type: ShadingType.CLEAR, color: "F8FAFC" }
                          })
                        ]
                      }),
                      // Fila 4: Resultado esperado
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [new Paragraph({ 
                              children: [new TextRun({ text: "Resultado Esperado:", bold: true, color: "000000", size: 20 })],
                              alignment: AlignmentType.CENTER
                            })],
                            shading: { type: ShadingType.CLEAR, color: "1F4E79" }
                          }),
                          new TableCell({
                            children: [new Paragraph({ 
                              children: [new TextRun({ text: tc.expectedResult || '', size: 16 })],
                              alignment: AlignmentType.LEFT
                            })],
                            shading: { type: ShadingType.CLEAR, color: "FFFFFF" }
                          })
                        ]
                      })
                    ]
                  }),

                  // Espacio antes de la sección de evidencias
                  new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 400, after: 200 } }),

                  // Sección de evidencias
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `📋 EVIDENCIAS - ${tc.codeRef || `TC-${index + 1}`}`,
                        bold: true,
                        size: 24,
                        color: "0F6CBD"
                      })
                    ],
                    spacing: { before: 200, after: 300 }
                  }),

                  // Tabla simple para evidencias
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 2, color: "0F6CBD" },
                      bottom: { style: BorderStyle.SINGLE, size: 2, color: "0F6CBD" },
                      left: { style: BorderStyle.SINGLE, size: 2, color: "0F6CBD" },
                      right: { style: BorderStyle.SINGLE, size: 2, color: "0F6CBD" },
                      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D5E0F0" },
                      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D5E0F0" }
                    },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            children: [
                              new Paragraph({ 
                                children: [new TextRun({ 
                                  text: "[Insertar capturas de pantalla aquí]",
                                  italics: true,
                                  color: "666666",
                                  size: 16
                                })],
                                spacing: { before: 200, after: 200 }
                              }),
                              new Paragraph({ children: [new TextRun({ text: "" })] }),
                              new Paragraph({ children: [new TextRun({ text: "" })] }),
                              new Paragraph({ children: [new TextRun({ text: "" })] }),
                              new Paragraph({ children: [new TextRun({ text: "" })] }),
                              new Paragraph({ children: [new TextRun({ text: "" })] }),
                              new Paragraph({ 
                                children: [
                                  new TextRun({ text: "☐ Exitoso   ☐ Fallido   ☐ Bloqueado", size: 18, bold: true })
                                ],
                                spacing: { before: 300, after: 200 }
                              })
                            ],
                            shading: { type: ShadingType.CLEAR, color: "F8FAFC" }
                          })
                        ]
                      })
                    ]
                  }),

                  // Línea separadora al final de cada caso
                  new Paragraph({ children: [new TextRun({ text: "" })], spacing: { before: 300, after: 200 } }),
                  
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "───────────────────────────────────────────────────────────────",
                        color: "D5E0F0",
                        size: 16
                      })
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 200 }
                  })
                ];
              }).flat(),

              // Página final con resumen
              new Paragraph({
                children: [new TextRun({ text: "" })],
                pageBreakBefore: true,
                spacing: { before: 0, after: 400 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "RESUMEN DE EJECUCIÓN",
                    bold: true,
                    size: 32,
                    color: "1F4E79"
                  })
                ],
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 400 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Total de casos de prueba documentados: ${filteredTestCases.length}`,
                    bold: true,
                    size: 22
                  })
                ],
                spacing: { after: 300 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: "Instrucciones para el equipo de QA:",
                    bold: true,
                    size: 20,
                    color: "1F4E79"
                  })
                ],
                spacing: { after: 200 }
              }),

              new Paragraph({
                children: [
                  new TextRun({ 
                    text: "1. Ejecutar cada caso de prueba siguiendo los pasos detallados", 
                    size: 18 
                  })
                ],
                spacing: { after: 100 }
              }),

              new Paragraph({
                children: [
                  new TextRun({ 
                    text: "2. Documentar todas las evidencias (capturas, logs, etc.)", 
                    size: 18 
                  })
                ],
                spacing: { after: 100 }
              }),

              new Paragraph({
                children: [
                  new TextRun({ 
                    text: "3. Marcar el estado final de cada caso de prueba", 
                    size: 18 
                  })
                ],
                spacing: { after: 100 }
              }),

              new Paragraph({
                children: [
                  new TextRun({ 
                    text: "4. Reportar defectos encontrados con el formato establecido", 
                    size: 18 
                  })
                ],
                spacing: { after: 100 }
              }),

              new Paragraph({
                children: [
                  new TextRun({ 
                    text: "5. Completar la información del ejecutor en cada caso", 
                    size: 18 
                  })
                ],
                spacing: { after: 300 }
              }),

              // Información de generación del documento
              new Paragraph({
                children: [
                  new TextRun({
                    text: "───────────────────────────────────────────────────────────────",
                    color: "D5E0F0",
                    size: 20
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 200 }
              }),

              new Paragraph({
                children: [
                  new TextRun({ 
                    text: `Documento generado automáticamente el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}`,
                    italics: true,
                    size: 16,
                    color: "666666"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 }
              }),

              new Paragraph({
                children: [
                  new TextRun({ 
                    text: "Quality Teams - Sistema de Gestión de Casos de Prueba",
                    italics: true,
                    size: 16,
                    color: "666666"
                  })
                ],
                alignment: AlignmentType.CENTER
              })
            ]
          }
        ]
      });

      // Generar el archivo
      const buffer = await Packer.toBuffer(doc);
      const blob = new Blob([buffer], { 
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
      });
      
      saveAs(blob, `${projectName}_casos_prueba.docx`);
      
      toast.success('Exportación a Word completada con formato profesional');
      setIsExportDialogOpen(false);

    } catch (error) {
      console.error('Error al exportar a Word:', error);
      
      let errorMessage = 'Error al exportar a Word';
      if (error instanceof Error) {
        errorMessage = `Error al exportar a Word: ${error.message}`;
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
    } else if (exportFormat === 'pdf') {
      handleExportToPDF();
    } else if (exportFormat === 'word') {
      handleExportToWord();
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
                  <Button
                    type="button"
                    variant={exportFormat === 'word' ? 'default' : 'outline'}
                    className={`flex items-center gap-2 ${exportFormat === 'word' ? 'bg-blue-800' : ''}`}
                    onClick={() => setExportFormat('word')}
                  >
                    <FileType size={16} /> Word
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
                {isLoading ? 'Exportando...' : 
                  exportFormat === 'excel' ? 'Exportar a Excel' : 
                  exportFormat === 'pdf' ? 'Exportar a PDF' : 
                  'Exportar a Word'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
