import { NextRequest, NextResponse } from 'next/server';
import { projectService } from '@/services/projectService';

export async function GET() {
    const projects = await projectService.getAllProjects();
    return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
    const project = await req.json();
    const success = await projectService.saveProject(project);
    if (success) {
        return NextResponse.json({ message: 'Project created successfully' });
    }
    return NextResponse.json({ message: 'Error creating project' }, { status: 500 });
}

export async function PUT(req: NextRequest) {
    const { idJira, project } = await req.json();
    const success = await projectService.updateProject(idJira, project);
    if (success) {
        return NextResponse.json({ message: 'Project updated successfully' });
    }
    return NextResponse.json({ message: 'Error updating project' }, { status: 500 });
}

export async function DELETE(req: NextRequest) {
    const { idJira } = await req.json();
    const success = await projectService.deleteProject(idJira);
    if (success) {
        return NextResponse.json({ message: 'Project deleted successfully' });
    }
    return NextResponse.json({ message: 'Error deleting project' }, { status: 500 });
}
