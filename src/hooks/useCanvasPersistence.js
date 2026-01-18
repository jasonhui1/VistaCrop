import { useCallback, useEffect, useRef, useState } from 'react'
import { createCanvas, saveCanvas, listCanvases, loadCanvas, deleteCanvas } from '../utils/api'

// Auto-save debounce delay in milliseconds
const AUTO_SAVE_DELAY = 30000

/**
 * Custom hook for canvas persistence (save, load, delete, auto-save)
 * @param {Object} params
 * @param {Object} params.composition - Canvas composition settings
 * @param {Array} params.placedItems - Array of placed items
 * @param {string} params.mode - Canvas mode
 * @param {Function} params.onLoadState - Callback when canvas is loaded
 * @param {Function} [params.getThumbnail] - Optional async function to generate thumbnail
 */
export function useCanvasPersistence({ composition, placedItems, mode, onLoadState, getThumbnail }) {
    const [canvasId, setCanvasId] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [savedCanvases, setSavedCanvases] = useState([])
    const [showLoadMenu, setShowLoadMenu] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const [lastSavedAt, setLastSavedAt] = useState(null)
    const autoSaveTimerRef = useRef(null)

    // Close load menu when clicking outside
    useEffect(() => {
        if (!showLoadMenu) return
        const handleClickOutside = () => setShowLoadMenu(false)
        const timer = setTimeout(() => {
            document.addEventListener('click', handleClickOutside)
        }, 0)
        return () => {
            clearTimeout(timer)
            document.removeEventListener('click', handleClickOutside)
        }
    }, [showLoadMenu])

    // Mark changes as unsaved when placedItems or composition changes
    useEffect(() => {
        if (canvasId) {
            setHasUnsavedChanges(true)
        }
    }, [placedItems, composition, canvasId])

    // Auto-save functionality
    useEffect(() => {
        if (!hasUnsavedChanges || !canvasId) return

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current)
        }

        autoSaveTimerRef.current = setTimeout(async () => {
            try {
                // Generate thumbnail if function is provided
                const thumbnail = getThumbnail ? await getThumbnail() : null
                await saveCanvas(canvasId, composition, placedItems, thumbnail)
                setHasUnsavedChanges(false)
                setLastSavedAt(Date.now())
                console.log('Auto-saved canvas:', canvasId)
            } catch (error) {
                console.error('Auto-save failed:', error)
            }
        }, AUTO_SAVE_DELAY)

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current)
            }
        }
    }, [hasUnsavedChanges, canvasId, composition, placedItems, getThumbnail])

    // Fetch list of saved canvases
    const fetchSavedCanvases = useCallback(async () => {
        try {
            const canvases = await listCanvases()
            setSavedCanvases(canvases || [])
        } catch (error) {
            console.error('Failed to fetch canvases:', error)
            setSavedCanvases([])
        }
    }, [])

    // Handle save to server
    const handleSave = useCallback(async () => {
        setIsSaving(true)
        try {
            let currentCanvasId = canvasId

            if (!currentCanvasId) {
                const result = await createCanvas({
                    name: `Canvas ${new Date().toLocaleString()}`,
                    mode
                })
                currentCanvasId = result.canvasId
                setCanvasId(currentCanvasId)
            }

            // Generate thumbnail if function is provided
            const thumbnail = getThumbnail ? await getThumbnail() : null
            await saveCanvas(currentCanvasId, composition, placedItems, thumbnail)
            setHasUnsavedChanges(false)
            setLastSavedAt(Date.now())
            console.log('Canvas saved successfully:', currentCanvasId)
        } catch (error) {
            console.error('Failed to save canvas:', error)
        } finally {
            setIsSaving(false)
        }
    }, [canvasId, composition, placedItems, mode, getThumbnail])

    // Handle loading a canvas
    const handleLoadCanvas = useCallback(async (selectedCanvasId) => {
        setIsLoading(true)
        setShowLoadMenu(false)
        try {
            const canvasData = await loadCanvas(selectedCanvasId)
            if (canvasData) {
                setCanvasId(selectedCanvasId)
                onLoadState(canvasData)
                setHasUnsavedChanges(false)
                console.log('Canvas loaded successfully:', selectedCanvasId)
            }
        } catch (error) {
            console.error('Failed to load canvas:', error)
        } finally {
            setIsLoading(false)
        }
    }, [onLoadState])

    // Handle deleting a canvas
    const handleDeleteCanvas = useCallback(async (canvasIdToDelete) => {
        try {
            await deleteCanvas(canvasIdToDelete)
            setSavedCanvases(prev => prev.filter(c => c.id !== canvasIdToDelete))

            if (canvasIdToDelete === canvasId) {
                setCanvasId(null)
                setHasUnsavedChanges(false)
            }

            console.log('Canvas deleted:', canvasIdToDelete)
        } catch (error) {
            console.error('Failed to delete canvas:', error)
        }
    }, [canvasId])

    const toggleLoadMenu = useCallback(() => {
        setShowLoadMenu(prev => !prev)
    }, [])

    return {
        canvasId,
        isSaving,
        isLoading,
        savedCanvases,
        showLoadMenu,
        hasUnsavedChanges,
        lastSavedAt,
        fetchSavedCanvases,
        handleSave,
        handleLoadCanvas,
        handleDeleteCanvas,
        toggleLoadMenu
    }
}
