import React from 'react';
import { DataTable } from '@/components/teams/TeamTable';
import { AddTeamButton } from '@/components/teams/AddTeamButton';

export default function TeamsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Equipos</h1>
        <AddTeamButton />
      </div>
      <DataTable />
    </div>
  );
}
