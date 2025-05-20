'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { mutate } from 'swr';

export default function UpdateQualityButton() {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleUpdateQuality = async () => {
    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/test-plans/update-quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('La calidad de los planes ha sido actualizada correctamente');
        // Refrescar los datos para mostrar los cambios
        mutate('/api/test-plans');
      } else {
        toast.error(`Error al actualizar la calidad: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al actualizar la calidad:', error);
      toast.error('Ha ocurrido un error al actualizar la calidad');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleUpdateQuality}
      disabled={isUpdating}
      className="flex items-center gap-1"
    >
      {isUpdating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Actualizando...</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          <span>Actualizar Calidad</span>
        </>
      )}
    </Button>
  );
}
