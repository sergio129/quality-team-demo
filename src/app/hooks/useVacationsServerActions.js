'use client';

import { useState, useEffect } from 'react';
import { getVacationsDirectly, getVacationsByAnalystDirectly } from '../actions/vacationActions';

/**
 * Hook para obtener las vacaciones directamente desde server actions
 * Reemplaza la implementación anterior de useAnalystVacations para pruebas
 */
export function useVacationsServerActions() {
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVacations() {
      try {
        setLoading(true);
        const data = await getVacationsDirectly();
        setVacations(data);
      } catch (err) {
        console.error('Error al cargar vacaciones:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchVacations();
  }, []);

  return {
    vacations,
    loading,
    error
  };
}

/**
 * Hook para obtener las vacaciones de un analista específico
 * @param analystId ID del analista
 */
export function useAnalystVacationsByAnalystServerActions(analystId) {
  const [vacations, setVacations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchVacations() {
      try {
        setLoading(true);
        const data = await getVacationsByAnalystDirectly(analystId);
        setVacations(data);
      } catch (err) {
        console.error(`Error al cargar vacaciones para analista ${analystId}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (analystId) {
      fetchVacations();
    }
  }, [analystId]);

  return {
    vacations,
    loading,
    error
  };
}
