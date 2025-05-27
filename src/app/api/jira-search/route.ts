import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json([]);
    }

    try {
        const validPrefixes = [
            'SRCA', 'BCGT', 'KOIN', 'SRSS', 'BCBH', 'BCCR', 'SFSC', 'BCGL',
            'ALPN', 'WOMD', 'EGNA', 'BCUT', 'LNAR', 'NTCN', 'SVSF', 'SBSF'
        ];
        
        const results: string[] = [];
        const searchLower = query.toLowerCase();
        
        // 1. Búsqueda por prefijo completo (ej: "SRCA")
        const matchingPrefixes = validPrefixes.filter(prefix => 
            prefix.toLowerCase().startsWith(searchLower)
        );

        // 2. Búsqueda por ID completo (ej: "SRCA-1234")
        const isFullId = /^[A-Za-z]+-\d+$/.test(query);
        if (isFullId) {
            const [prefix] = query.split('-');
            if (validPrefixes.some(p => p.toLowerCase() === prefix.toLowerCase())) {
                results.push(query.toUpperCase());
            }
        }

        // 3. Búsqueda por número (ej: "1234")
        const isNumber = /^\d+$/.test(query);
        if (isNumber) {
            validPrefixes.forEach(prefix => {
                results.push(`${prefix}-${query.padStart(4, '0')}`);
            });
        }

        // 4. Búsqueda por prefijo parcial con números (ej: "SRCA-12")
        const isPartialId = /^[A-Za-z]+-\d+$/.test(query);
        if (isPartialId && !isFullId) {
            const [prefix, number] = query.split('-');
            const matchingPrefix = validPrefixes.find(p => p.toLowerCase() === prefix.toLowerCase());
            if (matchingPrefix) {
                for (let i = 0; i < 10; i++) {
                    const paddedNum = (parseInt(number) * 10 + i).toString().padStart(4, '0');
                    results.push(`${matchingPrefix}-${paddedNum}`);
                }
            }
        }        // 5. Generar sugerencias para prefijos que coincidan
        if (matchingPrefixes.length > 0 && !isNumber && !isFullId && !isPartialId) {
            matchingPrefixes.forEach(prefix => {
                // Generar 5 IDs aleatorios para cada prefijo
                for (let i = 0; i < 5; i++) {
                    // Usar crypto.randomBytes para generar números aleatorios criptográficamente seguros
                    try {
                        // Generar un número entre 1000 y 9999 usando crypto
                        const buffer = crypto.randomBytes(2); // 2 bytes = 16 bits
                        const randomValue = buffer.readUInt16BE(0);
                        const num = 1000 + (randomValue % 9000);
                        
                        results.push(`${prefix}-${num}`);
                    } catch (cryptoError) {                        // Fallback en caso de que crypto no esté disponible
                        // Aunque Math.random no es criptográficamente seguro, 
                        // lo hacemos más robusto combinando timestamp y técnicas adicionales
                        console.warn("Crypto API no disponible, usando alternativa mejorada");
                        
                        // Usar una combinación de fuentes de entropía
                        const timestamp = Date.now();
                        const performanceValue = typeof performance !== 'undefined' ? 
                            performance.now() * 1000 : 0;
                        
                        // Combinar varias fuentes para mejorar la aleatoriedad
                        let randomValue = timestamp ^ performanceValue;
                        
                        // Añadir un segundo valor pseudo-aleatorio y aplicar operaciones para mejorar dispersión
                        const randomValue2 = (timestamp * 31) ^ (Date.now() * 17);
                        randomValue = (randomValue * 7919) ^ (randomValue2 * 104729); // Números primos grandes
                        
                        // Asegurar que esté en el rango requerido (1000-9999)
                        const num = 1000 + (Math.abs(randomValue) % 9000);
                        results.push(`${prefix}-${num}`);
                    }
                }
            });
        }        // Ordenar y eliminar duplicados
        // Usamos String.localeCompare para garantizar una ordenación alfabética confiable
        return NextResponse.json([...new Set(results)].sort((a, b) => a.localeCompare(b)));
    } catch (error) {
        console.error('Error searching JIRA IDs:', error);
        return NextResponse.json({ error: 'Error al buscar IDs de JIRA' }, { status: 500 });
    }
}
