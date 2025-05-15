import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    if (!query) {
        return NextResponse.json([]);
    }    try {
        // Lista de IDs de JIRA válidos
        const validPrefixes = ['QA', 'DEV', 'SUP'];
        const validNumbers = ['123', '456', '789', '234', '567'];
        
        const mockResults = validPrefixes
            .map(prefix => validNumbers.map(num => `${prefix}-${num}`))
            .flat()
            .filter(id => id.toLowerCase().includes(query.toLowerCase()));

        return NextResponse.json(mockResults);
    } catch (error) {
        console.error('Error searching JIRA IDs:', error);
        return NextResponse.json({ error: 'Error al buscar IDs de JIRA' }, { status: 500 });
    }
}
