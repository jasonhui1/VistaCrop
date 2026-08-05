/**
 * API utilities for saving and loading image cropper data.
 * Supports configurable basePath (defaults to '/api').
 */

export interface ApiClientOptions {
    basePath?: string;
}

export function createApiClient(basePath: string = '/api') {
    const cleanBasePath = basePath.replace(/\/+$/, '');

    async function createApiError(response: Response, defaultMessage: string): Promise<Error> {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        return new Error(error.message || `${defaultMessage}: ${response.status}`);
    }

    return {
        // ============================================================================
        // CROPS API
        // ============================================================================

        /**
         * Save all crops for an image
         */
        async saveCrops(imageId: string, crops: any[]) {
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

        /**
         * Load all crops from all images
         */
        async loadAllCrops() {
            const response = await fetch(`${cleanBasePath}/crops`);

            if (!response.ok) {
                throw await createApiError(response, 'Failed to load all crops');
            }

            const data = await response.json();
            return data.crops || [];
        },

        /**
         * Load all crops for an image
         */
        async loadCrops(imageId: string) {
            const response = await fetch(`${cleanBasePath}/images/${imageId}/crops`);

            if (!response.ok) {
                if (response.status === 404) return [];
                throw await createApiError(response, 'Failed to load crops');
            }

            const data = await response.json();
            return data.crops || [];
        },

        /**
         * Update a single crop
         */
        async updateCrop(imageId: string, cropId: string, updates: Record<string, any>) {
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

        /**
         * Delete a single crop
         */
        async deleteCrop(imageId: string, cropId: string) {
            const response = await fetch(`${cleanBasePath}/images/${imageId}/crops/${cropId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to delete crop');
            }
            return response.json();
        },

        // ============================================================================
        // IMAGES API
        // ============================================================================

        /**
         * Upload an image to the server
         */
        async uploadImage(imageId: string, base64Data: string, metadata: Record<string, any> = {}) {
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

        /**
         * List all stored images (metadata only)
         */
        async listImages() {
            const response = await fetch(`${cleanBasePath}/images`);

            if (!response.ok) {
                throw await createApiError(response, 'Failed to list images');
            }
            return response.json();
        },

        /**
         * Get a stored image by ID
         */
        async getImage(imageId: string) {
            const response = await fetch(`${cleanBasePath}/images/${imageId}`);

            if (!response.ok) {
                if (response.status === 404) return null;
                throw await createApiError(response, 'Failed to get image');
            }
            return response.json();
        },

        /**
         * Delete a stored image
         */
        async deleteImage(imageId: string, deleteCrops: boolean = false) {
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

        // ============================================================================
        // CANVAS API
        // ============================================================================

        /**
         * Create a new canvas and get its ID from the server
         */
        async createCanvas(options: Record<string, any> = {}) {
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

        /**
         * Save canvas composition and placed items
         */
        async saveCanvas(canvasId: string, composition: Record<string, any>, placedItems: any[]) {
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

        /**
         * Load a canvas composition
         */
        async loadCanvas(canvasId: string) {
            const response = await fetch(`${cleanBasePath}/canvas/${canvasId}`);

            if (!response.ok) {
                if (response.status === 404) return null;
                throw await createApiError(response, 'Failed to load canvas');
            }
            return response.json();
        },

        /**
         * List all canvases
         */
        async listCanvases() {
            const response = await fetch(`${cleanBasePath}/canvas`);

            if (!response.ok) {
                throw await createApiError(response, 'Failed to list canvases');
            }
            return response.json();
        },

        /**
         * Delete a canvas
         */
        async deleteCanvas(canvasId: string) {
            const response = await fetch(`${cleanBasePath}/canvas/${canvasId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw await createApiError(response, 'Failed to delete canvas');
            }
            return response.json();
        },

        // ============================================================================
        // EXPORT API
        // ============================================================================

        /**
         * Upload exported canvas as an image
         */
        async uploadExportedCanvas(canvasId: string, imageBlob: Blob, options: Record<string, any> = {}) {
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

// Standalone functions with default basePath = '/api'
export async function saveCrops(imageId: string, crops: any[], basePath: string = '/api') {
    return createApiClient(basePath).saveCrops(imageId, crops);
}

export async function loadAllCrops(basePath: string = '/api') {
    return createApiClient(basePath).loadAllCrops();
}

export async function loadCrops(imageId: string, basePath: string = '/api') {
    return createApiClient(basePath).loadCrops(imageId);
}

export async function updateCrop(imageId: string, cropId: string, updates: Record<string, any>, basePath: string = '/api') {
    return createApiClient(basePath).updateCrop(imageId, cropId, updates);
}

export async function deleteCrop(imageId: string, cropId: string, basePath: string = '/api') {
    return createApiClient(basePath).deleteCrop(imageId, cropId);
}

export async function uploadImage(imageId: string, base64Data: string, metadata: Record<string, any> = {}, basePath: string = '/api') {
    return createApiClient(basePath).uploadImage(imageId, base64Data, metadata);
}

export async function listImages(basePath: string = '/api') {
    return createApiClient(basePath).listImages();
}

export async function getImage(imageId: string, basePath: string = '/api') {
    return createApiClient(basePath).getImage(imageId);
}

export async function deleteImage(imageId: string, deleteCrops: boolean = false, basePath: string = '/api') {
    return createApiClient(basePath).deleteImage(imageId, deleteCrops);
}

export async function createCanvas(options: Record<string, any> = {}, basePath: string = '/api') {
    return createApiClient(basePath).createCanvas(options);
}

export async function saveCanvas(canvasId: string, composition: Record<string, any>, placedItems: any[], basePath: string = '/api') {
    return createApiClient(basePath).saveCanvas(canvasId, composition, placedItems);
}

export async function loadCanvas(canvasId: string, basePath: string = '/api') {
    return createApiClient(basePath).loadCanvas(canvasId);
}

export async function listCanvases(basePath: string = '/api') {
    return createApiClient(basePath).listCanvases();
}

export async function deleteCanvas(canvasId: string, basePath: string = '/api') {
    return createApiClient(basePath).deleteCanvas(canvasId);
}

export async function uploadExportedCanvas(canvasId: string, imageBlob: Blob, options: Record<string, any> = {}, basePath: string = '/api') {
    return createApiClient(basePath).uploadExportedCanvas(canvasId, imageBlob, options);
}
