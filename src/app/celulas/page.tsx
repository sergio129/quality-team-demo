import React from 'react';
import { DataTable } from '@/components/cells/CellTable';
import { AddCellButton } from '@/components/cells/AddCellButton';

export default function CellsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Células</h1>
        <AddCellButton />
      </div>
      <DataTable />
    </div>
  );
}
