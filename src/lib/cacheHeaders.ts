import crypto from 'crypto';
import { NextRequest } from 'next/server';

export interface CacheOptions {
    maxAge?: number;
    sMaxAge?: number;
    staleWhileRevalidate?: number;
    isPrivate?: boolean;
    mustRevalidate?: boolean;
    noCache?: boolean;
    immutable?: boolean;
}

/**
 * Genera un ETag basado en el contenido proporcionado
 * @param data Los datos para generar el hash
 * @returns ETag formateado
 */
export function generateETag(data: any): string {
    const content = JSON.stringify(data);
    return `"${crypto.createHash('md5').update(content).digest('hex')}"`;
}

/**
 * Verifica si el cliente tiene una versión en caché válida
 * @param request Request del cliente
 * @param etag ETag actual del contenido
 * @returns true si el contenido no ha cambiado
 */
export function isNotModified(request: NextRequest, etag: string): boolean {
    const ifNoneMatch = request.headers.get('If-None-Match');
    return ifNoneMatch === etag;
}

/**
 * Genera headers de cache HTTP optimizados
 * @param etag ETag para validación de cache
 * @param options Opciones de cache personalizadas
 * @returns Object con headers de cache
 */
export function getCacheHeaders(etag: string, options: CacheOptions = {}): Record<string, string> {
    const {
        maxAge = 60,
        sMaxAge = 120,
        staleWhileRevalidate = 300,
        isPrivate = false,
        mustRevalidate = false,
        noCache = false,
        immutable = false
    } = options;

    const headers: Record<string, string> = {
        'ETag': etag,
        'Vary': 'Accept-Encoding, Authorization, Accept-Language',
        'X-Content-Type-Options': 'nosniff',
    };

    if (noCache) {
        headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        headers['Pragma'] = 'no-cache';
        headers['Expires'] = '0';
    } else {
        const cacheType = isPrivate ? 'private' : 'public';
        const revalidate = mustRevalidate ? ', must-revalidate' : '';
        const immutableFlag = immutable ? ', immutable' : '';
        
        headers['Cache-Control'] = `${cacheType}, max-age=${maxAge}${sMaxAge ? `, s-maxage=${sMaxAge}` : ''}, stale-while-revalidate=${staleWhileRevalidate}${revalidate}${immutableFlag}`;
    }

    return headers;
}

/**
 * Headers de cache para datos que cambian frecuentemente (proyectos, casos de prueba)
 */
export function getFrequentDataHeaders(etag: string, hasFilters = false): Record<string, string> {
    return getCacheHeaders(etag, {
        maxAge: hasFilters ? 30 : 60,
        sMaxAge: hasFilters ? 60 : 120,
        staleWhileRevalidate: 300,
        isPrivate: hasFilters,
        mustRevalidate: hasFilters
    });
}

/**
 * Headers de cache para datos estáticos o que raramente cambian (usuarios, equipos)
 */
export function getStaticDataHeaders(etag: string): Record<string, string> {
    return getCacheHeaders(etag, {
        maxAge: 300, // 5 minutos
        sMaxAge: 600, // 10 minutos
        staleWhileRevalidate: 1800, // 30 minutos
        isPrivate: false
    });
}

/**
 * Headers de cache para datos sensibles que no deben cachearse
 */
export function getNoCache(): Record<string, string> {
    return getCacheHeaders('', { noCache: true });
}

/**
 * Headers de cache para assets inmutables
 */
export function getImmutableHeaders(etag: string): Record<string, string> {
    return getCacheHeaders(etag, {
        maxAge: 31536000, // 1 año
        sMaxAge: 31536000,
        immutable: true,
        isPrivate: false
    });
}
