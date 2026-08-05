import { StorageAdapter } from './StorageAdapter.ts';
import { DbCanvasStorageAdapter } from '../db.ts';
import { DbImageStorageAdapter } from '../imageDb.ts';
import { DbCropStorageAdapter } from '../cropDb.ts';
import type {
    Crop,
    Composition,
    PlacedItem,
    SavedCanvas,
    StoredImage,
    SaveCropsResponse,
    CreateCanvasResponse,
    OperationSuccessResponse
} from '../../types.ts';

export class JsonStorageAdapter extends StorageAdapter {
    private canvasAdapter = new DbCanvasStorageAdapter();
    private imageAdapter = new DbImageStorageAdapter();
    private cropAdapter = new DbCropStorageAdapter();

    // ============================================================================
    // CANVAS CRUD
    // ============================================================================

    override async listCanvases(): Promise<SavedCanvas[]> {
        return this.canvasAdapter.listCanvases();
    }

    override async getCanvas(canvasId: string): Promise<SavedCanvas | null> {
        return this.canvasAdapter.getCanvas(canvasId);
    }

    override async loadCanvas(canvasId: string): Promise<SavedCanvas | null> {
        return this.canvasAdapter.loadCanvas(canvasId);
    }

    override async createCanvas(options: { name?: string; mode?: string; composition?: Composition; placedItems?: PlacedItem[]; [key: string]: unknown } = {}): Promise<CreateCanvasResponse & SavedCanvas> {
        return this.canvasAdapter.createCanvas(options);
    }

    override async saveCanvas(canvasId: string, composition: Composition, placedItems: PlacedItem[] = []): Promise<OperationSuccessResponse & SavedCanvas> {
        return this.canvasAdapter.saveCanvas(canvasId, composition, placedItems);
    }

    override async deleteCanvas(canvasId: string): Promise<OperationSuccessResponse> {
        return this.canvasAdapter.deleteCanvas(canvasId);
    }

    // ============================================================================
    // CROP CRUD
    // ============================================================================

    override async loadAllCrops(): Promise<Crop[]> {
        return this.cropAdapter.loadAllCrops();
    }

    override async loadCrops(imageId: string): Promise<Crop[]> {
        return this.cropAdapter.loadCrops(imageId);
    }

    override async getCrop(cropId: string | number): Promise<Crop | null> {
        return this.cropAdapter.getCrop(cropId);
    }

    override async saveCrops(imageId: string, crops: Partial<Crop>[]): Promise<SaveCropsResponse & { success: boolean; count: number; imageCreated: boolean }> {
        return this.cropAdapter.saveCrops(imageId, crops);
    }

    override async updateCrop(imageId: string, cropId: string | number, updates: Partial<Crop>): Promise<Crop> {
        return this.cropAdapter.updateCrop(imageId, cropId, updates);
    }

    override async deleteCrop(imageId: string, cropId: string | number): Promise<OperationSuccessResponse> {
        return this.cropAdapter.deleteCrop(imageId, cropId);
    }

    // ============================================================================
    // IMAGE CRUD
    // ============================================================================

    override async listImages(): Promise<StoredImage[]> {
        return this.imageAdapter.listImages();
    }

    override async getImage(imageId: string): Promise<StoredImage | null> {
        return this.imageAdapter.getImage(imageId);
    }

    override async uploadImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}): Promise<StoredImage> {
        return this.imageAdapter.uploadImage(imageId, base64Data, metadata);
    }

    override async saveImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}): Promise<StoredImage & { success: boolean; path: string }> {
        return this.imageAdapter.saveImage(imageId, base64Data, metadata);
    }

    override async deleteImage(imageId: string, deleteCrops: boolean = false): Promise<OperationSuccessResponse & { cropsDeleted?: number }> {
        return this.imageAdapter.deleteImage(imageId, deleteCrops);
    }
}
