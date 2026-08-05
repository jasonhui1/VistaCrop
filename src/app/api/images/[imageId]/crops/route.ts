import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ imageId: string }> }
) {
    const { imageId } = await params;
    const storage = getStorageAdapter();
    const crops = await storage.loadCrops(imageId);
    return NextResponse.json({ crops });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ imageId: string }> }
) {
    const { imageId } = await params;
    const body = await request.json();
    const { crops } = body;

    if (!Array.isArray(crops)) {
        return NextResponse.json({ error: 'Invalid crops data' }, { status: 400 });
    }

    try {
        const storage = getStorageAdapter();
        const result = await storage.saveCrops(imageId, crops);
        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to save crops';
        return NextResponse.json({ error: message }, { status: 400 });
    }
}
