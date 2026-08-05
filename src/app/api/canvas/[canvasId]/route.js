import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';

export async function GET(request, { params }) {
    const { canvasId } = await params;
    const storage = getStorageAdapter();
    const canvas = await storage.getCanvas(canvasId);

    if (!canvas) {
        return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    return NextResponse.json(canvas);
}

export async function PUT(request, { params }) {
    const { canvasId } = await params;
    const body = await request.json();
    const storage = getStorageAdapter();

    try {
        const updated = await storage.saveCanvas(canvasId, body.composition, body.placedItems);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message || 'Canvas not found' }, { status: 404 });
    }
}

export async function DELETE(request, { params }) {
    const { canvasId } = await params;
    const storage = getStorageAdapter();
    await storage.deleteCanvas(canvasId);
    return NextResponse.json({ success: true });
}
