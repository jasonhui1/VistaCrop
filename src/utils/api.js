/**
 * API utilities for saving and loading image cropper data
 */

const API_BASE_URL = '/api'; // Adjust to your server's base URL

/**
 * Save crops to the server
 * 
 * @param {string} imageId - The ID of the image already stored on the server
 * @param {Array} crops - Array of crop objects
 * @returns {Promise<Object>} - The server response
 */
export async function saveCrops(imageId, crops) {
    const payload = crops.map(crop => ({
        id: crop.id,
        x: crop.x,
        y: crop.y,
        width: crop.width,
        height: crop.height,
        originalImageWidth: crop.originalImageWidth,
        originalImageHeight: crop.originalImageHeight,
        rotation: crop.rotation,
        sourceRotation: crop.sourceRotation,
        filter: crop.filter,
        tags: crop.tags,
        notes: crop.notes,
        imageData: crop.imageData
    }));

    const response = await fetch(`${API_BASE_URL}/images/${imageId}/crops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crops: payload, updatedAt: Date.now() })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `Failed to save crops: ${response.status}`);
    }

    return response.json();
}

/**
 * Save canvas composition and placed items to the server
 * 
 * @param {string} canvasId - The ID of the canvas/composition
 * @param {Object} composition - Canvas composition settings
 * @param {Array} placedItems - Array of placed items in freeform mode
 * @returns {Promise<Object>} - The server response
 */
export async function saveCanvas(canvasId, composition, placedItems) {
    const compositionPayload = {
        layoutId: composition.layoutId,
        pagePreset: composition.pagePreset,
        pageWidth: composition.pageWidth,
        pageHeight: composition.pageHeight,
        margin: composition.margin,
        backgroundColor: composition.backgroundColor,
        assignments: composition.assignments
    };

    const placedItemsPayload = placedItems.map(item => ({
        id: item.id,
        cropId: item.cropId,
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
        objectFit: item.objectFit,
        rotation: item.rotation,
        frameShape: item.frameShape,
        customPoints: item.customPoints,
        borderStyle: item.borderStyle,
        borderColor: item.borderColor,
        borderWidth: item.borderWidth
    }));

    const response = await fetch(`${API_BASE_URL}/canvas/${canvasId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            composition: compositionPayload,
            placedItems: placedItemsPayload,
            updatedAt: Date.now()
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `Failed to save canvas: ${response.status}`);
    }

    return response.json();
}

/**
 * Load crops from the server
 * 
 * @param {string} imageId - The ID of the image to load crops for
 * @returns {Promise<Array>} - Array of crop objects
 */
export async function loadCrops(imageId) {
    const response = await fetch(`${API_BASE_URL}/images/${imageId}/crops`);

    if (!response.ok) {
        if (response.status === 404) return [];
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `Failed to load crops: ${response.status}`);
    }

    const data = await response.json();
    return data.crops || [];
}

/**
 * Load canvas composition from the server
 * 
 * @param {string} canvasId - The ID of the canvas/composition
 * @returns {Promise<Object|null>} - The saved canvas data or null
 */
export async function loadCanvas(canvasId) {
    const response = await fetch(`${API_BASE_URL}/canvas/${canvasId}`);

    if (!response.ok) {
        if (response.status === 404) return null;
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `Failed to load canvas: ${response.status}`);
    }

    return response.json();
}

/**
 * Upload exported canvas as an image to the server
 * 
 * @param {string} imageId - The ID of the source image
 * @param {Blob} imageBlob - The exported canvas as a Blob
 * @param {Object} options - Export options
 * @returns {Promise<Object>} - The server response with the exported image URL
 */
export async function uploadExportedCanvas(imageId, imageBlob, options = {}) {
    const formData = new FormData();
    formData.append('image', imageBlob, `export-${Date.now()}.${options.format || 'png'}`);
    formData.append('imageId', imageId);

    const response = await fetch(`${API_BASE_URL}/images/${imageId}/export`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `Failed to upload: ${response.status}`);
    }

    return response.json();
}
