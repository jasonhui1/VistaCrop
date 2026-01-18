import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { loadThumbnail } from '@/lib/thumbnailDb';

export async function GET() {
    const db = readDb();
    const canvases = db.canvases || [];

    // Load thumbnail data for each canvas
    const canvasesWithThumbnails = canvases.map(canvas => {
        if (canvas.thumbnailPath) {
            return {
                ...canvas,
                thumbnail: loadThumbnail(canvas.thumbnailPath)
            };
        }
        return canvas;
    });

    return NextResponse.json(canvasesWithThumbnails);
}

export async function POST(request) {
    const body = await request.json();
    const db = readDb();

    const newCanvas = {
        id: Date.now().toString(),
        ...body,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    // Ensure canvases array exists
    if (!db.canvases) db.canvases = [];

    db.canvases.push(newCanvas);
    writeDb(db);

    return NextResponse.json({ canvasId: newCanvas.id, ...newCanvas });
}
