import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { saveThumbnail, deleteThumbnail, loadThumbnail } from '@/lib/thumbnailDb';

export async function GET(request, { params }) {
    const { canvasId } = await params;
    const db = readDb();
    const canvas = (db.canvases || []).find(c => String(c.id) === String(canvasId));

    if (!canvas) {
        return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    // Load thumbnail data if path exists
    const responseData = { ...canvas };
    if (canvas.thumbnailPath) {
        responseData.thumbnail = loadThumbnail(canvas.thumbnailPath);
    }

    return NextResponse.json(responseData);
}

export async function PUT(request, { params }) {
    const { canvasId } = await params;
    const body = await request.json();

    const db = readDb();
    if (!db.canvases) db.canvases = [];

    const index = db.canvases.findIndex(c => String(c.id) === String(canvasId));

    if (index === -1) {
        // Optionally create if not exists, but PUT usually updates
        return NextResponse.json({ error: 'Canvas not found' }, { status: 404 });
    }

    // Handle thumbnail: save as file if base64 provided
    const updateData = { ...body };
    if (body.thumbnail && body.thumbnail.startsWith('data:image/')) {
        // Save thumbnail to file
        const thumbnailPath = saveThumbnail(canvasId, body.thumbnail);
        updateData.thumbnailPath = thumbnailPath;
        // Don't store base64 in the database
        delete updateData.thumbnail;
    }

    db.canvases[index] = { ...db.canvases[index], ...updateData, updatedAt: Date.now() };
    writeDb(db);

    return NextResponse.json(db.canvases[index]);
}

export async function DELETE(request, { params }) {
    const { canvasId } = await params;

    const db = readDb();
    if (!db.canvases) return NextResponse.json({ success: true }); // already empty

    // Find canvas to delete its thumbnail
    const canvas = db.canvases.find(c => String(c.id) === String(canvasId));
    if (canvas?.thumbnailPath) {
        deleteThumbnail(canvas.thumbnailPath);
    }

    db.canvases = db.canvases.filter(c => String(c.id) !== String(canvasId));
    writeDb(db);

    return NextResponse.json({ success: true });
}
