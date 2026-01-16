import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';
import { loadCropPreview } from '@/lib/cropDb';

/**
 * GET /api/crops
 * Get all crops from all images (with imageData loaded from files)
 */
export async function GET() {
    const db = readDb();

    // Load imageData from files for each crop
    const crops = (db.crops || []).map(crop => {
        let imageData = null;
        if (crop.imageDataPath) {
            imageData = loadCropPreview(crop.imageDataPath);
        }
        return { ...crop, imageData };
    });

    return NextResponse.json({ crops });
}
