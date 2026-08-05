import type {
    Crop,
    Composition,
    PlacedItem,
    SavedCanvas,
    StoredImage,
    SaveCropsResponse,
    CreateCanvasResponse,
    OperationSuccessResponse,
    StorageAdapter as IStorageAdapter
} from '../../types.ts';

/**
 * StorageAdapter abstract base class for VistaCrop.
 * Abstracts all persistence operations for canvases, crops, and images.
 */
export class StorageAdapter implements IStorageAdapter {
    // ============================================================================
    // CANVAS CRUD
    // ============================================================================

    async listCanvases(): Promise<SavedCanvas[]> {
        throw new Error('StorageAdapter.listCanvases() must be implemented');
    }

    async getCanvas(canvasId: string): Promise<SavedCanvas | null> {
        throw new Error('StorageAdapter.getCanvas() must be implemented');
    }

    async loadCanvas(canvasId: string): Promise<SavedCanvas | null> {
        return this.getCanvas(canvasId);
    }

    async createCanvas(options: { name?: string; mode?: string; [key: string]: unknown } = {}): Promise<CreateCanvasResponse & SavedCanvas> {
        throw new Error('StorageAdapter.createCanvas() must be implemented');
    }

    async saveCanvas(canvasId: string, composition: Composition, placedItems: PlacedItem[] = []): Promise<OperationSuccessResponse & SavedCanvas> {
        throw new Error('StorageAdapter.saveCanvas() must be implemented');
    }

    async deleteCanvas(canvasId: string): Promise<OperationSuccessResponse> {
        throw new Error('StorageAdapter.deleteCanvas() must be implemented');
    }

    // ============================================================================
    // CROP CRUD
    // ============================================================================

    async loadAllCrops(): Promise<Crop[]> {
        throw new Error('StorageAdapter.loadAllCrops() must be implemented');
    }

    async loadCrops(imageId: string): Promise<Crop[]> {
        throw new Error('StorageAdapter.loadCrops() must be implemented');
    }

    async getCrop(cropId: string | number): Promise<Crop | null> {
        throw new Error('StorageAdapter.getCrop() must be implemented');
    }

    async saveCrops(imageId: string, crops: Crop[]): Promise<SaveCropsResponse & { success?: boolean; imageCreated?: boolean }> {
        throw new Error('StorageAdapter.saveCrops() must be implemented');
    }

    async updateCrop(imageId: string, cropId: string | number, updates: Partial<Crop>): Promise<Crop> {
        throw new Error('StorageAdapter.updateCrop() must be implemented');
    }

    async deleteCrop(imageId: string, cropId: string | number): Promise<OperationSuccessResponse> {
        throw new Error('StorageAdapter.deleteCrop() must be implemented');
    }

    // ============================================================================
    // IMAGE CRUD
    // ============================================================================

    async listImages(): Promise<StoredImage[]> {
        throw new Error('StorageAdapter.listImages() must be implemented');
    }

    async getImage(imageId: string): Promise<StoredImage | null> {
        throw new Error('StorageAdapter.getImage() must be implemented');
    }

    async uploadImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}): Promise<StoredImage> {
        return this.saveImage(imageId, base64Data, metadata);
    }

    async saveImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}): Promise<StoredImage & { success?: boolean; imageId?: string; path?: string }> {
        throw new Error('StorageAdapter.saveImage() must be implemented');
    }

    async deleteImage(imageId: string, deleteCrops: boolean = false): Promise<OperationSuccessResponse & { cropsDeleted?: number }> {
        throw new Error('StorageAdapter.deleteImage() must be implemented');
    }
}
