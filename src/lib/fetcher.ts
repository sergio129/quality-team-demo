/**
 * Fetcher para SWR
 * Este archivo contiene la implementación básica para utilizar con SWR.
 * Incluye manejo de errores básico y parsing JSON con soporte para ETags.
 */

// Cache en memoria para ETags
const etagCache = new Map<string, string>();

/**
 * Fetcher básico para SWR con soporte para ETags
 */
export const fetcher = async (url: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  // Agregar ETag si existe en cache
  const cachedETag = etagCache.get(url);
  if (cachedETag) {
    headers['If-None-Match'] = cachedETag;
  }
  
  const response = await fetch(url, { headers });

  // Manejar 304 Not Modified
  if (response.status === 304) {
    throw new Error('304'); // SWR manejará esto manteniendo los datos en cache
  }

  if (!response.ok) {
    const error = new Error('Ha ocurrido un error al obtener los datos') as Error & {
      info: any;
      status: number;
    };
    error.info = await response.json().catch(() => ({}));
    error.status = response.status;
    throw error;
  }
  
  // Guardar ETag para futuras requests
  const etag = response.headers.get('ETag');
  if (etag) {
    etagCache.set(url, etag);
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
