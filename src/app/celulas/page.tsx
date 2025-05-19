import React from 'react';
import { DataTable } from '@/components/cells/CellTable';
import { AddCellButton } from '@/components/cells/AddCellButton';

export default function CellsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        {/* Encabezado con título y descripción */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Células</h1>
            <p className="text-muted-foreground">
              Administre las células de trabajo y sus asignaciones a equipos
            </p>
          </div>
          <AddCellButton />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tabla principal (ocupa 3/4 del ancho en desktop) */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Listado de Células</h2>
              </div>
              <div className="p-4">
                <DataTable />
              </div>
            </div>
          </div>

          {/* Panel lateral (ocupa 1/4 del ancho en desktop) */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="text-lg font-medium mb-4">Información</h2>
              <div className="text-sm text-muted-foreground">
                <p>
                  Las células son unidades de trabajo específicas dentro de cada equipo.
                  Permiten organizar las tareas y proyectos en grupos temáticos.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Cree células para categorizar proyectos</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Asigne cada célula a un equipo específico</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Agrupe proyectos relacionados en la misma célula</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg shadow-sm border border-green-100 p-4">
              <h3 className="font-medium text-green-800 mb-2">Próximas funcionalidades</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Asignación de analistas a células</li>
                <li>• Métricas de rendimiento por célula</li>
                <li>• Visualización de proyectos por célula</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
