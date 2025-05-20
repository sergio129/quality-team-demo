'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { mutate } from 'swr';

export default function SyncTestPlansButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  
  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const response = await fetch('/api/test-plans/sync-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Planes de prueba actualizados correctamente');
        
        // Mutate SWR cache para reflejar los cambios sin necesidad de recargar
        mutate('/api/test-plans');
      } else {
        toast.error('Error al actualizar planes de prueba');
      }
    } catch (error) {
      console.error('Error al sincronizar planes de prueba:', error);
      toast.error('Error de conexión al actualizar planes de prueba');
    } finally {
      setIsSyncing(false);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleSync}
      disabled={isSyncing}
      className="flex items-center gap-1"
    >
      {isSyncing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Actualizando...</span>
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4" />
          <span>Sincronizar planes</span>
        </>
      )}
    </Button>
  );
}
