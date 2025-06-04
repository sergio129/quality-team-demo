'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Project } from '@/models/Project';
import { changeProjectStatus } from '@/hooks/useProjects';

interface ChangeProjectStatusDialogProps {
  project: Project;
  onClose: () => void;
  isOpen: boolean;
}

export function ChangeProjectStatusDialog({ project, onClose, isOpen }: ChangeProjectStatusDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Determinamos el estado actual con prioridad para mostrar
  const manualStatus = project.estado || '';
  const calculatedStatus = project.estadoCalculado || 'Por Iniciar';
  
  // El estado a mostrar en la interfaz (preferimos el manual si existe)
  const displayStatus = manualStatus || calculatedStatus;
  
  // Verificamos si el proyecto ya está certificado (no se puede cambiar)
  const isCertified = calculatedStatus === 'Certificado' || manualStatus?.toLowerCase() === 'certificado';
  
  // Opciones de estado disponibles (excluyendo el estado actual)
  const availableStatuses = ['Por Iniciar', 'En Progreso', 'Certificado'].filter(
    status => status.toLowerCase() !== displayStatus.toLowerCase()
  );
  
  // Función para obtener el color de fondo según el estado
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('certificado') || statusLower === 'completado' || 
        statusLower === 'terminado' || statusLower === 'finalizado') {
      return 'bg-green-50 text-green-800 border-green-200';
    } else if (statusLower === 'retrasado') {
      return 'bg-red-50 text-red-800 border-red-200';
    } else if (statusLower.includes('progreso') || statusLower === 'en proceso' || 
               statusLower === 'en progreso' || statusLower === 'pruebas') {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    } else {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
  };
  
  const handleStatusChange = async (newStatus: string) => {
    if (isCertified) return; // No permitir cambios si ya está certificado
    
    setIsLoading(true);    
    try {
      // Asegurémonos de que tenemos un idJira válido
      if (!project.idJira) {
        throw new Error('No se encontró el ID de Jira del proyecto');
      }
      
      console.log(`Cambiando estado del proyecto ${project.idJira} a ${newStatus}`);
      
      // Pasamos tanto el ID como el idJira para asegurar que la API pueda identificar el proyecto
      await changeProjectStatus(project.id || '', newStatus, project.idJira);
      
      // Cerrar el diálogo
      onClose();
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent className="sm:max-w-md fixed z-50">
        <DialogHeader>
          <DialogTitle>Cambiar Estado del Proyecto</DialogTitle>
        </DialogHeader>        <div className="grid gap-4 py-4">
          <div>
            <p className="text-sm mb-2">Proyecto: <span className="font-medium">{project.nombre || project.proyecto}</span></p>
            <p className="text-sm mb-1">ID Jira: <span className="font-medium">{project.idJira}</span></p>
            
            <div className="flex flex-col gap-2 mt-3 mb-4">
              <p className="text-sm">Estado actual:</p>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(displayStatus)}`}>
                  {displayStatus}
                </span>
                {project.estadoCalculado && project.estado && project.estadoCalculado !== project.estado && (
                  <span className="text-xs text-gray-500">
                    (Estado calculado: {project.estadoCalculado})
                  </span>
                )}
              </div>
              
              {project.fechaCertificacion && (
                <p className="text-xs text-gray-600 mt-1">
                  Certificado el {new Date(project.fechaCertificacion).toLocaleDateString('es-ES')}
                </p>
              )}
            </div>
            
            {isCertified ? (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                <p className="text-sm text-green-800">
                  Este proyecto ya está certificado. No se puede cambiar su estado.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Selecciona el nuevo estado:</p>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map((status) => (
                    <Button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={isLoading}
                      variant="outline"
                      className={`
                        ${status === 'Por Iniciar' ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200' : 
                          status === 'En Progreso' ? 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-green-50 hover:bg-green-100 text-green-800 border-green-200'}
                      `}
                    >
                      {isLoading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Actualizando...
                        </>
                      ) : status}
                    </Button>
                  ))}
                </div>
                  {availableStatuses.includes('Certificado') && (
                  <p className="text-xs text-gray-600 mt-1">
                    Al cambiar a Certificado, se registrará la fecha de certificación actual.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
