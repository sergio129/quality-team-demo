'use client';

import { useState, useEffect } from 'react';
import { getVacationsDirectly } from '../actions/vacationActions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function VacationsList() {
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadVacations() {
      try {
        setLoading(true);
        const data = await getVacationsDirectly();
        setVacations(data);
        setError(null);
      } catch (err) {
        console.error('Error al cargar vacaciones:', err);
        setError('No se pudieron cargar las vacaciones. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    }

    loadVacations();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Cargando vacaciones...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500 text-center">{error}</div>;
  }

  if (!vacations || vacations.length === 0) {
    return <div className="p-4 text-center">No hay vacaciones registradas.</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Vacaciones (Acceso directo a PostgreSQL)</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Analista ID</th>
              <th className="px-4 py-2 border">Tipo</th>
              <th className="px-4 py-2 border">Fecha inicio</th>
              <th className="px-4 py-2 border">Fecha fin</th>
              <th className="px-4 py-2 border">Descripción</th>
            </tr>
          </thead>
          <tbody>
            {vacations.map((vacation) => (
              <tr key={vacation.id}>
                <td className="px-4 py-2 border">{vacation.analystId}</td>
                <td className="px-4 py-2 border">{vacation.type}</td>
                <td className="px-4 py-2 border">
                  {format(new Date(vacation.startDate), 'dd/MM/yyyy', { locale: es })}
                </td>
                <td className="px-4 py-2 border">
                  {format(new Date(vacation.endDate), 'dd/MM/yyyy', { locale: es })}
                </td>
                <td className="px-4 py-2 border">{vacation.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-gray-500">
        Los datos se obtienen directamente desde PostgreSQL usando Server Actions.
      </p>
    </div>
  );
}
