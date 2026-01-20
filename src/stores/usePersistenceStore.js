import { create } from 'zustand'
import { createCanvas, saveCanvas, listCanvases, loadCanvas, deleteCanvas } from '../utils/api'
import { generateThumbnail } from '../utils/exportCanvas'

// Auto-save debounce delay in milliseconds
const AUTO_SAVE_DELAY = 30000

/**
 * Persistence Store - manages canvas save/load/delete operations
 * Separated from canvas data for cleaner architecture
 */
export const usePersistenceStore = create((set, get) => ({
    // === STATE ===
    canvasId: null,
    isSaving: false,
    isLoading: false,
    savedCanvases: [],
    hasUnsavedChanges: false,
    lastSavedAt: null,
    autoSaveTimerId: null,

    // === SETTERS ===
    setCanvasId: (id) => set({ canvasId: id }),
    setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
    markUnsavedChanges: () => {
        const { canvasId } = get()
        if (canvasId) {
            set({ hasUnsavedChanges: true })
        }
    },

    // === ACTIONS ===

    /**
     * Fetch list of saved canvases from server
     */
    fetchSavedCanvases: async () => {
        try {
            const canvases = await listCanvases()
            set({ savedCanvases: canvases || [] })
        } catch (error) {
            console.error('Failed to fetch canvases:', error)
            set({ savedCanvases: [] })
        }
    },

    /**
     * Save current canvas to server
     * @param {Function} getCanvasData - Function that returns { pages, mode, composition, placedItems, crops }
     */
    saveCanvas: async (getCanvasData) => {
        const { canvasId } = get()
        set({ isSaving: true })

        try {
            let currentCanvasId = canvasId
            const { pages, mode, composition, placedItems, crops } = getCanvasData()

            // Create new canvas if needed
            if (!currentCanvasId) {
                const result = await createCanvas({
                    name: `Canvas ${new Date().toLocaleString()}`,
                    mode
                })
                currentCanvasId = result.canvasId
                set({ canvasId: currentCanvasId })
            }

            // Generate thumbnail
            const thumbnail = await generateThumbnail({
                composition,
                placedItems,
                crops,
                mode
            })

            await saveCanvas(currentCanvasId, pages, mode, thumbnail)
            set({ hasUnsavedChanges: false, lastSavedAt: Date.now() })
            console.log('Canvas saved successfully:', currentCanvasId)
        } catch (error) {
            console.error('Failed to save canvas:', error)
        } finally {
            set({ isSaving: false })
        }
    },

    /**
     * Load a canvas from server
     * @param {string} selectedCanvasId - ID of canvas to load
     * @param {Function} onLoadState - Callback to apply loaded state
     */
    loadCanvas: async (selectedCanvasId, onLoadState) => {
        set({ isLoading: true })

        try {
            const canvasData = await loadCanvas(selectedCanvasId)
            if (canvasData) {
                set({ canvasId: selectedCanvasId, hasUnsavedChanges: false })
                onLoadState(canvasData)
                console.log('Canvas loaded successfully:', selectedCanvasId)
            }
        } catch (error) {
            console.error('Failed to load canvas:', error)
        } finally {
            set({ isLoading: false })
        }
    },

    /**
     * Delete a canvas from server
     * @param {string} canvasIdToDelete - ID of canvas to delete
     */
    deleteCanvas: async (canvasIdToDelete) => {
        try {
            await deleteCanvas(canvasIdToDelete)
            set((state) => ({
                savedCanvases: state.savedCanvases.filter(c => c.id !== canvasIdToDelete),
                canvasId: canvasIdToDelete === state.canvasId ? null : state.canvasId,
                hasUnsavedChanges: canvasIdToDelete === state.canvasId ? false : state.hasUnsavedChanges
            }))
            console.log('Canvas deleted:', canvasIdToDelete)
        } catch (error) {
            console.error('Failed to delete canvas:', error)
        }
    },

    /**
     * Start auto-save timer
     * @param {Function} getCanvasData - Function that returns canvas data for saving
     */
    startAutoSave: (getCanvasData) => {
        const { hasUnsavedChanges, canvasId, autoSaveTimerId } = get()

        if (!hasUnsavedChanges || !canvasId) return

        // Clear existing timer
        if (autoSaveTimerId) {
            clearTimeout(autoSaveTimerId)
        }

        const timerId = setTimeout(async () => {
            const { hasUnsavedChanges: stillUnsaved } = get()
            if (stillUnsaved) {
                await get().saveCanvas(getCanvasData)
                console.log('Auto-saved canvas')
            }
        }, AUTO_SAVE_DELAY)

        set({ autoSaveTimerId: timerId })
    },

    /**
     * Clear auto-save timer
     */
    clearAutoSave: () => {
        const { autoSaveTimerId } = get()
        if (autoSaveTimerId) {
            clearTimeout(autoSaveTimerId)
            set({ autoSaveTimerId: null })
        }
    },

    /**
     * Reset persistence state (for new canvas)
     */
    resetPersistence: () => {
        const { autoSaveTimerId } = get()
        if (autoSaveTimerId) {
            clearTimeout(autoSaveTimerId)
        }
        set({
            canvasId: null,
            hasUnsavedChanges: false,
            lastSavedAt: null,
            autoSaveTimerId: null
        })
    }
}))
