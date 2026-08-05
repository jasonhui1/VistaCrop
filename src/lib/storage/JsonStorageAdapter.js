import { StorageAdapter } from './StorageAdapter.js';
import { readDb, writeDb } from '../db.js';
import {
    getImageMeta,
    saveImage as saveImageFile,
    loadImageAsDataUrl,
    deleteImage as deleteImageFile,
    listImages as listImagesMeta
} from '../imageDb.js';
import {
    saveCropPreview,
    loadCropPreview,
    deleteCropPreview
} from '../cropDb.js';

function attachImageData(crop) {
    if (!crop) return null;
    let imageData = null;
    if (crop.imageDataPath) {
        imageData = loadCropPreview(crop.imageDataPath);
    }
    return { ...crop, imageData };
}

export class JsonStorageAdapter extends StorageAdapter {
    // ============================================================================
    // CANVAS CRUD
    // ============================================================================

    async listCanvases() {
        const db = readDb();
        return db.canvases || [];
    }

    async getCanvas(canvasId) {
        const db = readDb();
        const canvas = (db.canvases || []).find(c => String(c.id) === String(canvasId));
        return canvas || null;
    }

    async createCanvas(options = {}) {
        const db = readDb();
        const newCanvas = {
            id: Date.now().toString(),
            ...options,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (!db.canvases) db.canvases = [];
        db.canvases.push(newCanvas);
        writeDb(db);

        return { canvasId: newCanvas.id, ...newCanvas };
    }

    async saveCanvas(canvasId, composition, placedItems) {
        const db = readDb();
        if (!db.canvases) db.canvases = [];

        const index = db.canvases.findIndex(c => String(c.id) === String(canvasId));

        if (index === -1) {
            throw new Error(`Canvas not found: ${canvasId}`);
        }

        const updates = { composition, placedItems, updatedAt: Date.now() };
        db.canvases[index] = { ...db.canvases[index], ...updates };
        writeDb(db);

        return db.canvases[index];
    }

    async deleteCanvas(canvasId) {
        const db = readDb();
        if (!db.canvases) return true;

        db.canvases = db.canvases.filter(c => String(c.id) !== String(canvasId));
        writeDb(db);
        return true;
    }

    // ============================================================================
    // CROP CRUD
    // ============================================================================

    async loadAllCrops() {
        const db = readDb();
        return (db.crops || []).map(attachImageData);
    }

    async loadCrops(imageId) {
        const db = readDb();
        return (db.crops || [])
            .filter(c => c.imageId === imageId)
            .map(attachImageData);
    }

    async getCrop(cropId) {
        const db = readDb();
        const crop = (db.crops || []).find(c => String(c.id) === String(cropId));
        return attachImageData(crop);
    }

    async saveCrops(imageId, crops) {
        if (!Array.isArray(crops)) {
            throw new Error('Invalid crops data');
        }

        const db = readDb();
        let imageCreated = false;

        const existingImage = getImageMeta(imageId);
        if (!existingImage && crops.length > 0) {
            const firstCropWithImage = crops.find(c => c.originalImage);
            if (firstCropWithImage) {
                saveImageFile(imageId, firstCropWithImage.originalImage, {
                    width: firstCropWithImage.originalImageWidth,
                    height: firstCropWithImage.originalImageHeight
                });
                imageCreated = true;
            }
        }

        if (!db.crops) db.crops = [];
        const otherCrops = db.crops.filter(c => c.imageId !== imageId);

        const newCrops = crops.map(c => {
            const { originalImage, imageData, ...cropWithoutBlobs } = c;

            let imageDataPath = null;
            if (imageData && imageData.startsWith('data:image/')) {
                imageDataPath = saveCropPreview(c.id, imageData);
            }

            return {
                ...cropWithoutBlobs,
                imageDataPath,
                imageId,
                updatedAt: Date.now()
            };
        });

        db.crops = [...otherCrops, ...newCrops];
        writeDb(db);

        return { success: true, count: newCrops.length, imageCreated };
    }

    async updateCrop(imageId, cropId, updates) {
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

        return attachImageData(db.crops[cropIndex]);
    }

    async deleteCrop(imageId, cropId) {
        const db = readDb();
        if (!db.crops) return false;

        const crop = db.crops.find(c => String(c.id) === String(cropId));
        if (!crop) return false;

        if (crop.imageDataPath) {
            deleteCropPreview(crop.imageDataPath);
        }

        db.crops = db.crops.filter(c => String(c.id) !== String(cropId));
        writeDb(db);
        return true;
    }

    // ============================================================================
    // IMAGE CRUD
    // ============================================================================

    async listImages() {
        return listImagesMeta();
    }

    async getImage(imageId) {
        const meta = getImageMeta(imageId);
        if (!meta) return null;

        const dataUrl = loadImageAsDataUrl(imageId);
        if (!dataUrl) return null;

        return {
            id: imageId,
            data: dataUrl,
            width: meta.width,
            height: meta.height,
            createdAt: meta.createdAt,
            updatedAt: meta.updatedAt
        };
    }

    async saveImage(imageId, base64Data, metadata = {}) {
        const result = saveImageFile(imageId, base64Data, metadata);
        return {
            success: true,
            imageId,
            path: result.path
        };
    }

    async deleteImage(imageId, deleteCrops = false) {
        const deleted = deleteImageFile(imageId);
        if (!deleted) {
            return { success: false, cropsDeleted: 0 };
        }

        let cropsDeleted = 0;
        if (deleteCrops) {
            const db = readDb();
            if (db.crops) {
                const initialCropsLength = db.crops.length;
                db.crops = db.crops.filter(c => c.imageId !== imageId);
                cropsDeleted = initialCropsLength - db.crops.length;
                writeDb(db);
            }
        }

        return { success: true, cropsDeleted };
    }
}
