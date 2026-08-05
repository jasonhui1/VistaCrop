import fs from 'fs';
import path from 'path';
import type { CropStorageAdapter, Crop, SaveCropsResponse, OperationSuccessResponse } from '../types.ts';
import { readDb, writeDb } from './db.ts';
import { getImageMeta, saveImageFile } from './imageDb.ts';

// Store crop preview images in a separate folder
const DB_DIR = path.join(process.cwd(), 'data');
const CROPS_DIR = path.join(DB_DIR, 'crops');

function ensureCropsDir(): void {
    if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(CROPS_DIR)) {
        fs.mkdirSync(CROPS_DIR, { recursive: true });
    }
}

/**
 * Save a crop preview image to file
 */
export function saveCropPreview(cropId: string | number, base64Data: string): string {
    ensureCropsDir();

    // Extract the base64 content and mime type
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
        throw new Error('Invalid base64 image data');
    }

    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const base64Content = matches[2];
    const fileName = `${cropId}.${extension}`;
    const filePath = path.join(CROPS_DIR, fileName);

    // Write image file
    const buffer = Buffer.from(base64Content, 'base64');
    fs.writeFileSync(filePath, buffer);

    return fileName;
}

/**
 * Load a crop preview image as base64 data URL
 */
export function loadCropPreview(fileName: string): string | null {
    ensureCropsDir();

    const filePath = path.join(CROPS_DIR, fileName);
    if (!fs.existsSync(filePath)) return null;

    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');

    // Determine mime type from extension
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const mimeType = ext === 'jpg' ? 'jpeg' : ext;

    return `data:image/${mimeType};base64,${base64}`;
}

/**
 * Delete a crop preview file
 */
export function deleteCropPreview(fileName?: string | null): boolean {
    if (!fileName) return false;

    const filePath = path.join(CROPS_DIR, fileName);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

/**
 * Check if a crop preview file exists
 */
export function cropPreviewExists(fileName?: string | null): boolean {
    if (!fileName) return false;
    const filePath = path.join(CROPS_DIR, fileName);
    return fs.existsSync(filePath);
}

function attachImageData(crop?: Crop | null): Crop | null {
    if (!crop) return null;
    let imageData: string | undefined = undefined;
    if (crop.imageDataPath) {
        const preview = loadCropPreview(crop.imageDataPath);
        if (preview) {
            imageData = preview;
        }
    }
    return { ...crop, imageData };
}

interface CropInput extends Partial<Crop> {
    originalImage?: string;
}

/**
 * Crop Storage Adapter class implementing CropStorageAdapter for crop operations
 */
export class DbCropStorageAdapter implements CropStorageAdapter {
    async loadAllCrops(): Promise<Crop[]> {
        const db = readDb();
        return (db.crops || [])
            .map(attachImageData)
            .filter((c): c is Crop => c !== null);
    }

    async loadCrops(imageId: string): Promise<Crop[]> {
        const db = readDb();
        return (db.crops || [])
            .filter(c => c.imageId === imageId)
            .map(attachImageData)
            .filter((c): c is Crop => c !== null);
    }

    async getCrop(cropId: string | number): Promise<Crop | null> {
        const db = readDb();
        const crop = (db.crops || []).find(c => String(c.id) === String(cropId));
        return attachImageData(crop);
    }

    async saveCrops(imageId: string, crops: CropInput[]): Promise<SaveCropsResponse & { success: boolean; count: number; imageCreated: boolean }> {
        if (!Array.isArray(crops)) {
            throw new Error('Invalid crops data');
        }

        const db = readDb();
        let imageCreated = false;

        const existingImage = getImageMeta(imageId);
        if (!existingImage && crops.length > 0) {
            const firstCropWithImage = crops.find(c => c.originalImage);
            if (firstCropWithImage && firstCropWithImage.originalImage) {
                saveImageFile(imageId, firstCropWithImage.originalImage, {
                    width: firstCropWithImage.originalImageWidth,
                    height: firstCropWithImage.originalImageHeight
                });
                imageCreated = true;
            }
        }

        if (!db.crops) db.crops = [];
        const otherCrops = db.crops.filter(c => c.imageId !== imageId);

        const now = Date.now();
        const newCrops: Crop[] = crops.map(c => {
            const { originalImage, imageData, ...cropWithoutBlobs } = c;

            let imageDataPath: string | null = null;
            if (imageData && imageData.startsWith('data:image/')) {
                imageDataPath = saveCropPreview(c.id!, imageData);
            }

            return {
                x: c.x ?? 0,
                y: c.y ?? 0,
                width: c.width ?? 0,
                height: c.height ?? 0,
                id: c.id!,
                ...cropWithoutBlobs,
                imageDataPath: imageDataPath || undefined,
                imageId,
                updatedAt: now
            };
        });

        db.crops = [...otherCrops, ...newCrops];
        writeDb(db);

        return { success: true, count: newCrops.length, imageCreated, crops: newCrops, updatedAt: now };
    }

    async updateCrop(imageId: string, cropId: string | number, updates: Partial<Crop>): Promise<Crop> {
        const db = readDb();
        if (!db.crops) db.crops = [];

        const cropIndex = db.crops.findIndex(c => String(c.id) === String(cropId));
        if (cropIndex === -1) {
            throw new Error(`Crop not found: ${cropId}`);
        }

        const patchUpdates = { ...updates };
        if (patchUpdates.imageData && patchUpdates.imageData.startsWith('data:image/')) {
            const fileName = saveCropPreview(cropId, patchUpdates.imageData);
            patchUpdates.imageDataPath = fileName;
            delete patchUpdates.imageData;
        }

        db.crops[cropIndex] = { ...db.crops[cropIndex], ...patchUpdates, updatedAt: Date.now() };
        writeDb(db);

        const updatedCrop = attachImageData(db.crops[cropIndex]);
        if (!updatedCrop) {
            throw new Error(`Failed to update crop: ${cropId}`);
        }
        return updatedCrop;
    }

    async deleteCrop(imageId: string, cropId: string | number): Promise<OperationSuccessResponse> {
        const db = readDb();
        if (!db.crops) return { success: false };

        const crop = db.crops.find(c => String(c.id) === String(cropId));
        if (!crop) return { success: false };

        if (crop.imageDataPath) {
            deleteCropPreview(crop.imageDataPath);
        }

        db.crops = db.crops.filter(c => String(c.id) !== String(cropId));
        writeDb(db);
        return { success: true };
    }
}
