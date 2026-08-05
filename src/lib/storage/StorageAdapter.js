/**
 * StorageAdapter interface / abstract base class for VistaCrop.
 * Abstract all persistence operations for canvases, crops, and images.
 */
export class StorageAdapter {
    // ============================================================================
    // CANVAS CRUD
    // ============================================================================

    /**
     * List all canvases
     * @returns {Promise<Array<Object>>|Array<Object>}
     */
    async listCanvases() {
        throw new Error('StorageAdapter.listCanvases() must be implemented');
    }

    /**
     * Get a single canvas by ID
     * @param {string} canvasId 
     * @returns {Promise<Object|null>|Object|null}
     */
    async getCanvas(canvasId) {
        throw new Error('StorageAdapter.getCanvas() must be implemented');
    }

    /**
     * Create a new canvas
     * @param {Object} options 
     * @returns {Promise<Object>|Object} Created canvas object including canvasId
     */
    async createCanvas(options = {}) {
        throw new Error('StorageAdapter.createCanvas() must be implemented');
    }

    /**
     * Save canvas composition and placed items
     * @param {string} canvasId 
     * @param {Object} composition 
     * @param {Array} placedItems 
     * @returns {Promise<Object>|Object} Updated canvas object
     */
    async saveCanvas(canvasId, composition, placedItems) {
        throw new Error('StorageAdapter.saveCanvas() must be implemented');
    }

    /**
     * Delete a canvas
     * @param {string} canvasId 
     * @returns {Promise<boolean>|boolean} True if deleted or already missing
     */
    async deleteCanvas(canvasId) {
        throw new Error('StorageAdapter.deleteCanvas() must be implemented');
    }

    // ============================================================================
    // CROP CRUD
    // ============================================================================

    /**
     * Load all crops across all images (with preview image data loaded)
     * @returns {Promise<Array<Object>>|Array<Object>}
     */
    async loadAllCrops() {
        throw new Error('StorageAdapter.loadAllCrops() must be implemented');
    }

    /**
     * Load crops for a specific image (with preview image data loaded)
     * @param {string} imageId 
     * @returns {Promise<Array<Object>>|Array<Object>}
     */
    async loadCrops(imageId) {
        throw new Error('StorageAdapter.loadCrops() must be implemented');
    }

    /**
     * Get a single crop by ID
     * @param {string} cropId 
     * @returns {Promise<Object|null>|Object|null}
     */
    async getCrop(cropId) {
        throw new Error('StorageAdapter.getCrop() must be implemented');
    }

    /**
     * Save all crops for an image (replaces existing crops for this image)
     * @param {string} imageId 
     * @param {Array<Object>} crops 
     * @returns {Promise<{ count: number, imageCreated: boolean }>|{ count: number, imageCreated: boolean }}
     */
    async saveCrops(imageId, crops) {
        throw new Error('StorageAdapter.saveCrops() must be implemented');
    }

    /**
     * Update a single crop
     * @param {string} imageId 
     * @param {string} cropId 
     * @param {Object} updates 
     * @returns {Promise<Object>|Object} Updated crop object
     */
    async updateCrop(imageId, cropId, updates) {
        throw new Error('StorageAdapter.updateCrop() must be implemented');
    }

    /**
     * Delete a single crop
     * @param {string} imageId 
     * @param {string} cropId 
     * @returns {Promise<boolean>|boolean}
     */
    async deleteCrop(imageId, cropId) {
        throw new Error('StorageAdapter.deleteCrop() must be implemented');
    }

    // ============================================================================
    // IMAGE CRUD
    // ============================================================================

    /**
     * List all images metadata
     * @returns {Promise<Array<Object>>|Array<Object>} Array of image metadata objects
     */
    async listImages() {
        throw new Error('StorageAdapter.listImages() must be implemented');
    }

    /**
     * Get image metadata and base64 data by ID
     * @param {string} imageId 
     * @returns {Promise<Object|null>|Object|null} Image data object or null
     */
    async getImage(imageId) {
        throw new Error('StorageAdapter.getImage() must be implemented');
    }

    /**
     * Save an image (base64 data)
     * @param {string} imageId 
     * @param {string} base64Data 
     * @param {Object} metadata 
     * @returns {Promise<Object>|Object} Saved image metadata / result
     */
    async saveImage(imageId, base64Data, metadata = {}) {
        throw new Error('StorageAdapter.saveImage() must be implemented');
    }

    /**
     * Delete an image and optionally its associated crops
     * @param {string} imageId 
     * @param {boolean} deleteCrops 
     * @returns {Promise<{ success: boolean, cropsDeleted?: number }>|{ success: boolean, cropsDeleted?: number }}
     */
    async deleteImage(imageId, deleteCrops = false) {
        throw new Error('StorageAdapter.deleteImage() must be implemented');
    }
}
