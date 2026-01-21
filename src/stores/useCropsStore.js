import { create } from 'zustand'
import { saveCrops, loadAllCrops, updateCrop, deleteCrop, uploadImage, getImageUrl, getCropImageUrl } from '../utils/api'

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
                    // Use direct URL instead of fetching base64
                    set({
                        imageId: firstCropImageId,
                        uploadedImage: getImageUrl(firstCropImageId)
                    })
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

        // Temporarily set the base64 for immediate preview while upload happens
        set({
            imageId: newImageId,
            uploadedImage: imageDataUrl,
            crops: [] // Clear crops for new image
        })

        // Upload the image to the server
        try {
            await uploadImage(newImageId, imageDataUrl)
            // After upload, switch to streaming URL (no more base64 in memory)
            set({ uploadedImage: getImageUrl(newImageId) })
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
            imageData: cropData.imageData, // Temporary base64 for immediate display
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

                // After save, update the crop to use streaming URL instead of base64
                const savedCrop = {
                    ...newCrop,
                    imageData: undefined, // Clear base64
                    imageDataUrl: getCropImageUrl(imageId, newCrop.id) // Use streaming URL
                }
                set({
                    crops: crops.map(c => c.id === newCrop.id ? savedCrop : c).concat([savedCrop])
                        .filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i) // Dedupe
                })

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

    // Set the active image (for viewing an existing image on canvas)
    // Uses URL directly for efficiency
    setActiveImage: (imageId, imageUrl) => set({ imageId, uploadedImage: imageUrl }),
}))
