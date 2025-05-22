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
          </DialogHeader>          <div className="space-y-4 pt-2">
            <div className="border rounded-md p-3 space-y-2">
              <h3 className="font-medium">Cálculo de Calidad (Fórmula Actualizada)</h3>
              <p className="text-sm text-gray-600">
                La calidad se calcula utilizando esta fórmula:
              </p>
              <div className="bg-gray-100 p-2 rounded text-sm my-1">
                Calidad = 100 - (totalDefectos / totalCasosDisenados) * 100
              </div>
              <p className="text-sm text-gray-600">
                Ejemplos:
              </p>
              <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
                <li>Para un plan con 3 casos y 1 defecto: 100 - (1/3)*100 = <strong>67%</strong></li>
                <li>Para un plan con 10 casos y 0 defectos: 100 - (0/10)*100 = <strong>100%</strong></li>
                <li>Para un plan con 5 casos y 3 defectos: 100 - (3/5)*100 = <strong>40%</strong></li>
              </ul>
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
