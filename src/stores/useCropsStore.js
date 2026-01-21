import { create } from 'zustand'
import { saveCrops, loadAllCrops, updateCrop, deleteCrop, uploadImage, getImage } from '../utils/api'

/**
 * Crops store - manages crop data and associated image state
 * Replaces crop-related state from App.jsx
 */
export const useCropsStore = create((set, get) => ({
    // State
    crops: [],
    imageId: null,
    uploadedImage: null,

    // Load all crops from database on app start
    loadSavedCrops: async () => {
        try {
            const allCrops = await loadAllCrops()
            if (allCrops.length > 0) {
                set({ crops: allCrops })

                // Get the imageId from the first crop
                const firstCropImageId = allCrops[0].imageId
                if (firstCropImageId) {
                    set({ imageId: firstCropImageId })

                    // Fetch the original image from the server
                    try {
                        const imageData = await getImage(firstCropImageId)
                        if (imageData && imageData.data) {
                            set({ uploadedImage: imageData.data })
                        }
                    } catch (imgError) {
                        console.error('Failed to load image:', imgError)
                    }
                }
                console.log(`Loaded ${allCrops.length} crops from database`)
            }
        } catch (error) {
            console.error('Failed to load crops:', error)
        }
    },

    // Handle image upload
    handleImageUpload: async (imageDataUrl) => {
        const newImageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set({
            imageId: newImageId,
            uploadedImage: imageDataUrl,
            crops: [] // Clear crops for new image
        })

        // Upload the image to the server
        try {
            await uploadImage(newImageId, imageDataUrl)
            console.log(`Uploaded image: ${newImageId}`)
        } catch (error) {
            console.error('Failed to upload image:', error)
        }
    },

    // Add a new crop
    addCrop: async (cropData) => {
        const { crops, imageId } = get()

        const newCrop = {
            id: Date.now(),
            imageId: imageId,
            imageData: cropData.imageData,
            x: cropData.x,
            y: cropData.y,
            width: cropData.width,
            height: cropData.height,
            originalImageWidth: cropData.originalImageWidth,
            originalImageHeight: cropData.originalImageHeight,
            rotation: 0,
            tags: [],
            notes: '',
            sourceRotation: cropData.sourceRotation || 0,
            filter: cropData.filter || 'none'
        }

        const updatedCrops = [...crops, newCrop]
        set({ crops: updatedCrops })

        // Save only the new crop to server (not all crops)
        if (imageId) {
            try {
                // Get all crops for this imageId (including the new one)
                const cropsForImage = updatedCrops.filter(c => c.imageId === imageId)
                await saveCrops(imageId, cropsForImage)
                console.log(`Saved crop to image: ${imageId}`)
            } catch (error) {
                console.error('Failed to save crop:', error)
            }
        }
    },

    // Update an existing crop
    updateCrop: async (id, updates) => {
        const { crops, imageId } = get()
        const crop = crops.find(c => c.id === id)
        if (!crop) return

        const updatedCrops = crops.map(c =>
            c.id === id ? { ...c, ...updates } : c
        )
        set({ crops: updatedCrops })

        // Use granular update API
        try {
            const cropImageId = crop.imageId || imageId
            if (cropImageId) {
                await updateCrop(cropImageId, id, updates)
                console.log(`Updated crop ${id} for image: ${cropImageId}`)
            }
        } catch (error) {
            console.error('Failed to update crop:', error)
        }
    },

    // Delete a crop
    deleteCrop: async (id) => {
        const { crops, imageId } = get()
        const crop = crops.find(c => c.id === id)
        const updatedCrops = crops.filter(c => c.id !== id)
        set({ crops: updatedCrops })

        // Use granular delete API
        try {
            const cropImageId = crop?.imageId || imageId
            if (cropImageId) {
                await deleteCrop(cropImageId, id)
                console.log(`Deleted crop ${id} from image: ${cropImageId}`)
            }
        } catch (error) {
            console.error('Failed to delete crop:', error)
        }
    },

    // Set crops directly (for external updates)
    setCrops: (crops) => set({ crops }),

    // Set the active image (for viewing an existing image on canvas without clearing crops)
    setActiveImage: (imageId, imageData) => set({ imageId, uploadedImage: imageData }),
}))
