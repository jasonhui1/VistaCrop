import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function POST(request, { params }) {
    const { canvasId } = await params;
    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure public/uploads directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate filename
    // Use original name if available, or generate one
    const originalName = file.name || 'export.png';
    const fileName = `canvas-${canvasId}-${Date.now()}-${originalName}`;
    const filePath = path.join(uploadDir, fileName);

    try {
        await fs.promises.writeFile(filePath, buffer);
        return NextResponse.json({
            success: true,
            url: `/uploads/${fileName}`
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
    }
}
