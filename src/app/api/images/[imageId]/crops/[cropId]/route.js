import { NextResponse } from 'next/server';
import { getStorageAdapter } from '@/lib/storage';

/**
 * GET /api/images/{imageId}/crops/{cropId}
 * Get a single crop with its preview image data
 */
export async function GET(request, { params }) {
    const { cropId } = await params;
    const storage = getStorageAdapter();
    const crop = await storage.getCrop(cropId);

    if (!crop) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    return NextResponse.json(crop);
}

export async function PATCH(request, { params }) {
    const { imageId, cropId } = await params;
    const body = await request.json();
    const storage = getStorageAdapter();

    try {
        const updated = await storage.updateCrop(imageId, cropId, body);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: error.message || 'Crop not found' }, { status: 404 });
    }
}

export async function DELETE(request, { params }) {
    const { imageId, cropId } = await params;
    const storage = getStorageAdapter();
    const deleted = await storage.deleteCrop(imageId, cropId);

    if (!deleted) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
