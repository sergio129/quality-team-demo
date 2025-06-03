'use client';

import { QAAnalyst, QARole } from '@/models/QAAnalyst';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { EditAnalystDialog } from './EditAnalystDialog';
import { AnalystStatsDialog } from './AnalystStatsDialog';
import { AnalystWorkloadDialog } from './AnalystWorkloadDialog';
import { AnalystVacationsDialog } from './AnalystVacationsDialog';
import { toast } from 'sonner';
import { useAnalysts, useCells, deleteAnalyst, CellInfo } from '@/hooks/useAnalysts';

// Definir tipos para el ordenamiento
type SortField = keyof Pick<QAAnalyst, 'name' | 'email' | 'role'> | 'cells';
type SortDirection = 'asc' | 'desc';

export function DataTable() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Ordenamiento
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Usar SWR para obtener datos
  const { analysts, isLoading: analystsLoading, isError: analystsError } = useAnalysts();
  const { cells, isLoading: cellsLoading } = useCells();
  
  const isLoading = analystsLoading || cellsLoading;
  const isError = analystsError;

  useEffect(() => {
    // Resetear a la primera página cuando cambia el término de búsqueda
    setCurrentPage(1);
  }, [searchTerm]);

  const handleDelete = useCallback(async (id: string) => {
    toast.error('¿Eliminar analista?', {
      action: {
        label: 'Eliminar',
        onClick: async () => {
          await deleteAnalyst(id);
        },
      },
    });
  }, []);
  
  // Función para obtener los nombres de las células
  const getCellNames = useCallback((cellIds: string[]) => {
    if (!cells) return '';
    
    return cellIds
      .map(id => cells.find(cell => cell.id === id)?.name || 'Célula no encontrada')
      .join(', ');
  }, [cells]);
  
  // Función para manejar el ordenamiento
  const handleSort = useCallback((field: SortField) => {
    setSortField(prevField => {
      if (prevField === field) {
        // Si hacemos clic en el mismo campo, invertir dirección
        setSortDirection(prevDir => prevDir === 'asc' ? 'desc' : 'asc');
        return prevField;
      } else {
        // Si cambiamos de campo, establecer el nuevo campo y dirección ascendente
        setSortDirection('asc');
        return field;
      }
    });
  }, []);
  
  // Filtramos y ordenamos analistas con useMemo para optimizar
  const filteredAndSortedAnalysts = useMemo(() => {
    if (!analysts || analysts.length === 0) return [];
    
    // Primero filtramos
    const filtered = analysts.filter(analyst => {
      const cellNames = getCellNames(analyst.cellIds || []).toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      return (
        analyst.name.toLowerCase().includes(searchLower) ||
        analyst.email.toLowerCase().includes(searchLower) ||
        cellNames.includes(searchLower) ||
        (analyst.role || '').toLowerCase().includes(searchLower)
      );
    });
    
    // Luego ordenamos
    return [...filtered].sort((a, b) => {
      let aValue, bValue;
      
      if (sortField === 'cells') {
        aValue = getCellNames(a.cellIds || []);
        bValue = getCellNames(b.cellIds || []);
      } else {
        aValue = a[sortField] || '';
        bValue = b[sortField] || '';
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return 0;
    });
  }, [analysts, cells, sortField, sortDirection, searchTerm, getCellNames]);

  // Lógica de paginación
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(filteredAndSortedAnalysts.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAndSortedAnalysts.slice(indexOfFirstItem, indexOfLastItem);
    
    return { 
      totalPages, 
      indexOfLastItem, 
      indexOfFirstItem, 
      currentItems 
    };
  }, [filteredAndSortedAnalysts, currentPage, itemsPerPage]);
  
  // Renderizar ícono de ordenamiento
  const renderSortIcon = useCallback((field: SortField) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">↕</span>;
    }
    return sortDirection === 'asc' 
      ? <span className="text-blue-600 ml-1">↑</span> 
      : <span className="text-blue-600 ml-1">↓</span>;
  }, [sortField, sortDirection]);

  // Renderizar el color del analista
  const renderColorIndicator = useCallback((color?: string) => {
    return (
      <span 
        className="inline-block w-3 h-3 mr-2 rounded-full" 
        style={{backgroundColor: color || '#CCCCCC'}}
      ></span>
    );
  }, []);

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          placeholder="Buscar analistas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-md" />
          ))}
        </div>
      ) : isError ? (
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No se pudieron cargar los analistas. Por favor, intente de nuevo.
          </h3>
          <Button onClick={() => window.location.reload()}>
            Intentar de nuevo
          </Button>
        </div>
      ) : filteredAndSortedAnalysts.length === 0 ? (
        <div className="text-center p-8 rounded-lg border border-dashed">
          {searchTerm ? (
            <p className="text-gray-500">No se encontraron analistas que coincidan con su búsqueda</p>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay analistas registrados</h3>
              <p className="text-gray-500 mb-4">Comience creando un nuevo analista</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('name')}>
                    <div className="flex items-center">
                      Nombre {renderSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('email')}>
                    <div className="flex items-center">
                      Email {renderSortIcon('email')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('cells')}>
                    <div className="flex items-center">
                      Célula {renderSortIcon('cells')}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSort('role')}>
                    <div className="flex items-center">
                      Rol {renderSortIcon('role')}
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginationInfo.currentItems.map((analyst) => (
                  <TableRow key={analyst.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {renderColorIndicator(analyst.color)}
                        {analyst.name}
                        {analyst.availability !== undefined && (
                          <span 
                            className={`ml-2 px-1 py-0.5 text-xs rounded-full ${
                              analyst.availability > 70 ? 'bg-green-100 text-green-800' :
                              analyst.availability > 30 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}
                          >
                            {analyst.availability}%
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{analyst.email}</TableCell>
                    <TableCell>{getCellNames(analyst.cellIds)}</TableCell>                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        analyst.role === 'QA Leader' ? 'bg-indigo-100 text-indigo-800' :
                        analyst.role === 'QA Senior' ? 'bg-purple-100 text-purple-800' :
                        analyst.role === 'QA Analyst' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {analyst.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <AnalystStatsDialog analyst={analyst} />
                        <AnalystWorkloadDialog analyst={analyst} />
                        <AnalystVacationsDialog analyst={analyst} />
                        <EditAnalystDialog analyst={analyst} cells={cells} />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(analyst.id)}
                          className="ml-2"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Controles de paginación */}
          {paginationInfo.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {paginationInfo.indexOfFirstItem + 1}-
                {Math.min(paginationInfo.indexOfLastItem, filteredAndSortedAnalysts.length)} de {filteredAndSortedAnalysts.length} analistas
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(paginationInfo.totalPages, 5))].map((_, idx) => {
                    // Lógica para mostrar números de página alrededor de la página actual
                    let pageNumber;
                    if (paginationInfo.totalPages <= 5) {
                      pageNumber = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = idx + 1;
                    } else if (currentPage >= paginationInfo.totalPages - 2) {
                      pageNumber = paginationInfo.totalPages - 4 + idx;
                    } else {
                      pageNumber = currentPage - 2 + idx;
                    }
                    
                    return (
                      <Button 
                        key={idx}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        className="w-8"
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === paginationInfo.totalPages || paginationInfo.totalPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(paginationInfo.totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
