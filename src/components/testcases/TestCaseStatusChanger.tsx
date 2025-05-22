'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { TestCase } from '@/models/TestCase';
import { updateTestCaseStatus } from '@/hooks/useTestCases';

interface TestCaseStatusChangerProps {
  testCase: TestCase;
}

export default function TestCaseStatusChanger({ testCase }: TestCaseStatusChangerProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const statusOptions = [
    { value: 'No ejecutado', label: 'No ejecutado', variant: 'outline' },
    { value: 'Exitoso', label: 'Exitoso', variant: 'success' },
    { value: 'Fallido', label: 'Fallido', variant: 'destructive' },
    { value: 'Bloqueado', label: 'Bloqueado', variant: 'warning' },
    { value: 'En progreso', label: 'En progreso', variant: 'default' }
  ];

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === testCase.status) {
      setIsDialogOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await updateTestCaseStatus(
        testCase.id!,
        newStatus,
        testCase.projectId
      );
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error al cambiar el estado:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener la variante correcta según el estado
  const getVariant = (status: string) => {
    switch (status) {
      case 'Exitoso': return 'success';
      case 'Fallido': return 'destructive';
      case 'Bloqueado': return 'warning';
      case 'En progreso': return 'default';
      default: return 'outline';
    }
  };

  return (
    <>
      <Badge 
        variant={getVariant(testCase.status || 'No ejecutado') as any}
        className="cursor-pointer hover:opacity-80"
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
      >
        {testCase.status || 'No ejecutado'}
      </Badge>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Cambiar Estado del Caso de Prueba</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <p><strong>Caso:</strong> {testCase.name}</p>
              <p><strong>Código:</strong> {testCase.codeRef}</p>
              <p><strong>Estado actual:</strong> 
                <Badge variant={getVariant(testCase.status || 'No ejecutado') as any} className="ml-2">
                  {testCase.status || 'No ejecutado'}
                </Badge>
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Selecciona el nuevo estado:</p>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map(status => (
                  <Button
                    key={status.value}
                    variant={status.variant as any}
                    className={`justify-start ${status.value === testCase.status ? 'ring-2 ring-primary' : ''}`}
                    disabled={isLoading}
                    onClick={() => handleStatusChange(status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
