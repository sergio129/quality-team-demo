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
    { 
      value: 'No ejecutado', 
      label: 'No ejecutado', 
      variant: 'outline',
      className: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 font-medium'
    },
    { 
      value: 'Exitoso', 
      label: 'Exitoso', 
      variant: 'custom',
      className: 'bg-green-200 hover:bg-green-300 text-green-900 border border-green-400 font-medium'
    },
    { 
      value: 'Fallido', 
      label: 'Fallido', 
      variant: 'custom',
      className: 'bg-red-200 hover:bg-red-300 text-red-900 border border-red-400 font-medium'
    },
    { 
      value: 'Bloqueado', 
      label: 'Bloqueado', 
      variant: 'custom',
      className: 'bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-400 font-medium'
    },
    { 
      value: 'En progreso', 
      label: 'En progreso', 
      variant: 'custom',
      className: 'bg-blue-200 hover:bg-blue-300 text-blue-900 border border-blue-400 font-medium'
    }
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
  };  // Función para obtener el estilo correcto según el estado
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Exitoso': 
        return {
          variant: 'custom' as any,
          className: 'bg-green-200 hover:bg-green-300 text-green-900 border border-green-400 font-medium'
        };
      case 'Fallido': 
        return {
          variant: 'custom' as any,
          className: 'bg-red-200 hover:bg-red-300 text-red-900 border border-red-400 font-medium'
        };
      case 'Bloqueado': 
        return {
          variant: 'custom' as any,
          className: 'bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-400 font-medium'
        };
      case 'En progreso': 
        return {
          variant: 'custom' as any,
          className: 'bg-blue-200 hover:bg-blue-300 text-blue-900 border border-blue-400 font-medium'
        };
      default: 
        return {
          variant: 'outline' as any,
          className: 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 font-medium'
        };
    }
  };

  return (
    <>      <Badge 
        variant={getStatusStyle(testCase.status || 'No ejecutado').variant}
        className={`cursor-pointer hover:opacity-80 ${getStatusStyle(testCase.status || 'No ejecutado').className}`}
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
              <p><strong>Código:</strong> {testCase.codeRef}</p>              <p><strong>Estado actual:</strong> 
                <Badge 
                  variant={getStatusStyle(testCase.status || 'No ejecutado').variant}
                  className={`ml-2 ${getStatusStyle(testCase.status || 'No ejecutado').className}`}
                >
                  {testCase.status || 'No ejecutado'}
                </Badge>
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Selecciona el nuevo estado:</p>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map(status => (                  <Button
                    key={status.value}
                    variant={status.variant as any}
                    className={`justify-start text-left ${status.className} ${status.value === testCase.status ? 'ring-2 ring-primary' : ''}`}
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
