import { NextRequest, NextResponse } from 'next/server';
import { TeamService } from '@/services/teamService';
import { Team } from '@/models/Team';
import { generateETag, isNotModified, getStaticDataHeaders } from '@/lib/cacheHeaders';

const teamService = new TeamService();

export async function GET(request: NextRequest) {
    try {
        const teams = await teamService.getAllTeams();
        
        // Generar ETag para cache
        const etag = generateETag(teams);
        
        // Verificar si el cliente tiene una versión válida en cache
        if (isNotModified(request, etag)) {
            return new Response(null, { status: 304 });
        }
        
        const cacheHeaders = getStaticDataHeaders(etag);
        
        return NextResponse.json(teams, { headers: cacheHeaders });
    } catch (error) {
        return NextResponse.json({ error: 'Error getting teams' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const team: Team = await request.json();
        const savedTeam = await teamService.saveTeam(team);
        return NextResponse.json(savedTeam);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating team' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, ...team }: Team & { id: string } = await request.json();
        const updatedTeam = await teamService.updateTeam(id, team);
        if (!updatedTeam) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }
        return NextResponse.json(updatedTeam);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating team' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        const deleted = await teamService.deleteTeam(id);
        if (!deleted) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting team' }, { status: 500 });
    }
}
