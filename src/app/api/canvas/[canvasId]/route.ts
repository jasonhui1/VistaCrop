import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ canvasId: string }> }
) {
    const { canvasId } = await params;
    const storage = getStorageAdapter();
    const canvas = await storage.getCanvas(canvasId);

    if (!canvas) {
        return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    return NextResponse.json(canvas);
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ canvasId: string }> }
) {
    const { canvasId } = await params;
    const body = await request.json();
    const storage = getStorageAdapter();

    try {
        const updated = await storage.saveCanvas(canvasId, body.composition, body.placedItems);
        return NextResponse.json(updated);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Canvas not found';
        return NextResponse.json({ error: message }, { status: 404 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ canvasId: string }> }
) {
    const { canvasId } = await params;
    const storage = getStorageAdapter();
    await storage.deleteCanvas(canvasId);
    return NextResponse.json({ success: true });
}
