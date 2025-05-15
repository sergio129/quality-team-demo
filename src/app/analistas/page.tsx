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
      <DataTable />
    </div>
  );
}
