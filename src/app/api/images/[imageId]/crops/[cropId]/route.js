import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { saveCropPreview, loadCropPreview, deleteCropPreview } from '@/lib/cropDb';

/**
 * GET /api/images/{imageId}/crops/{cropId}
 * Get a single crop with its preview image data
 */
export async function GET(request, { params }) {
    const { cropId } = await params;

    const db = readDb();
    const crop = db.crops.find(c => String(c.id) === String(cropId));

    if (!crop) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    // Load the image data from file if we have a path
    let imageData = null;
    if (crop.imageDataPath) {
        imageData = loadCropPreview(crop.imageDataPath);
    }

    return NextResponse.json({ ...crop, imageData });
}

export async function PATCH(request, { params }) {
    const { cropId } = await params;
    const body = await request.json();

    const db = readDb();
    const cropIndex = db.crops.findIndex(c => String(c.id) === String(cropId));

    if (cropIndex === -1) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    // If imageData is being updated, save it to file
    let updates = { ...body };
    if (body.imageData && body.imageData.startsWith('data:image/')) {
        const fileName = saveCropPreview(cropId, body.imageData);
        updates.imageDataPath = fileName;
        delete updates.imageData; // Don't store base64 in db
    }

    db.crops[cropIndex] = { ...db.crops[cropIndex], ...updates, updatedAt: Date.now() };
    writeDb(db);

    return NextResponse.json(db.crops[cropIndex]);
}

export async function DELETE(request, { params }) {
    const { cropId } = await params;

    const db = readDb();
    const crop = db.crops.find(c => String(c.id) === String(cropId));

    if (!crop) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    // Delete the crop preview file if it exists
    if (crop.imageDataPath) {
        deleteCropPreview(crop.imageDataPath);
    }

    db.crops = db.crops.filter(c => String(c.id) !== String(cropId));
    writeDb(db);

    return NextResponse.json({ success: true });
}
