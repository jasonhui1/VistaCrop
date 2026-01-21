import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readDb } from '@/lib/db';

const THUMBNAILS_DIR = path.join(process.cwd(), 'data', 'thumbnails');

// MIME type mapping
const MIME_TYPES = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
};

/**
 * GET /api/canvas/{canvasId}/thumbnail/file
 * Stream the raw canvas thumbnail image file with proper Content-Type
 * Much more efficient than base64 encoding
 */
export async function GET(request, { params }) {
    const { canvasId } = await params;

    const db = readDb();
    const canvas = db.canvases?.find(c => c.id === canvasId);

    if (!canvas) {
        return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    if (!canvas.thumbnailPath) {
        return NextResponse.json({ error: 'Canvas has no thumbnail' }, { status: 404 });
    }

    const filePath = path.join(THUMBNAILS_DIR, canvas.thumbnailPath);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Thumbnail file not found' }, { status: 404 });
    }

    // Get file extension and determine content type
    const ext = path.extname(canvas.thumbnailPath).slice(1).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read file and return as stream
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Length': fileBuffer.length.toString(),
            // Cache for 5 minutes - thumbnails may update when canvas is saved
            'Cache-Control': 'private, max-age=300',
        }
    });
}
