'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TeamFilterProps {
  onFilterChange: (filter: string) => void;
  currentFilter: string;
}

export function TeamFilter({ onFilterChange, currentFilter }: TeamFilterProps) {
  const filters = [
    { id: 'all', label: 'Todos' },
    { id: 'active', label: 'Con proyectos activos' },
    { id: 'delayed', label: 'Con proyectos retrasados' },
    { id: 'empty', label: 'Sin proyectos' }
  ];

  return (
    <div className="mb-4">
      <div className="flex flex-wrap gap-2">
        {filters.map(filter => (
          <Button
            key={filter.id}
            variant={currentFilter === filter.id ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(filter.id)}
            className={
              currentFilter === filter.id 
                ? ''
                : 'hover:bg-gray-100'
            }
          >
            {filter.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
