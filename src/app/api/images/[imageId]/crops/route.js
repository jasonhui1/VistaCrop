import { NextResponse } from 'next/server';
import { readDb, writeDb } from '@/lib/db';
import { getImageMeta, saveImage } from '@/lib/imageDb';
import { saveCropPreview, loadCropPreview } from '@/lib/cropDb';

export async function GET(request, { params }) {
    const { imageId } = await params;
    const db = readDb();

    // Return crops linked to this imageId, loading imageData from files
    const crops = db.crops
        .filter(c => c.imageId === imageId)
        .map(crop => {
            let imageData = null;
            if (crop.imageDataPath) {
                imageData = loadCropPreview(crop.imageDataPath);
            }
            return { ...crop, imageData };
        });

    return NextResponse.json({ crops });
}

export async function POST(request, { params }) {
    const { imageId } = await params;
    const body = await request.json();
    const { crops } = body;

    if (!Array.isArray(crops)) {
        return NextResponse.json({ error: 'Invalid crops data' }, { status: 400 });
    }

    const db = readDb();
    let imageCreated = false;

    // Check if image already exists, if not and we have image data, save it
    const existingImage = getImageMeta(imageId);
    if (!existingImage && crops.length > 0) {
        const firstCropWithImage = crops.find(c => c.originalImage);
        if (firstCropWithImage) {
            saveImage(imageId, firstCropWithImage.originalImage, {
                width: firstCropWithImage.originalImageWidth,
                height: firstCropWithImage.originalImageHeight
            });
            imageCreated = true;
        }
    }

    // Remove existing crops for this image
    const otherCrops = db.crops.filter(c => c.imageId !== imageId);

    // Add new crops, stripping originalImage and saving imageData to files
    const newCrops = crops.map(c => {
        // eslint-disable-next-line no-unused-vars
        const { originalImage, imageData, ...cropWithoutBlobs } = c;

        // Save crop preview image to file
        let imageDataPath = null;
        if (imageData && imageData.startsWith('data:image/')) {
            imageDataPath = saveCropPreview(c.id, imageData);
        }

        return {
            ...cropWithoutBlobs,
            imageDataPath, // Store path instead of base64
            imageId, // Ensure explicit link
            updatedAt: Date.now()
        };
    });

    db.crops = [...otherCrops, ...newCrops];
    writeDb(db);

    return NextResponse.json({ success: true, count: newCrops.length, imageCreated });
}
