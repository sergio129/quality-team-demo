import { NextResponse } from 'next/server';
import { QAAnalystService } from '@/services/qaAnalystService';
import { QAAnalyst } from '@/models/QAAnalyst';

const analystService = new QAAnalystService();

export async function GET() {
    try {
        const analysts = await analystService.getAllAnalysts();
        return NextResponse.json(analysts);
    } catch (error) {
        return NextResponse.json({ error: 'Error getting analysts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const analyst: QAAnalyst = await request.json();
        const savedAnalyst = await analystService.saveAnalyst(analyst);
        if (!savedAnalyst) {
            return NextResponse.json({ error: 'Cell not found' }, { status: 404 });
        }
        return NextResponse.json(savedAnalyst);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating analyst' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, ...analyst }: QAAnalyst & { id: string } = await request.json();
        const updatedAnalyst = await analystService.updateAnalyst(id, analyst);
        if (!updatedAnalyst) {
            return NextResponse.json({ error: 'Analyst not found or invalid cell' }, { status: 404 });
        }
        return NextResponse.json(updatedAnalyst);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating analyst' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        const deleted = await analystService.deleteAnalyst(id);
        if (!deleted) {
            return NextResponse.json({ error: 'Analyst not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Error deleting analyst' }, { status: 500 });
    }
}
