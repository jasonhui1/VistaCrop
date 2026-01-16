import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';

export async function GET(request, { params }) {
    const { canvasId } = await params;
    const db = readDb();
    const canvas = (db.canvases || []).find(c => String(c.id) === String(canvasId));

    if (!canvas) {
        return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    return NextResponse.json(canvas);
}

export async function PUT(request, { params }) {
    const { canvasId } = await params;
    const body = await request.json();

    const db = readDb();
    if (!db.canvases) db.canvases = [];

    const index = db.canvases.findIndex(c => String(c.id) === String(canvasId));

    if (index === -1) {
        // Optionally create if not exists, but PUT usually updates
        return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    db.canvases[index] = { ...db.canvases[index], ...body, updatedAt: Date.now() };
    writeDb(db);

    return NextResponse.json(db.canvases[index]);
}

export async function DELETE(request, { params }) {
    const { canvasId } = await params;

    const db = readDb();
    if (!db.canvases) return NextResponse.json({ success: true }); // already empty

    db.canvases = db.canvases.filter(c => String(c.id) !== String(canvasId));
    writeDb(db);

    return NextResponse.json({ success: true });
}
