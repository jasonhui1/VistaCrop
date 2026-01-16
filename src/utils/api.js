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
 * Save canvas composition and placed items
 * @param {string} canvasId - The ID of the canvas
 * @param {Object} composition - Canvas composition settings
 * @param {Array} placedItems - Array of placed items in freeform mode
 */
export async function saveCanvas(canvasId, composition, placedItems) {
    const response = await fetch(`${API_BASE_URL}/canvas/${canvasId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ composition, placedItems, updatedAt: Date.now() })
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
