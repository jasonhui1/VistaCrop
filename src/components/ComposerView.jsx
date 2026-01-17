import { useCallback, useEffect, useMemo, useState } from 'react'
import PageCanvas from './PageCanvas'
import FreeformCanvas from './FreeformCanvas'
import { LeftSidebar, RightSidebar, CanvasToolbar } from './composer'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useCanvasPersistence } from '../hooks/useCanvasPersistence'
import {
    getLayout,
    calculatePanelPositions,
    createEmptyComposition,
    updatePanelAssignment,
    clearPanelAssignment,
    changeCompositionLayout,
    PAGE_PRESETS
} from '../utils/panelLayouts'
import { exportCanvas } from '../utils/exportCanvas'

/**
 * ComposerView - Main composition view for creating manga-style page layouts
 * Supports both panel-based layouts and freeform placement
 */
function ComposerView({ crops }) {
    // === MODE STATE ===
    const [mode, setMode] = useState('freeform')

    // === COMPOSITION STATE ===
    const [composition, setComposition] = useState(() => createEmptyComposition())
    const [selectedPanelIndex, setSelectedPanelIndex] = useState(null)

    // === FREEFORM STATE (with undo/redo) ===
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
    } = useUndoRedo([])
    const [selectedItemId, setSelectedItemId] = useState(null)

    // === UI STATE ===
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
    const [editingCanvasSize, setEditingCanvasSize] = useState(false)
    const [rightSidebarTab, setRightSidebarTab] = useState('crops')

    // === CANVAS PERSISTENCE ===
    const handleLoadState = useCallback((canvasData) => {
        if (canvasData.composition) setComposition(canvasData.composition)
        if (canvasData.placedItems) resetPlacedItems(canvasData.placedItems)
        if (canvasData.mode) setMode(canvasData.mode)
        setSelectedItemId(null)
        setSelectedPanelIndex(null)
    }, [resetPlacedItems])

    const persistence = useCanvasPersistence({
        composition,
        placedItems,
        mode,
        onLoadState: handleLoadState
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

    // === EFFECTS ===
    // Auto-switch tab based on selection state
    useEffect(() => {
        if (mode === 'freeform') {
            setRightSidebarTab(selectedItemId ? 'selected' : 'crops')
        }
    }, [selectedItemId, mode])

    // === COMPOSITION HANDLERS ===
    const handleLayoutChange = useCallback((layoutId) => {
        setComposition(prev => changeCompositionLayout(prev, layoutId))
        setSelectedPanelIndex(null)
    }, [])

    const handlePagePresetChange = useCallback((presetKey) => {
        const preset = PAGE_PRESETS[presetKey]
        if (preset) {
            setComposition(prev => ({
                ...prev,
                pagePreset: presetKey,
                pageWidth: preset.width,
                pageHeight: preset.height,
                updatedAt: Date.now()
            }))
        }
    }, [])

    const handleCompositionChange = useCallback((updates) => {
        setComposition(prev => ({
            ...prev,
            ...updates,
            updatedAt: Date.now()
        }))
    }, [])

    const handleUpdatePageSize = useCallback((updates) => {
        setComposition(prev => ({
            ...prev,
            ...updates,
            pagePreset: 'custom',
            updatedAt: Date.now()
        }))
    }, [])

    // === PANEL MODE HANDLERS ===
    const handleDropCropToPanel = useCallback((panelIndex, cropId) => {
        setComposition(prev => updatePanelAssignment(prev, panelIndex, { cropId }))
    }, [])

    const handleClearPanel = useCallback((panelIndex) => {
        setComposition(prev => clearPanelAssignment(prev, panelIndex))
    }, [])

    const handlePanelZoom = useCallback((panelIndex, zoom) => {
        setComposition(prev => updatePanelAssignment(prev, panelIndex, { zoom }))
    }, [])

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
        setPlacedItems(prev => [...prev, newItem])
        setSelectedItemId(newItem.id)
    }, [crops, composition.pageWidth, composition.pageHeight, setPlacedItems])

    const handleUpdateItem = useCallback((itemId, updates) => {
        setPlacedItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ))
    }, [setPlacedItems])

    const handleUpdateItemSilent = useCallback((itemId, updates) => {
        setPlacedItemsSilent(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ))
    }, [setPlacedItemsSilent])

    const handleDragEnd = useCallback(() => {
        recordPlacedItemsState()
    }, [recordPlacedItemsState])

    const handleDeleteItem = useCallback((itemId) => {
        setPlacedItems(prev => prev.filter(item => item.id !== itemId))
        if (selectedItemId === itemId) {
            setSelectedItemId(null)
        }
    }, [selectedItemId, setPlacedItems])

    const handleClear = useCallback(() => {
        setPlacedItems([])
        setSelectedItemId(null)
    }, [setPlacedItems])

    const handleNudge = useCallback(({ dx, dy }) => {
        if (!selectedItemId) return
        setPlacedItems(prev => prev.map(item =>
            item.id === selectedItemId
                ? { ...item, x: item.x + dx, y: item.y + dy }
                : item
        ))
    }, [selectedItemId, setPlacedItems])

    const handleCropDragStart = useCallback((e, crop) => {
        e.dataTransfer.setData('application/crop-id', crop.id.toString())
        e.dataTransfer.effectAllowed = 'copy'
    }, [])

    // === EXPORT HANDLER ===
    const handleExport = useCallback(async () => {
        await exportCanvas({ composition, panels, crops, mode, placedItems })
    }, [composition, panels, crops, mode, placedItems])

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
                    savedCanvases={persistence.savedCanvases}
                    showLoadMenu={persistence.showLoadMenu}
                    onToggleLoadMenu={persistence.toggleLoadMenu}
                    onFetchCanvases={persistence.fetchSavedCanvases}
                    onLoadCanvas={persistence.handleLoadCanvas}
                    onDeleteCanvas={persistence.handleDeleteCanvas}
                    onSave={persistence.handleSave}
                    onExport={handleExport}
                    hasUnsavedChanges={persistence.hasUnsavedChanges}
                    lastSavedAt={persistence.lastSavedAt}
                />

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
            />
        </div>
    )
}

export default ComposerView
