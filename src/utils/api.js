/**
 * API utilities for saving and loading image cropper data
 */

const API_BASE_URL = '/api'; // Adjust to your server's base URL

// ============================================================================
// CROPS API
// ============================================================================

/**
 * Save all crops for an image
 * @param {string} imageId - The ID of the image
 * @param {Array} crops - Array of crop objects
 */
export async function saveCrops(imageId, crops) {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/crops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crops, updatedAt: Date.now() })
    });

    if (!response.ok) {
        throw await createApiError(response, 'Failed to save crops');
    }
    return response.json();
}

/**
 * Load all crops from all images
 * @returns {Promise<Array>} Array of all crop objects
 */
export async function loadAllCrops() {
    const response = await fetch(`${API_BASE_URL}/crops`);

    if (!response.ok) {
        throw await createApiError(response, 'Failed to load all crops');
    }

    const data = await response.json();
    return data.crops || [];
}

/**
 * Load all crops for an image
 * @param {string} imageId - The ID of the image
 * @returns {Promise<Array>} Array of crop objects
 */
export async function loadCrops(imageId) {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/crops`);

    if (!response.ok) {
        if (response.status === 404) return [];
        throw await createApiError(response, 'Failed to load crops');
    }

    const data = await response.json();
    return data.crops || [];
}

/**
 * Update a single crop
 * @param {string} imageId - The ID of the image
 * @param {string} cropId - The ID of the crop to update
 * @param {Object} updates - Partial crop data to update
 */
export async function updateCrop(imageId, cropId, updates) {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/crops/${cropId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, updatedAt: Date.now() })
    });

    if (!response.ok) {
        throw await createApiError(response, 'Failed to update crop');
    }
    return response.json();
}

/**
 * Delete a single crop
 * @param {string} imageId - The ID of the image
 * @param {string} cropId - The ID of the crop to delete
 */
export async function deleteCrop(imageId, cropId) {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/crops/${cropId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw await createApiError(response, 'Failed to delete crop');
    }
    return response.json();
}

// ============================================================================
// IMAGES API
// ============================================================================

/**
 * Upload an image to the server
 * @param {string} imageId - The ID for the image
 * @param {string} base64Data - Base64 data URL of the image
 * @param {{ width?: number, height?: number }} metadata - Optional image metadata
 */
export async function uploadImage(imageId, base64Data, metadata = {}) {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: base64Data, ...metadata })
    });

    if (!response.ok) {
        throw await createApiError(response, 'Failed to upload image');
    }
    return response.json();
}

// ============================================================================
// CANVAS API
// ============================================================================

/**
 * Create a new canvas and get its ID from the server
 * @param {Object} options - Optional initial settings
 * @returns {Promise<{canvasId: string}>} The new canvas ID
 */
export async function createCanvas(options = {}) {
    const response = await fetch(`${API_BASE_URL}/canvas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...options, createdAt: Date.now() })
    });

    if (!response.ok) {
        throw await createApiError(response, 'Failed to create canvas');
    }
    return response.json();
}

/**
 * Save canvas with multi-page support
 * @param {string} canvasId - The ID of the canvas
 * @param {Array} pages - Array of page objects with their placedItems
 * @param {string} mode - Canvas mode ('freeform' or 'panels')
 * @param {string} [thumbnail] - Optional base64 thumbnail preview image
 */
export async function saveCanvas(canvasId, pages, mode, thumbnail = null) {
    const body = { pages, mode, updatedAt: Date.now() }
    if (thumbnail) {
        body.thumbnail = thumbnail
    }

    const response = await fetch(`${API_BASE_URL}/canvas/${canvasId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        throw await createApiError(response, 'Failed to save canvas');
    }
    return response.json();
}

/**
 * Load a canvas composition
 * @param {string} canvasId - The ID of the canvas
 * @returns {Promise<Object|null>} The saved canvas data or null
 */
export async function loadCanvas(canvasId) {
    const response = await fetch(`${API_BASE_URL}/canvas/${canvasId}`);

    if (!response.ok) {
        if (response.status === 404) return null;
        throw await createApiError(response, 'Failed to load canvas');
    }
    return response.json();
}

/**
 * List all canvases
 * @returns {Promise<Array>} Array of canvas metadata
 */
export async function listCanvases() {
    const response = await fetch(`${API_BASE_URL}/canvas`);

    if (!response.ok) {
        throw await createApiError(response, 'Failed to list canvases');
    }
    return response.json();
}

/**
 * Delete a canvas
 * @param {string} canvasId - The ID of the canvas to delete
 */
export async function deleteCanvas(canvasId) {
    const response = await fetch(`${API_BASE_URL}/canvas/${canvasId}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw await createApiError(response, 'Failed to delete canvas');
    }
    return response.json();
}

// ============================================================================
// IMAGES API
// ============================================================================

/**
 * List all stored images (metadata only)
 * @returns {Promise<{images: Array}>} Array of image metadata
 */
export async function listImages() {
    const response = await fetch(`${API_BASE_URL}/images`);

    if (!response.ok) {
        throw await createApiError(response, 'Failed to list images');
    }
    return response.json();
}

/**
 * Get the direct URL for an image file (more efficient than base64)
 * Use this with <img src="..."> for direct browser loading
 * @param {string} imageId - The ID of the image
 * @returns {string} URL to the image file
 */
export function getImageUrl(imageId) {
    return `${API_BASE_URL}/images/${imageId}/file`;
}

/**
 * Get a stored image by ID (returns base64 - use getImageUrl for efficiency)
 * @param {string} imageId - The ID of the image
 * @returns {Promise<Object|null>} The image data or null if not found
 * @deprecated Prefer getImageUrl() for better performance
 */
export async function getImage(imageId) {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}`);

    if (!response.ok) {
        if (response.status === 404) return null;
        throw await createApiError(response, 'Failed to get image');
    }
    return response.json();
}

/**
 * Delete a stored image
 * @param {string} imageId - The ID of the image to delete
 * @param {boolean} deleteCrops - Whether to also delete associated crops
 */
export async function deleteImage(imageId, deleteCrops = false) {
    const url = deleteCrops
        ? `${API_BASE_URL}/images/${imageId}?deleteCrops=true`
        : `${API_BASE_URL}/images/${imageId}`;

    const response = await fetch(url, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw await createApiError(response, 'Failed to delete image');
    }
    return response.json();
}

// ============================================================================
// EXPORT API
// ============================================================================

/**
 * Upload exported canvas as an image
 * @param {string} canvasId - The ID of the canvas
 * @param {Blob} imageBlob - The exported canvas as a Blob
 * @param {Object} options - Export options (format, quality)
 */
export async function uploadExportedCanvas(canvasId, imageBlob, options = {}) {
    const formData = new FormData();
    formData.append('image', imageBlob, `export-${Date.now()}.${options.format || 'png'}`);

    const response = await fetch(`${API_BASE_URL}/canvas/${canvasId}/export`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw await createApiError(response, 'Failed to upload export');
    }
    return response.json();
}

// ============================================================================
// HELPERS
// ============================================================================

async function createApiError(response, defaultMessage) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    return new Error(error.message || `${defaultMessage}: ${response.status}`);
}
