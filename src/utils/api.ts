

import type {
    Crop,
    PlacedItem,
    Composition,
    StoredImage,
    SavedCanvas,
    SaveCropsResponse,
    CreateCanvasResponse,
    OperationSuccessResponse,
    StorageAdapter
} from '../types';

export interface ApiClientOptions {
    basePath?: string;
}

export function createApiClient(basePath: string = '/api'): StorageAdapter & {
    uploadExportedCanvas(canvasId: string, imageBlob: Blob, options?: { format?: string; [key: string]: unknown }): Promise<OperationSuccessResponse>;
} {
    const cleanBasePath = basePath.replace(/\/+$/, '');

    async function createApiError(response: Response, defaultMessage: string): Promise<Error> {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        return new Error(error.message || `${defaultMessage}: ${response.status}`);
    }

    return {

        
        async saveCrops(imageId: string, crops: Partial<Crop>[]): Promise<SaveCropsResponse & { success?: boolean; count?: number; imageCreated?: boolean }> {
            const response = await fetch(`${cleanBasePath}/images/${imageId}/crops`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crops, updatedAt: Date.now() })
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to save crops');
            }
            return response.json();
        },

        
        async loadAllCrops(): Promise<Crop[]> {
            const response = await fetch(`${cleanBasePath}/crops`);

            if (!response.ok) {
                throw await createApiError(response, 'Failed to load all crops');
            }

            const data = await response.json();
            return data.crops || [];
        },

        
        async loadCrops(imageId: string): Promise<Crop[]> {
            const response = await fetch(`${cleanBasePath}/images/${imageId}/crops`);

            if (!response.ok) {
                if (response.status === 404) return [];
                throw await createApiError(response, 'Failed to load crops');
            }

            const data = await response.json();
            return data.crops || [];
        },

        
        async getCrop(cropId: string | number): Promise<Crop | null> {
            const crops = await this.loadAllCrops();
            return crops.find(c => String(c.id) === String(cropId)) || null;
        },

        
        async updateCrop(imageId: string, cropId: string | number, updates: Partial<Crop>): Promise<Crop> {
            const response = await fetch(`${cleanBasePath}/images/${imageId}/crops/${cropId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...updates, updatedAt: Date.now() })
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to update crop');
            }
            return response.json();
        },

        
        async deleteCrop(imageId: string, cropId: string | number): Promise<OperationSuccessResponse> {
            const response = await fetch(`${cleanBasePath}/images/${imageId}/crops/${cropId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to delete crop');
            }
            return response.json();
        },


        
        async uploadImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}): Promise<StoredImage> {
            const response = await fetch(`${cleanBasePath}/images/${imageId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: base64Data, ...metadata })
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to upload image');
            }
            return response.json();
        },

        
        async saveImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}): Promise<StoredImage & { success?: boolean; path?: string }> {
            return this.uploadImage(imageId, base64Data, metadata);
        },

        
        async listImages(): Promise<StoredImage[]> {
            const response = await fetch(`${cleanBasePath}/images`);

            if (!response.ok) {
                throw await createApiError(response, 'Failed to list images');
            }
            return response.json();
        },

        
        async getImage(imageId: string): Promise<StoredImage | null> {
            const response = await fetch(`${cleanBasePath}/images/${imageId}`);

            if (!response.ok) {
                if (response.status === 404) return null;
                throw await createApiError(response, 'Failed to get image');
            }
            return response.json();
        },

        
        async deleteImage(imageId: string, deleteCrops: boolean = false): Promise<OperationSuccessResponse & { cropsDeleted?: number }> {
            const url = deleteCrops
                ? `${cleanBasePath}/images/${imageId}?deleteCrops=true`
                : `${cleanBasePath}/images/${imageId}`;

            const response = await fetch(url, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to delete image');
            }
            return response.json();
        },


        
        async createCanvas(options: { name?: string; mode?: string; [key: string]: unknown } = {}): Promise<CreateCanvasResponse> {
            const response = await fetch(`${cleanBasePath}/canvas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...options, createdAt: Date.now() })
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to create canvas');
            }
            return response.json();
        },

        
        async saveCanvas(canvasId: string, composition: Composition, placedItems: PlacedItem[] = []): Promise<OperationSuccessResponse> {
            const response = await fetch(`${cleanBasePath}/canvas/${canvasId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ composition, placedItems, updatedAt: Date.now() })
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to save canvas');
            }
            return response.json();
        },

        
        async getCanvas(canvasId: string): Promise<SavedCanvas | null> {
            return this.loadCanvas(canvasId);
        },

        
        async loadCanvas(canvasId: string): Promise<SavedCanvas | null> {
            const response = await fetch(`${cleanBasePath}/canvas/${canvasId}`);

            if (!response.ok) {
                if (response.status === 404) return null;
                throw await createApiError(response, 'Failed to load canvas');
            }
            return response.json();
        },

        
        async listCanvases(): Promise<SavedCanvas[]> {
            const response = await fetch(`${cleanBasePath}/canvas`);

            if (!response.ok) {
                throw await createApiError(response, 'Failed to list canvases');
            }
            return response.json();
        },

        
        async deleteCanvas(canvasId: string): Promise<OperationSuccessResponse> {
            const response = await fetch(`${cleanBasePath}/canvas/${canvasId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to delete canvas');
            }
            return response.json();
        },


        
        async uploadExportedCanvas(canvasId: string, imageBlob: Blob, options: { format?: string; [key: string]: unknown } = {}): Promise<OperationSuccessResponse> {
            const formData = new FormData();
            formData.append('image', imageBlob, `export-${Date.now()}.${options.format || 'png'}`);

            const response = await fetch(`${cleanBasePath}/canvas/${canvasId}/export`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to upload export');
            }
            return response.json();
        }
    };
}

export async function saveCrops(imageId: string, crops: Partial<Crop>[], basePath: string = '/api'): Promise<SaveCropsResponse & { success?: boolean; count?: number; imageCreated?: boolean }> {
    return createApiClient(basePath).saveCrops(imageId, crops);
}

export async function loadAllCrops(basePath: string = '/api'): Promise<Crop[]> {
    return createApiClient(basePath).loadAllCrops();
}

export async function loadCrops(imageId: string, basePath: string = '/api'): Promise<Crop[]> {
    return createApiClient(basePath).loadCrops(imageId);
}

export async function getCrop(cropId: string | number, basePath: string = '/api'): Promise<Crop | null> {
    return createApiClient(basePath).getCrop(cropId);
}

export async function updateCrop(imageId: string, cropId: string | number, updates: Partial<Crop>, basePath: string = '/api'): Promise<Crop> {
    return createApiClient(basePath).updateCrop(imageId, cropId, updates);
}

export async function deleteCrop(imageId: string, cropId: string | number, basePath: string = '/api'): Promise<OperationSuccessResponse> {
    return createApiClient(basePath).deleteCrop(imageId, cropId);
}

export async function uploadImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}, basePath: string = '/api'): Promise<StoredImage> {
    return createApiClient(basePath).uploadImage(imageId, base64Data, metadata);
}

export async function saveImage(imageId: string, base64Data: string, metadata: { width?: number; height?: number } = {}, basePath: string = '/api'): Promise<StoredImage & { success?: boolean; path?: string }> {
    return createApiClient(basePath).saveImage(imageId, base64Data, metadata);
}

export async function listImages(basePath: string = '/api'): Promise<StoredImage[]> {
    return createApiClient(basePath).listImages();
}

export async function getImage(imageId: string, basePath: string = '/api'): Promise<StoredImage | null> {
    return createApiClient(basePath).getImage(imageId);
}

export async function deleteImage(imageId: string, deleteCrops: boolean = false, basePath: string = '/api'): Promise<OperationSuccessResponse & { cropsDeleted?: number }> {
    return createApiClient(basePath).deleteImage(imageId, deleteCrops);
}

export async function createCanvas(options: { name?: string; mode?: string; [key: string]: unknown } = {}, basePath: string = '/api'): Promise<CreateCanvasResponse> {
    return createApiClient(basePath).createCanvas(options);
}

export async function saveCanvas(canvasId: string, composition: Composition, placedItems: PlacedItem[] = [], basePath: string = '/api'): Promise<OperationSuccessResponse> {
    return createApiClient(basePath).saveCanvas(canvasId, composition, placedItems);
}

export async function getCanvas(canvasId: string, basePath: string = '/api'): Promise<SavedCanvas | null> {
    return createApiClient(basePath).getCanvas(canvasId);
}

export async function loadCanvas(canvasId: string, basePath: string = '/api'): Promise<SavedCanvas | null> {
    return createApiClient(basePath).loadCanvas(canvasId);
}

export async function listCanvases(basePath: string = '/api'): Promise<SavedCanvas[]> {
    return createApiClient(basePath).listCanvases();
}

export async function deleteCanvas(canvasId: string, basePath: string = '/api'): Promise<OperationSuccessResponse> {
    return createApiClient(basePath).deleteCanvas(canvasId);
}

export async function uploadExportedCanvas(canvasId: string, imageBlob: Blob, options: { format?: string; [key: string]: unknown } = {}, basePath: string = '/api'): Promise<OperationSuccessResponse> {
    return createApiClient(basePath).uploadExportedCanvas(canvasId, imageBlob, options);
}
