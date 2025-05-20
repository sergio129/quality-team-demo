import { NextRequest, NextResponse } from 'next/server';
import { testCaseService } from '@/services/testCaseService';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    
    if (!projectId) {
        return NextResponse.json(
            { message: 'Se requiere el ID del proyecto' },
            { status: 400 }
        );
    }
    
    const stats = await testCaseService.getTestCaseStatsByProject(projectId);
    return NextResponse.json(stats);
}
