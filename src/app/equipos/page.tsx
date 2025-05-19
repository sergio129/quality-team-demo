import React from 'react';
import { DataTable } from '@/components/teams/TeamTable';
import { AddTeamButton } from '@/components/teams/AddTeamButton';

export default function TeamsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid gap-6">
        {/* Encabezado con título y descripción */}
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold">Gestión de Equipos</h1>
            <p className="text-muted-foreground">
              Administre los equipos de trabajo y sus integrantes
            </p>
          </div>
          <AddTeamButton />
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Tabla principal (ocupa 3/4 del ancho en desktop) */}
          <div className="md:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium">Listado de Equipos</h2>
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
                  Los equipos permiten organizar los proyectos y asignar analistas
                  de calidad a diferentes grupos de trabajo.
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Cree equipos para cada área funcional</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Asigne miembros a cada equipo según su especialidad</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    <span>Gestione los proyectos asociados a cada equipo</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 p-4">
              <h3 className="font-medium text-blue-800 mb-2">Próximas funcionalidades</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Asignación de miembros a equipos</li>
                <li>• Visualización de carga de trabajo por equipo</li>
                <li>• Métricas de rendimiento por equipo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
