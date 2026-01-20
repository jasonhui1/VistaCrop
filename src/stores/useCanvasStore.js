import { create } from 'zustand'
import { createEmptyPage, PAGE_PRESETS } from '../utils/panelLayouts'

/**
 * Canvas Store - manages canvas/pages/items state
 * Separated from UI state for cleaner architecture
 * 
 * Note: Selection state (selectedItemId, selectedPanelIndex) is in useUIStore
 * Note: Persistence state is in usePersistenceStore
 */

// Simple undo/redo implementation for placed items
const createUndoRedoSlice = (set, get) => ({
    // Undo/redo state
    undoStack: [],
    redoStack: [],
    maxHistoryLength: 50,

    // Push current state to undo stack (call before making changes)
    pushToUndoStack: () => {
        const { placedItems, undoStack, maxHistoryLength } = get()
        const newStack = [...undoStack, [...placedItems]]
        if (newStack.length > maxHistoryLength) {
            newStack.shift()
        }
        set({ undoStack: newStack, redoStack: [] })
    },

    // Record state without clearing redo (for silent updates during drag)
    recordState: () => {
        const { placedItems, undoStack, maxHistoryLength } = get()
        const newStack = [...undoStack, [...placedItems]]
        if (newStack.length > maxHistoryLength) {
            newStack.shift()
        }
        set({ undoStack: newStack })
    },

    undo: () => {
        const { undoStack, placedItems, redoStack, syncPlacedItemsToPage } = get()
        if (undoStack.length === 0) return

        const newUndoStack = [...undoStack]
        const previousState = newUndoStack.pop()

        set({
            undoStack: newUndoStack,
            redoStack: [...redoStack, [...placedItems]],
            placedItems: previousState
        })

        syncPlacedItemsToPage(previousState)
    },

    redo: () => {
        const { undoStack, placedItems, redoStack, syncPlacedItemsToPage } = get()
        if (redoStack.length === 0) return

        const newRedoStack = [...redoStack]
        const nextState = newRedoStack.pop()

        set({
            redoStack: newRedoStack,
            undoStack: [...undoStack, [...placedItems]],
            placedItems: nextState
        })

        syncPlacedItemsToPage(nextState)
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,

    resetHistory: (initialState = []) => {
        set({
            placedItems: initialState,
            undoStack: [],
            redoStack: []
        })
    }
})

export const useCanvasStore = create((set, get) => ({
    // === MODE STATE ===
    mode: 'freeform', // 'panels' | 'freeform'

    // === MULTI-PAGE STATE ===
    pages: [createEmptyPage(1)],
    currentPageIndex: 0,

    // === FREEFORM STATE ===
    placedItems: [],

    // === UNDO/REDO (mixed in) ===
    ...createUndoRedoSlice(set, get),

    // === SETTERS ===
    setMode: (mode) => set({ mode }),

    // === DERIVED STATE HELPERS ===
    getCurrentPage: () => {
        const { pages, currentPageIndex } = get()
        return pages[currentPageIndex] || pages[0]
    },

    getComposition: () => {
        const page = get().getCurrentPage()
        return {
            id: page.id,
            name: page.name,
            layoutId: page.layoutId || 'single',
            pagePreset: page.pagePreset,
            pageWidth: page.pageWidth,
            pageHeight: page.pageHeight,
            margin: page.margin || 40,
            backgroundColor: page.backgroundColor,
            assignments: page.assignments || [],
            createdAt: page.createdAt,
            updatedAt: page.updatedAt
        }
    },

    // === PAGE MANAGEMENT ===
    updateCurrentPage: (updates) => {
        const { currentPageIndex } = get()
        set(state => ({
            pages: state.pages.map((page, idx) =>
                idx === currentPageIndex
                    ? { ...page, ...updates, updatedAt: Date.now() }
                    : page
            )
        }))
    },

    syncPlacedItemsToPage: (newPlacedItems) => {
        const { currentPageIndex } = get()
        set(state => ({
            pages: state.pages.map((page, idx) =>
                idx === currentPageIndex
                    ? { ...page, placedItems: newPlacedItems, updatedAt: Date.now() }
                    : page
            )
        }))
    },

    selectPage: (index) => {
        const { currentPageIndex, placedItems, pages, resetHistory } = get()
        if (index === currentPageIndex) return

        // Save current placed items to current page
        set(state => ({
            pages: state.pages.map((page, idx) =>
                idx === currentPageIndex
                    ? { ...page, placedItems: placedItems }
                    : page
            ),
            currentPageIndex: index
        }))

        // Reset undo history for new page
        resetHistory(pages[index]?.placedItems || [])
    },

    addPage: () => {
        const { currentPageIndex, placedItems, pages, resetHistory, getCurrentPage } = get()
        const currentPage = getCurrentPage()

        // Save current items first and add new page
        set(state => {
            const updated = state.pages.map((page, idx) =>
                idx === currentPageIndex
                    ? { ...page, placedItems: placedItems }
                    : page
            )
            const newPage = createEmptyPage(updated.length + 1, currentPage.pagePreset)
            return {
                pages: [...updated, newPage],
                currentPageIndex: pages.length
            }
        })

        resetHistory([])
    },

    deletePage: (index) => {
        const { pages, currentPageIndex, resetHistory } = get()
        if (pages.length <= 1) return // Must have at least one page

        set(state => {
            const newPages = state.pages.filter((_, idx) => idx !== index)
            let newIndex = currentPageIndex

            if (index <= currentPageIndex && currentPageIndex > 0) {
                newIndex = currentPageIndex - 1
            } else if (index === currentPageIndex) {
                newIndex = Math.min(index, newPages.length - 1)
            }

            return {
                pages: newPages,
                currentPageIndex: newIndex
            }
        })

        const { pages: updatedPages, currentPageIndex: newIdx } = get()
        resetHistory(updatedPages[newIdx]?.placedItems || [])
    },

    duplicatePage: (index) => {
        const { pages, currentPageIndex, placedItems } = get()
        const pageToDuplicate = pages[index]
        if (!pageToDuplicate) return

        set(state => {
            const updated = state.pages.map((page, idx) =>
                idx === currentPageIndex
                    ? { ...page, placedItems: placedItems }
                    : page
            )
            const duplicated = {
                ...pageToDuplicate,
                id: Date.now(),
                name: `${pageToDuplicate.name} (copy)`,
                placedItems: pageToDuplicate.placedItems.map(item => ({
                    ...item,
                    id: Date.now() + Math.random()
                })),
                createdAt: Date.now(),
                updatedAt: Date.now()
            }
            const before = updated.slice(0, index + 1)
            const after = updated.slice(index + 1)
            return { pages: [...before, duplicated, ...after] }
        })
    },

    // === COMPOSITION HANDLERS ===
    handleLayoutChange: (layoutId) => {
        get().updateCurrentPage({ layoutId })
    },

    handlePagePresetChange: (presetKey) => {
        const preset = PAGE_PRESETS[presetKey]
        if (preset) {
            get().updateCurrentPage({
                pagePreset: presetKey,
                pageWidth: preset.width,
                pageHeight: preset.height
            })
        }
    },

    handleUpdatePageSize: (updates) => {
        get().updateCurrentPage({
            ...updates,
            pagePreset: 'custom'
        })
    },

    // === PLACED ITEMS HANDLERS ===
    setPlacedItems: (items) => {
        get().pushToUndoStack()
        set({ placedItems: items })
        get().syncPlacedItemsToPage(items)
    },

    setPlacedItemsSilent: (updater) => {
        set(state => {
            const newItems = typeof updater === 'function' ? updater(state.placedItems) : updater
            return { placedItems: newItems }
        })
    },

    updateItem: (itemId, updates) => {
        const { placedItems, syncPlacedItemsToPage, pushToUndoStack } = get()
        pushToUndoStack()
        const newItems = placedItems.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        )
        set({ placedItems: newItems })
        syncPlacedItemsToPage(newItems)
    },

    updateItemSilent: (itemId, updates) => {
        set(state => ({
            placedItems: state.placedItems.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
            )
        }))
    },

    deleteItem: (itemId) => {
        const { placedItems, syncPlacedItemsToPage, pushToUndoStack } = get()
        pushToUndoStack()
        const newItems = placedItems.filter(item => item.id !== itemId)
        set({ placedItems: newItems })
        syncPlacedItemsToPage(newItems)
    },

    clearItems: () => {
        const { syncPlacedItemsToPage, pushToUndoStack } = get()
        pushToUndoStack()
        set({ placedItems: [] })
        syncPlacedItemsToPage([])
    },

    // Drop a crop onto the freeform canvas
    dropCropToFreeform: (crop, x, y, pageWidth, pageHeight) => {
        if (!crop) return

        const { placedItems, syncPlacedItemsToPage, pushToUndoStack } = get()

        const cropAspectRatio = crop.width / crop.height
        let width = pageWidth * 0.25
        let height = width / cropAspectRatio

        const maxWidth = pageWidth * 0.5
        const maxHeight = pageHeight * 0.5
        if (height > maxHeight) {
            height = maxHeight
            width = height * cropAspectRatio
        }
        if (width > maxWidth) {
            width = maxWidth
            height = width / cropAspectRatio
        }

        const newItem = {
            id: Date.now(),
            cropId: crop.id,
            x: Math.max(0, x - width / 2),
            y: Math.max(0, y - height / 2),
            width,
            height,
            objectFit: 'contain'
        }

        pushToUndoStack()
        const newItems = [...placedItems, newItem]
        set({ placedItems: newItems })
        syncPlacedItemsToPage(newItems)

        return newItem.id // Return new item ID for selection
    },

    // Add multiple crops at once (bulk selection)
    addMultipleCrops: (cropsList, pageWidth, pageHeight) => {
        const { placedItems, syncPlacedItemsToPage, pushToUndoStack } = get()

        const newItems = []
        const itemSize = pageWidth * 0.2
        const padding = 20
        const itemsPerRow = Math.floor(pageWidth / (itemSize + padding))

        cropsList.forEach((crop, index) => {
            const row = Math.floor(index / itemsPerRow)
            const col = index % itemsPerRow

            const cropAspectRatio = crop.width / crop.height
            let width = itemSize
            let height = width / cropAspectRatio

            if (height > itemSize) {
                height = itemSize
                width = height * cropAspectRatio
            }

            newItems.push({
                id: Date.now() + index,
                cropId: crop.id,
                x: padding + col * (itemSize + padding),
                y: padding + row * (itemSize + padding),
                width,
                height,
                objectFit: 'contain'
            })
        })

        if (newItems.length > 0) {
            pushToUndoStack()
            const allItems = [...placedItems, ...newItems]
            set({ placedItems: allItems })
            syncPlacedItemsToPage(allItems)
            return newItems[newItems.length - 1].id // Return last item ID for selection
        }
        return null
    },

    // Nudge selected item (requires selectedItemId from UI store)
    nudgeItem: (itemId, dx, dy) => {
        if (!itemId) return
        const { placedItems, syncPlacedItemsToPage, pushToUndoStack } = get()

        pushToUndoStack()
        const newItems = placedItems.map(item =>
            item.id === itemId
                ? { ...item, x: item.x + dx, y: item.y + dy }
                : item
        )
        set({ placedItems: newItems })
        syncPlacedItemsToPage(newItems)
    },

    // Handle drag end (record state for undo)
    handleDragEnd: () => {
        const { placedItems, syncPlacedItemsToPage, recordState } = get()
        recordState()
        syncPlacedItemsToPage(placedItems)
    },

    // === PANEL MODE HANDLERS ===
    dropCropToPanel: (panelIndex, cropId) => {
        const { getComposition, updateCurrentPage } = get()
        const composition = getComposition()
        const newAssignments = [...(composition.assignments || [])]
        newAssignments[panelIndex] = { ...newAssignments[panelIndex], cropId }
        updateCurrentPage({ assignments: newAssignments })
    },

    clearPanel: (panelIndex) => {
        const { getComposition, updateCurrentPage } = get()
        const composition = getComposition()
        const newAssignments = [...(composition.assignments || [])]
        newAssignments[panelIndex] = { panelIndex, cropId: null, zoom: 1, offsetX: 0, offsetY: 0 }
        updateCurrentPage({ assignments: newAssignments })
    },

    handlePanelZoom: (panelIndex, zoom) => {
        const { getComposition, updateCurrentPage } = get()
        const composition = getComposition()
        const newAssignments = [...(composition.assignments || [])]
        newAssignments[panelIndex] = { ...newAssignments[panelIndex], zoom }
        updateCurrentPage({ assignments: newAssignments })
    },

    // === PERSISTENCE HELPERS ===
    getPagesForSave: () => {
        const { pages, currentPageIndex, placedItems } = get()
        return pages.map((page, idx) =>
            idx === currentPageIndex
                ? { ...page, placedItems: placedItems }
                : page
        )
    },

    loadState: (canvasData) => {
        const { resetHistory } = get()

        // Support both old single-page format and new multi-page format
        if (canvasData.pages) {
            set({
                pages: canvasData.pages,
                currentPageIndex: 0
            })
            resetHistory(canvasData.pages[0]?.placedItems || [])
        } else if (canvasData.composition) {
            // Legacy format: convert to page
            const legacyPage = {
                id: canvasData.composition.id || Date.now(),
                name: 'Page 1',
                pagePreset: canvasData.composition.pagePreset,
                pageWidth: canvasData.composition.pageWidth,
                pageHeight: canvasData.composition.pageHeight,
                backgroundColor: canvasData.composition.backgroundColor,
                placedItems: canvasData.placedItems || [],
                createdAt: canvasData.composition.createdAt || Date.now(),
                updatedAt: Date.now()
            }
            set({
                pages: [legacyPage],
                currentPageIndex: 0
            })
            resetHistory(canvasData.placedItems || [])
        }

        if (canvasData.mode) {
            set({ mode: canvasData.mode })
        }
    },

    // Get item by ID (helper for components)
    getItemById: (itemId) => {
        return get().placedItems.find(item => item.id === itemId)
    }
}))

// Backward compatibility alias
export const useComposerStore = useCanvasStore
