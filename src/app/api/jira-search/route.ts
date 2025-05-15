import { NextResponse } from 'next/server';

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
        }

        // 5. Generar sugerencias para prefijos que coincidan
        if (matchingPrefixes.length > 0 && !isNumber && !isFullId && !isPartialId) {
            matchingPrefixes.forEach(prefix => {
                // Generar 5 IDs aleatorios para cada prefijo
                for (let i = 0; i < 5; i++) {
                    const num = Math.floor(Math.random() * 9000) + 1000;
                    results.push(`${prefix}-${num}`);
                }
            });
        }

        // Ordenar y eliminar duplicados
        return NextResponse.json([...new Set(results)].sort());
    } catch (error) {
        console.error('Error searching JIRA IDs:', error);
        return NextResponse.json({ error: 'Error al buscar IDs de JIRA' }, { status: 500 });
    }
}
