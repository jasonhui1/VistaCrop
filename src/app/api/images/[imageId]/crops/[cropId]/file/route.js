import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readDb } from '@/lib/db';

const CROPS_DIR = path.join(process.cwd(), 'data', 'crops');

// MIME type mapping
const MIME_TYPES = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
};

/**
 * GET /api/images/{imageId}/crops/{cropId}/file
 * Stream the raw crop preview image file with proper Content-Type
 * Much more efficient than base64 encoding
 */
export async function GET(request, { params }) {
    const { cropId } = await params;

    const db = readDb();
    const crop = db.crops.find(c => String(c.id) === String(cropId));

    if (!crop) {
        return NextResponse.json({ error: 'Crop not found' }, { status: 404 });
    }

    if (!crop.imageDataPath) {
        return NextResponse.json({ error: 'Crop has no image file' }, { status: 404 });
    }

    const filePath = path.join(CROPS_DIR, crop.imageDataPath);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Crop image file not found' }, { status: 404 });
    }

    // Get file extension and determine content type
    const ext = path.extname(crop.imageDataPath).slice(1).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read file and return as stream
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Length': fileBuffer.length.toString(),
            // Cache for 1 hour - crops don't change often
            'Cache-Control': 'private, max-age=3600',
        }
    });
}
