import { NextResponse } from 'next/server';
import { CellService } from '@/services/cellService';
import { Cell } from '@/models/Cell';

const cellService = new CellService();

export async function GET() {
    try {
        const cells = await cellService.getAllCells();
        return NextResponse.json(cells);
    } catch (error) {
        return NextResponse.json({ error: 'Error getting cells' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cell: Cell = await request.json();
        const savedCell = await cellService.saveCell(cell);
        if (!savedCell) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }
        return NextResponse.json(savedCell);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating cell' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, ...cell }: Cell & { id: string } = await request.json();
        const updatedCell = await cellService.updateCell(id, cell);
        if (!updatedCell) {
            return NextResponse.json({ error: 'Cell not found or invalid team' }, { status: 404 });
        }
        return NextResponse.json(updatedCell);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating cell' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        const deleted = await cellService.deleteCell(id);
        if (!deleted) {
            return NextResponse.json({ error: 'Cell not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting cell' }, { status: 500 });
    }
}
