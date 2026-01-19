import { useCallback, useMemo } from 'react'
import PageCanvas from './PageCanvas'
import FreeformCanvas from './FreeformCanvas'
import { LeftSidebar, RightSidebar, CanvasToolbar, CanvasGallery, PageStrip } from './composer'
import { PageNavigationArrows } from './composer/PageStrip'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useCanvasPersistence } from '../hooks/useCanvasPersistence'
import { useComposerStore, useCropsStore } from '../stores'
import {
    getLayout,
    calculatePanelPositions,
    PAGE_PRESETS
} from '../utils/panelLayouts'
import { exportCanvas, exportAllPages, generateThumbnail } from '../utils/exportCanvas'

/**
 * ComposerView - Main composition view for creating manga-style page layouts
 * Supports both panel-based layouts and freeform placement with multi-page support
 * State is now managed via useComposerStore
 */
function ComposerView() {
    // === CROPS FROM STORE ===
    const crops = useCropsStore((s) => s.crops)

    // === COMPOSER STATE FROM STORE ===
    const mode = useComposerStore((s) => s.mode)
    const setMode = useComposerStore((s) => s.setMode)
    const pages = useComposerStore((s) => s.pages)
    const currentPageIndex = useComposerStore((s) => s.currentPageIndex)
    const placedItems = useComposerStore((s) => s.placedItems)
    const selectedItemId = useComposerStore((s) => s.selectedItemId)
    const setSelectedItemId = useComposerStore((s) => s.setSelectedItemId)
    const selectedPanelIndex = useComposerStore((s) => s.selectedPanelIndex)
    const setSelectedPanelIndex = useComposerStore((s) => s.setSelectedPanelIndex)

    // UI State
    const leftSidebarOpen = useComposerStore((s) => s.leftSidebarOpen)
    const setLeftSidebarOpen = useComposerStore((s) => s.setLeftSidebarOpen)
    const rightSidebarOpen = useComposerStore((s) => s.rightSidebarOpen)
    const setRightSidebarOpen = useComposerStore((s) => s.setRightSidebarOpen)
    const editingCanvasSize = useComposerStore((s) => s.editingCanvasSize)
    const setEditingCanvasSize = useComposerStore((s) => s.setEditingCanvasSize)
    const rightSidebarTab = useComposerStore((s) => s.rightSidebarTab)
    const setRightSidebarTab = useComposerStore((s) => s.setRightSidebarTab)
    const showGallery = useComposerStore((s) => s.showGallery)
    const setShowGallery = useComposerStore((s) => s.setShowGallery)

    // Undo/Redo
    const undo = useComposerStore((s) => s.undo)
    const redo = useComposerStore((s) => s.redo)
    const canUndo = useComposerStore((s) => s.canUndo)
    const canRedo = useComposerStore((s) => s.canRedo)

    // Page management
    const selectPage = useComposerStore((s) => s.selectPage)
    const addPage = useComposerStore((s) => s.addPage)
    const deletePage = useComposerStore((s) => s.deletePage)
    const duplicatePage = useComposerStore((s) => s.duplicatePage)

    // Composition/page actions
    const getComposition = useComposerStore((s) => s.getComposition)
    const updateCurrentPage = useComposerStore((s) => s.updateCurrentPage)
    const handleLayoutChange = useComposerStore((s) => s.handleLayoutChange)
    const handlePagePresetChange = useComposerStore((s) => s.handlePagePresetChange)
    const handleUpdatePageSize = useComposerStore((s) => s.handleUpdatePageSize)

    // Item actions
    const updateItem = useComposerStore((s) => s.updateItem)
    const updateItemSilent = useComposerStore((s) => s.updateItemSilent)
    const deleteItem = useComposerStore((s) => s.deleteItem)
    const clearItems = useComposerStore((s) => s.clearItems)
    const dropCropToFreeform = useComposerStore((s) => s.dropCropToFreeform)
    const addMultipleCrops = useComposerStore((s) => s.addMultipleCrops)
    const nudgeSelectedItem = useComposerStore((s) => s.nudgeSelectedItem)
    const handleDragEnd = useComposerStore((s) => s.handleDragEnd)

    // Panel mode actions
    const dropCropToPanel = useComposerStore((s) => s.dropCropToPanel)
    const clearPanel = useComposerStore((s) => s.clearPanel)
    const handlePanelZoom = useComposerStore((s) => s.handlePanelZoom)

    // Persistence helpers
    const getPagesForSave = useComposerStore((s) => s.getPagesForSave)
    const loadState = useComposerStore((s) => s.loadState)

    // === DERIVED STATE ===
    const composition = getComposition()
    const selectedItem = selectedItemId
        ? placedItems.find(item => item.id === selectedItemId)
        : null
    const selectedAssignment = selectedPanelIndex !== null
        ? composition.assignments[selectedPanelIndex]
        : null

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

    // === CANVAS PERSISTENCE ===
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
        onLoadState: loadState,
        getThumbnail
    })

    // === HANDLERS (wrapping store actions for callbacks) ===
    const handleCompositionChange = useCallback((updates) => {
        updateCurrentPage(updates)
    }, [updateCurrentPage])

    const handleDropCropToFreeform = useCallback((cropId, x, y) => {
        const crop = crops.find(c => c.id === cropId)
        if (!crop) return
        dropCropToFreeform(crop, x, y, composition.pageWidth, composition.pageHeight)
    }, [crops, composition.pageWidth, composition.pageHeight, dropCropToFreeform])

    const handleAddMultipleCrops = useCallback((cropIds) => {
        const cropsToAdd = cropIds.map(id => crops.find(c => c.id === id)).filter(Boolean)
        addMultipleCrops(cropsToAdd, composition.pageWidth, composition.pageHeight)
    }, [crops, composition.pageWidth, composition.pageHeight, addMultipleCrops])

    const handleCropDragStart = useCallback((e, crop) => {
        e.dataTransfer.setData('application/crop-id', crop.id.toString())
        e.dataTransfer.effectAllowed = 'copy'
    }, [])

    const handleNudge = useCallback(({ dx, dy }) => {
        nudgeSelectedItem(dx, dy)
    }, [nudgeSelectedItem])

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
        onDelete: () => selectedItemId && deleteItem(selectedItemId),
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
                    onClear={clearItems}
                    canUndo={canUndo()}
                    canRedo={canRedo()}
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
                        onSelectPage={selectPage}
                        onAddPage={addPage}
                        onDeletePage={deletePage}
                        onDuplicatePage={duplicatePage}
                        disabled={persistence.isSaving || persistence.isLoading}
                    />
                )}

                {/* Canvas Container with Navigation Arrows */}
                <div className="flex-1 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-lg p-2 min-h-0 canvas-with-nav">
                    {/* Page Navigation Arrows */}
                    {mode === 'freeform' && pages.length > 1 && (
                        <PageNavigationArrows
                            currentPageIndex={currentPageIndex}
                            pageCount={pages.length}
                            onPrevPage={() => selectPage(currentPageIndex - 1)}
                            onNextPage={() => selectPage(currentPageIndex + 1)}
                        />
                    )}

                    {mode === 'panels' ? (
                        <PageCanvas
                            composition={composition}
                            panels={panels}
                            crops={crops}
                            selectedPanelIndex={selectedPanelIndex}
                            onSelectPanel={setSelectedPanelIndex}
                            onDropCrop={dropCropToPanel}
                        />
                    ) : (
                        <FreeformCanvas
                            composition={composition}
                            crops={crops}
                            placedItems={placedItems}
                            selectedItemId={selectedItemId}
                            onSelectItem={setSelectedItemId}
                            onUpdateItem={updateItem}
                            onUpdateItemSilent={updateItemSilent}
                            onDragEnd={handleDragEnd}
                            onDropCrop={handleDropCropToFreeform}
                            onDeleteItem={deleteItem}
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
                            onClick={() => clearPanel(selectedPanelIndex)}
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
                onUpdateItem={updateItem}
                onDeleteItem={deleteItem}
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
