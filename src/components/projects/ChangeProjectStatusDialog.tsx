'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Project } from '@/models/Project';

interface ChangeProjectStatusDialogProps {
  project: Project;
  onStatusChange: (projectId: string, newStatus: string) => Promise<boolean>;
}

export function ChangeProjectStatusDialog({ project, onStatusChange }: ChangeProjectStatusDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(project.estadoCalculado || 'Por Iniciar');
  
  // Verificamos si el proyecto ya está certificado (no se puede cambiar)
  const isCertified = project.estadoCalculado === 'Certificado';
  
  // Opciones de estado disponibles (excluyendo el estado actual)
  const availableStatuses = ['Por Iniciar', 'En Progreso', 'Certificado'].filter(
    status => status !== currentStatus
  );

  const handleStatusChange = async (newStatus: string) => {
    if (isCertified) return; // No permitir cambios si ya está certificado
    
    setIsLoading(true);
    try {
      const success = await onStatusChange(project.id || project.idJira, newStatus);
      if (success) {
        setCurrentStatus(newStatus);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isCertified}
          className={`px-2 py-1 text-xs ${isCertified ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Cambiar Estado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cambiar Estado del Proyecto</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <p className="text-sm mb-2">Proyecto: <span className="font-medium">{project.nombre || project.proyecto}</span></p>
            <p className="text-sm mb-4">Estado actual: <span className="font-medium">{currentStatus}</span></p>
            
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
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
