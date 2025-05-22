'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Project } from '@/models/Project';
import { Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectStatusButtonProps {
  project: Project;
  onStatusChange: (projectId: string, newStatus: string) => Promise<boolean>;
}

export function ProjectStatusButton({ project, onStatusChange }: ProjectStatusButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  
  // Determinar el estado actual
  const currentStatus = project.estado || project.estadoCalculado || 'Por Iniciar';
  
  // Verificamos si el proyecto ya está certificado (no se puede cambiar)
  const isCertified = currentStatus === 'Certificado';
  
  // Opciones de estado disponibles (excluyendo el estado actual)
  const availableStatuses = ['Por Iniciar', 'En Progreso', 'Certificado'].filter(
    status => status !== currentStatus
  );

  const handleStatusChange = async (newStatus: string) => {
    if (isCertified) return; // No permitir cambios si ya está certificado
    
    setIsLoading(true);
    setLoadingStatus(newStatus);
    try {
      // Asegurémonos de que tenemos un id válido
      const id = project.id || project.idJira || '';
      if (!id) {
        throw new Error('No se encontró el ID del proyecto');
      }
      
      const success = await onStatusChange(id, newStatus);
      
      if (success) {
        toast.success(`Estado del proyecto actualizado a "${newStatus}"`);
        setIsOpen(false);
      } else {
        toast.error('No se pudo actualizar el estado del proyecto');
      }
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
      toast.error('Error al cambiar el estado del proyecto');
    } finally {
      setIsLoading(false);
      setLoadingStatus(null);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="ml-1 h-7 w-7 p-0"
        onClick={() => setIsOpen(true)}
        disabled={isCertified}
        title={isCertified ? "Proyecto certificado - No se puede cambiar el estado" : "Cambiar estado"}
      >
        <Pencil className="h-3.5 w-3.5 text-gray-500" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Proyecto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <p className="text-sm mb-2">Proyecto: <span className="font-medium">{project.nombre || project.proyecto}</span></p>
              <p className="text-sm mb-4">Estado actual: 
                <span className={`font-medium ml-1 px-1.5 py-0.5 rounded-full ${
                  currentStatus === 'En Progreso' ? 'bg-blue-100 text-blue-800' :
                  currentStatus === 'Por Iniciar' ? 'bg-amber-100 text-amber-800' :
                  currentStatus === 'Certificado' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentStatus}
                </span>
              </p>
              
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Selecciona el nuevo estado:</p>                <div className="flex flex-wrap gap-2">
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
                        ${isLoading && loadingStatus === status ? 'opacity-80 cursor-not-allowed' : ''}
                      `}
                    >
                      {isLoading && loadingStatus === status ? (
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
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
