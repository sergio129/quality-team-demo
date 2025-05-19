import React from 'react';
import { DataTable } from '@/components/analysts/AnalystTable';
import { AddAnalystButton } from '@/components/analysts/AddAnalystButton';

export default function AnalystsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Analistas QA</h1>
        <AddAnalystButton />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3">
          <DataTable />
        </div>
        <div className="md:col-span-1">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6 flex flex-col space-y-4">
              <h3 className="text-lg font-semibold">Información</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Analistas QA</h4>
                  <p className="text-sm text-muted-foreground">
                    Gestione la información de los analistas QA, sus habilidades, células asignadas y disponibilidad.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Roles</h4>
                  <p className="text-sm text-muted-foreground">
                    Los analistas pueden tener roles Senior, Semi Senior o Junior, cada uno con diferentes niveles de responsabilidad.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium">Gestión de Competencias</h4>
                  <p className="text-sm text-muted-foreground">
                    Administre las habilidades técnicas y certificaciones de cada analista para mejor asignación de recursos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
