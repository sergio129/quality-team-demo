/**
 * Fetcher para SWR
 * Este archivo contiene la implementación básica para utilizar con SWR.
 * Incluye manejo de errores básico y parsing JSON.
 */

/**
 * Fetcher básico para SWR
 */
export const fetcher = async (url: string) => {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error('Ha ocurrido un error al obtener los datos') as Error & {
      info: any;
      status: number;
    };
    error.info = await response.json().catch(() => ({}));
    error.status = response.status;
    throw error;
  }

  return response.json();
};

/**
 * Fetcher con opciones para SWR
 */
export const fetcherWithOptions = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = new Error('Ha ocurrido un error al obtener los datos') as Error & {
      info: any;
      status: number;
    };
    error.info = await response.json().catch(() => ({}));
    error.status = response.status;
    throw error;
  }

  return response.json();
};
