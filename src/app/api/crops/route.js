import { NextResponse } from 'next/server';
import { readDb } from '@/lib/db';

/**
 * GET /api/crops
 * Get all crops from all images
 * Returns imageDataUrl for efficient direct file access instead of base64
 */
export async function GET() {
    const db = readDb();

    // Return crops with URL to streaming endpoint instead of base64 data
    const crops = (db.crops || []).map(crop => {
        // Build the URL to the streaming file endpoint
        const imageDataUrl = crop.imageDataPath
            ? `/api/images/${crop.imageId}/crops/${crop.id}/file`
            : null;
        return { ...crop, imageDataUrl };
    });

    return NextResponse.json({ crops });
}
