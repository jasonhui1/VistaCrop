import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage/server';

/**
 * GET /api/images/{imageId}/crops/{cropId}
 * Get a single crop with its preview image data
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ imageId: string; cropId: string }> }
) {
    const { cropId } = await params;
    const storage = getStorageAdapter();
    const crop = await storage.getCrop(cropId);

    if (!crop) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    return NextResponse.json(crop);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ imageId: string; cropId: string }> }
) {
    const { imageId, cropId } = await params;
    const body = await request.json();
    const storage = getStorageAdapter();

    try {
        const updated = await storage.updateCrop(imageId, cropId, body);
        return NextResponse.json(updated);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Crop not found';
        return NextResponse.json({ error: message }, { status: 404 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ imageId: string; cropId: string }> }
) {
    const { imageId, cropId } = await params;
    const storage = getStorageAdapter();
    const result = await storage.deleteCrop(imageId, cropId);

    if (!result.success) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
