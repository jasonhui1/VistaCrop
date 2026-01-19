import { useCallback, useMemo, useState } from 'react'
import PageCanvas from './PageCanvas'
import FreeformCanvas from './FreeformCanvas'
import { LeftSidebar, RightSidebar, CanvasToolbar, CanvasGallery, PageStrip } from './composer'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useCanvasPersistence } from '../hooks/useCanvasPersistence'
import {
    getLayout,
    calculatePanelPositions,
    createEmptyComposition,
    createEmptyPage,
    updatePanelAssignment,
    clearPanelAssignment,
    changeCompositionLayout,
    PAGE_PRESETS
} from '../utils/panelLayouts'
import { exportCanvas, exportAllPages, generateThumbnail } from '../utils/exportCanvas'

/**
 * ComposerView - Main composition view for creating manga-style page layouts
 * Supports both panel-based layouts and freeform placement with multi-page support
 */
function ComposerView({ crops }) {
    // === MODE STATE ===
    const [mode, setMode] = useState('freeform')

    // === MULTI-PAGE STATE ===
    const [pages, setPages] = useState(() => [createEmptyPage(1)])
    const [currentPageIndex, setCurrentPageIndex] = useState(0)

    // Current page derived state
    const currentPage = pages[currentPageIndex] || pages[0]

    // Create a composition-like object from current page for compatibility
    const composition = useMemo(() => ({
        id: currentPage.id,
        name: currentPage.name,
        layoutId: currentPage.layoutId || 'single',
        pagePreset: currentPage.pagePreset,
        pageWidth: currentPage.pageWidth,
        pageHeight: currentPage.pageHeight,
        margin: currentPage.margin || 40,
        backgroundColor: currentPage.backgroundColor,
        assignments: currentPage.assignments || [],
        createdAt: currentPage.createdAt,
        updatedAt: currentPage.updatedAt
    }), [currentPage])

    // === FREEFORM STATE (with undo/redo) - synced with current page ===
    const {
        state: placedItems,
        setState: setPlacedItems,
        setStateSilent: setPlacedItemsSilent,
        recordState: recordPlacedItemsState,
        undo,
        redo,
        canUndo,
        canRedo,
        reset: resetPlacedItems
    } = useUndoRedo(currentPage.placedItems || [])

    const [selectedItemId, setSelectedItemId] = useState(null)
    const [selectedPanelIndex, setSelectedPanelIndex] = useState(null)

    // === UI STATE ===
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
    const [editingCanvasSize, setEditingCanvasSize] = useState(false)
    const [rightSidebarTab, setRightSidebarTab] = useState('crops')
    const [showGallery, setShowGallery] = useState(false)

    // === PAGE MANAGEMENT ===
    const updateCurrentPage = useCallback((updates) => {
        setPages(prev => prev.map((page, idx) =>
            idx === currentPageIndex
                ? { ...page, ...updates, updatedAt: Date.now() }
                : page
        ))
    }, [currentPageIndex])

    // Sync placedItems changes back to pages
    const syncPlacedItemsToPage = useCallback((newPlacedItems) => {
        setPages(prev => prev.map((page, idx) =>
            idx === currentPageIndex
                ? { ...page, placedItems: newPlacedItems, updatedAt: Date.now() }
                : page
        ))
    }, [currentPageIndex])

    // When switching pages, save current items and load new page items
    const handleSelectPage = useCallback((index) => {
        if (index === currentPageIndex) return

        // Save current placed items to current page
        setPages(prev => prev.map((page, idx) =>
            idx === currentPageIndex
                ? { ...page, placedItems: placedItems }
                : page
        ))

        // Switch to new page
        setCurrentPageIndex(index)
        resetPlacedItems(pages[index]?.placedItems || [])
        setSelectedItemId(null)
        setSelectedPanelIndex(null)
    }, [currentPageIndex, placedItems, pages, resetPlacedItems])

    const handleAddPage = useCallback(() => {
        // Save current items first
        setPages(prev => {
            const updated = prev.map((page, idx) =>
                idx === currentPageIndex
                    ? { ...page, placedItems: placedItems }
                    : page
            )
            const newPage = createEmptyPage(updated.length + 1, currentPage.pagePreset)
            return [...updated, newPage]
        })
        // Switch to new page
        setCurrentPageIndex(pages.length)
        resetPlacedItems([])
        setSelectedItemId(null)
    }, [currentPageIndex, placedItems, pages.length, currentPage.pagePreset, resetPlacedItems])

    const handleDeletePage = useCallback((index) => {
        if (pages.length <= 1) return // Must have at least one page

        setPages(prev => prev.filter((_, idx) => idx !== index))

        // Adjust current index if needed
        if (index <= currentPageIndex && currentPageIndex > 0) {
            const newIndex = currentPageIndex - 1
            setCurrentPageIndex(newIndex)
            resetPlacedItems(pages[newIndex]?.placedItems || [])
        } else if (index === currentPageIndex) {
            // Deleted current page, load previous or next
            const newIndex = Math.min(index, pages.length - 2)
            resetPlacedItems(pages[newIndex === index ? index + 1 : newIndex]?.placedItems || [])
        }
        setSelectedItemId(null)
    }, [pages, currentPageIndex, resetPlacedItems])

    const handleDuplicatePage = useCallback((index) => {
        const pageToDuplicate = pages[index]
        if (!pageToDuplicate) return

        // Save current items first
        setPages(prev => {
            const updated = prev.map((page, idx) =>
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
            // Insert after the duplicated page
            const before = updated.slice(0, index + 1)
            const after = updated.slice(index + 1)
            return [...before, duplicated, ...after]
        })
    }, [pages, currentPageIndex, placedItems])

    // === CANVAS PERSISTENCE ===
    const handleLoadState = useCallback((canvasData) => {
        // Support both old single-page format and new multi-page format
        if (canvasData.pages) {
            setPages(canvasData.pages)
            setCurrentPageIndex(0)
            resetPlacedItems(canvasData.pages[0]?.placedItems || [])
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
            setPages([legacyPage])
            setCurrentPageIndex(0)
            resetPlacedItems(canvasData.placedItems || [])
        }
        if (canvasData.mode) setMode(canvasData.mode)
        setSelectedItemId(null)
        setSelectedPanelIndex(null)
    }, [resetPlacedItems])

    // Gather current state for saving (sync current page items first)
    const getPagesForSave = useCallback(() => {
        return pages.map((page, idx) =>
            idx === currentPageIndex
                ? { ...page, placedItems: placedItems }
                : page
        )
    }, [pages, currentPageIndex, placedItems])

    // Thumbnail generator for canvas previews (use current page)
    const getThumbnail = useCallback(async () => {
        return generateThumbnail({
            composition,
            placedItems,
            crops,
            mode
        })
    }, [composition, placedItems, crops, mode])

    const persistence = useCanvasPersistence({
        pages: getPagesForSave(),
        mode,
        onLoadState: handleLoadState,
        getThumbnail
    })

    // === DERIVED STATE ===
    const currentLayout = useMemo(() => getLayout(composition.layoutId), [composition.layoutId])

    const panels = useMemo(() =>
        calculatePanelPositions(
            currentLayout,
            composition.pageWidth,
            composition.pageHeight,
            composition.margin
        ),
        [currentLayout, composition.pageWidth, composition.pageHeight, composition.margin]
    )

    const selectedItem = selectedItemId
        ? placedItems.find(item => item.id === selectedItemId)
        : null

    const selectedAssignment = selectedPanelIndex !== null
        ? composition.assignments[selectedPanelIndex]
        : null

    // === COMPOSITION HANDLERS ===
    const handleLayoutChange = useCallback((layoutId) => {
        updateCurrentPage({ layoutId })
        setSelectedPanelIndex(null)
    }, [updateCurrentPage])

    const handlePagePresetChange = useCallback((presetKey) => {
        const preset = PAGE_PRESETS[presetKey]
        if (preset) {
            updateCurrentPage({
                pagePreset: presetKey,
                pageWidth: preset.width,
                pageHeight: preset.height
            })
        }
    }, [updateCurrentPage])

    const handleCompositionChange = useCallback((updates) => {
        updateCurrentPage(updates)
    }, [updateCurrentPage])

    const handleUpdatePageSize = useCallback((updates) => {
        updateCurrentPage({
            ...updates,
            pagePreset: 'custom'
        })
    }, [updateCurrentPage])

    // === PANEL MODE HANDLERS ===
    const handleDropCropToPanel = useCallback((panelIndex, cropId) => {
        const newAssignments = [...(composition.assignments || [])]
        newAssignments[panelIndex] = { ...newAssignments[panelIndex], cropId }
        updateCurrentPage({ assignments: newAssignments })
    }, [composition.assignments, updateCurrentPage])

    const handleClearPanel = useCallback((panelIndex) => {
        const newAssignments = [...(composition.assignments || [])]
        newAssignments[panelIndex] = { panelIndex, cropId: null, zoom: 1, offsetX: 0, offsetY: 0 }
        updateCurrentPage({ assignments: newAssignments })
    }, [composition.assignments, updateCurrentPage])

    const handlePanelZoom = useCallback((panelIndex, zoom) => {
        const newAssignments = [...(composition.assignments || [])]
        newAssignments[panelIndex] = { ...newAssignments[panelIndex], zoom }
        updateCurrentPage({ assignments: newAssignments })
    }, [composition.assignments, updateCurrentPage])

    // === FREEFORM MODE HANDLERS ===
    const handleDropCropToFreeform = useCallback((cropId, x, y) => {
        const crop = crops.find(c => c.id === cropId)
        if (!crop) return

        const cropAspectRatio = crop.width / crop.height
        let width = composition.pageWidth * 0.25
        let height = width / cropAspectRatio

        const maxWidth = composition.pageWidth * 0.5
        const maxHeight = composition.pageHeight * 0.5
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
            cropId,
            x: Math.max(0, x - width / 2),
            y: Math.max(0, y - height / 2),
            width,
            height,
            objectFit: 'contain'
        }
        const newItems = [...placedItems, newItem]
        setPlacedItems(newItems)
        syncPlacedItemsToPage(newItems)
        setSelectedItemId(newItem.id)
    }, [crops, composition.pageWidth, composition.pageHeight, setPlacedItems, placedItems, syncPlacedItemsToPage])

    const handleUpdateItem = useCallback((itemId, updates) => {
        const newItems = placedItems.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        )
        setPlacedItems(newItems)
        syncPlacedItemsToPage(newItems)
    }, [setPlacedItems, placedItems, syncPlacedItemsToPage])

    const handleUpdateItemSilent = useCallback((itemId, updates) => {
        setPlacedItemsSilent(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ))
    }, [setPlacedItemsSilent])

    const handleDragEnd = useCallback(() => {
        recordPlacedItemsState()
        // Sync to page after drag
        syncPlacedItemsToPage(placedItems)
    }, [recordPlacedItemsState, syncPlacedItemsToPage, placedItems])

    const handleDeleteItem = useCallback((itemId) => {
        const newItems = placedItems.filter(item => item.id !== itemId)
        setPlacedItems(newItems)
        syncPlacedItemsToPage(newItems)
        if (selectedItemId === itemId) {
            setSelectedItemId(null)
        }
    }, [selectedItemId, setPlacedItems, placedItems, syncPlacedItemsToPage])

    const handleClear = useCallback(() => {
        setPlacedItems([])
        syncPlacedItemsToPage([])
        setSelectedItemId(null)
    }, [setPlacedItems, syncPlacedItemsToPage])

    const handleNudge = useCallback(({ dx, dy }) => {
        if (!selectedItemId) return
        const newItems = placedItems.map(item =>
            item.id === selectedItemId
                ? { ...item, x: item.x + dx, y: item.y + dy }
                : item
        )
        setPlacedItems(newItems)
        syncPlacedItemsToPage(newItems)
    }, [selectedItemId, setPlacedItems, placedItems, syncPlacedItemsToPage])

    const handleCropDragStart = useCallback((e, crop) => {
        e.dataTransfer.setData('application/crop-id', crop.id.toString())
        e.dataTransfer.effectAllowed = 'copy'
    }, [])

    // Handler for adding multiple crops at once (bulk selection)
    const handleAddMultipleCrops = useCallback((cropIds) => {
        const newItems = []
        const itemSize = composition.pageWidth * 0.2
        const padding = 20
        const itemsPerRow = Math.floor(composition.pageWidth / (itemSize + padding))

        cropIds.forEach((cropId, index) => {
            const crop = crops.find(c => c.id === cropId)
            if (!crop) return

            const row = Math.floor(index / itemsPerRow)
            const col = index % itemsPerRow

            const cropAspectRatio = crop.width / crop.height
            let width = itemSize
            let height = width / cropAspectRatio

            // Constrain height
            if (height > itemSize) {
                height = itemSize
                width = height * cropAspectRatio
            }

            newItems.push({
                id: Date.now() + index,
                cropId,
                x: padding + col * (itemSize + padding),
                y: padding + row * (itemSize + padding),
                width,
                height,
                objectFit: 'contain'
            })
        })

        if (newItems.length > 0) {
            const allItems = [...placedItems, ...newItems]
            setPlacedItems(allItems)
            syncPlacedItemsToPage(allItems)
            setSelectedItemId(newItems[newItems.length - 1].id)
        }
    }, [crops, composition.pageWidth, setPlacedItems, placedItems, syncPlacedItemsToPage])

    // === EXPORT HANDLERS ===
    const handleExport = useCallback(async () => {
        await exportCanvas({ composition, panels, crops, mode, placedItems })
    }, [composition, panels, crops, mode, placedItems])

    const handleExportAll = useCallback(async () => {
        const allPages = getPagesForSave()
        await exportAllPages({ pages: allPages, crops, mode })
    }, [getPagesForSave, crops, mode])

    // === KEYBOARD SHORTCUTS ===
    useKeyboardShortcuts({
        enabled: mode === 'freeform',
        onDelete: () => selectedItemId && handleDeleteItem(selectedItemId),
        onUndo: undo,
        onRedo: redo,
        onSave: persistence.handleSave,
        onNudge: handleNudge
    })

    // === RENDER ===
    return (
        <div className="glass-card flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <LeftSidebar
                isOpen={leftSidebarOpen}
                onToggle={() => setLeftSidebarOpen(!leftSidebarOpen)}
                mode={mode}
                onModeChange={setMode}
                composition={composition}
                onCompositionChange={handleCompositionChange}
                onLayoutChange={handleLayoutChange}
                onPagePresetChange={handlePagePresetChange}
            />

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col p-2 overflow-hidden">
                {/* Toolbar */}
                <CanvasToolbar
                    mode={mode}
                    layoutName={currentLayout.name}
                    itemCount={placedItems.length}
                    panelCount={currentLayout.panels.length}
                    editingCanvasSize={editingCanvasSize}
                    onToggleEditCanvasSize={() => setEditingCanvasSize(!editingCanvasSize)}
                    onClear={handleClear}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    onUndo={undo}
                    onRedo={redo}
                    canvasId={persistence.canvasId}
                    isSaving={persistence.isSaving}
                    isLoading={persistence.isLoading}
                    onFetchCanvases={persistence.fetchSavedCanvases}
                    onOpenGallery={() => setShowGallery(true)}
                    onSave={persistence.handleSave}
                    onExport={handleExport}
                    onExportAll={pages.length > 1 ? handleExportAll : null}
                    hasUnsavedChanges={persistence.hasUnsavedChanges}
                    lastSavedAt={persistence.lastSavedAt}
                    pageCount={pages.length}
                    currentPage={currentPageIndex + 1}
                />

                {/* Page Strip */}
                {mode === 'freeform' && (
                    <PageStrip
                        pages={pages.map((p, i) => i === currentPageIndex ? { ...p, placedItems } : p)}
                        currentPageIndex={currentPageIndex}
                        onSelectPage={handleSelectPage}
                        onAddPage={handleAddPage}
                        onDeletePage={handleDeletePage}
                        onDuplicatePage={handleDuplicatePage}
                        disabled={persistence.isSaving || persistence.isLoading}
                    />
                )}

                {/* Canvas Container */}
                <div className="flex-1 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-lg p-2 min-h-0">
                    {mode === 'panels' ? (
                        <PageCanvas
                            composition={composition}
                            panels={panels}
                            crops={crops}
                            selectedPanelIndex={selectedPanelIndex}
                            onSelectPanel={setSelectedPanelIndex}
                            onDropCrop={handleDropCropToPanel}
                        />
                    ) : (
                        <FreeformCanvas
                            composition={composition}
                            crops={crops}
                            placedItems={placedItems}
                            selectedItemId={selectedItemId}
                            onSelectItem={setSelectedItemId}
                            onUpdateItem={handleUpdateItem}
                            onUpdateItemSilent={handleUpdateItemSilent}
                            onDragEnd={handleDragEnd}
                            onDropCrop={handleDropCropToFreeform}
                            onDeleteItem={handleDeleteItem}
                            onUpdatePageSize={editingCanvasSize ? handleUpdatePageSize : undefined}
                        />
                    )}
                </div>

                {/* Panel Controls (panel mode) */}
                {mode === 'panels' && selectedPanelIndex !== null && selectedAssignment && (
                    <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-xl flex items-center gap-6">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                            Panel {selectedPanelIndex + 1}
                        </span>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-[var(--text-muted)]">Zoom:</label>
                            <input
                                type="range"
                                min="0.5"
                                max="3"
                                step="0.1"
                                value={selectedAssignment.zoom}
                                onChange={(e) => handlePanelZoom(selectedPanelIndex, parseFloat(e.target.value))}
                                className="w-32"
                            />
                            <span className="text-sm text-[var(--text-secondary)] w-12">
                                {Math.round(selectedAssignment.zoom * 100)}%
                            </span>
                        </div>
                        <button
                            onClick={() => handleClearPanel(selectedPanelIndex)}
                            className="btn btn-secondary text-sm py-2 px-4"
                        >
                            Clear Panel
                        </button>
                    </div>
                )}
            </div>

            {/* Right Sidebar */}
            <RightSidebar
                isOpen={rightSidebarOpen}
                onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
                activeTab={rightSidebarTab}
                onTabChange={setRightSidebarTab}
                mode={mode}
                selectedItem={selectedItem}
                crops={crops}
                onUpdateItem={handleUpdateItem}
                onDeleteItem={handleDeleteItem}
                onCropDragStart={handleCropDragStart}
                onAddMultipleCrops={handleAddMultipleCrops}
            />

            {/* Canvas Gallery Modal */}
            <CanvasGallery
                isOpen={showGallery}
                onClose={() => setShowGallery(false)}
                canvases={persistence.savedCanvases}
                currentCanvasId={persistence.canvasId}
                onLoadCanvas={persistence.handleLoadCanvas}
                onDeleteCanvas={persistence.handleDeleteCanvas}
                isLoading={persistence.isLoading}
            />
        </div>
    )
}

export default ComposerView
