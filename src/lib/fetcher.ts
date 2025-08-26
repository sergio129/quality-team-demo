/**
 * Fetcher para SWR
 * Este archivo contiene la implementación básica para utilizar con SWR.
 * Incluye manejo de errores básico y parsing JSON con soporte para ETags.
 */

// Cache en memoria para ETags y datos
const etagCache = new Map<string, string>();
const dataCache = new Map<string, any>();

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

  // Manejar 304 Not Modified - retornar datos cacheados
  if (response.status === 304) {
    const cachedData = dataCache.get(url);
    if (cachedData) {
      return cachedData; // Retornar datos del cache interno
    }
    // Si no hay datos en cache, hacer request sin ETag
    const freshResponse = await fetch(url, {
      headers: { 'Content-Type': 'application/json' }
    });
    if (freshResponse.ok) {
      const data = await freshResponse.json();
      const newEtag = freshResponse.headers.get('ETag');
      if (newEtag) {
        etagCache.set(url, newEtag);
        dataCache.set(url, data);
      }
      return data;
    }
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
  
  // Obtener los datos
  const data = await response.json();
  
  // Guardar ETag y datos en cache para futuras requests
  const etag = response.headers.get('ETag');
  if (etag) {
    etagCache.set(url, etag);
    dataCache.set(url, data);
  }

  return data;
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
