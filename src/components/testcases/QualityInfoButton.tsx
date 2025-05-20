'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription
} from '@/components/ui/dialog';

export default function QualityInfoButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-6 w-6 rounded-full"
        title="Información sobre el cálculo de calidad"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cálculo de Calidad</DialogTitle>
            <DialogDescription className="text-gray-500">
              Existen dos métodos diferentes para calcular la calidad en la aplicación
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="border rounded-md p-3 space-y-2">
              <h3 className="font-medium">1. Método en la Interfaz (86.33%)</h3>
              <p className="text-sm text-gray-600">
                Considera cuatro factores con distintos pesos:
              </p>
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Cobertura de ejecución (35%)</li>
                <li>Efectividad (35%)</li>
                <li>Densidad de defectos (20%)</li>
                <li>Diversidad de tipos de prueba (10%)</li>
              </ul>
            </div>

            <div className="border rounded-md p-3 space-y-2">
              <h3 className="font-medium">2. Método en el PDF (67%)</h3>
              <p className="text-sm text-gray-600">
                Utiliza una fórmula más simple:
              </p>
              <div className="bg-gray-100 p-2 rounded text-sm my-1">
                Calidad = 100 - (totalDefectos / totalCasosDisenados) * 100
              </div>
              <p className="text-sm text-gray-600">
                Para un plan con 3 casos y 1 defecto: 100 - (1/3)*100 = 67%
              </p>
            </div>

            <div className="border rounded-md p-3 bg-gray-50">
              <h3 className="font-medium">Nota sobre "N/A"</h3>
              <p className="text-sm text-gray-600">
                Cuando un proyecto no tiene casos de prueba asociados, se muestra "N/A" (No Aplicable) 
                ya que no es posible evaluar su calidad sin datos.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
