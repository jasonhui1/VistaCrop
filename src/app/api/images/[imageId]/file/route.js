import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getImageMeta } from '@/lib/imageDb';

const IMAGES_DIR = path.join(process.cwd(), 'data', 'images');

// MIME type mapping
const MIME_TYPES = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp'
};

/**
 * GET /api/images/{imageId}/file
 * Stream the raw image file with proper Content-Type
 * Much more efficient than base64 encoding for local use
 */
export async function GET(request, { params }) {
    const { imageId } = await params;

    const meta = getImageMeta(imageId);
    if (!meta) {
        return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    const filePath = path.join(IMAGES_DIR, meta.path);

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'Image file not found' }, { status: 404 });
    }

    // Get file extension and determine content type
    const ext = path.extname(meta.path).slice(1).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Read file and return as stream
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Length': fileBuffer.length.toString(),
            // Cache for 1 hour since images don't change often
            'Cache-Control': 'private, max-age=3600',
        }
    });
}
