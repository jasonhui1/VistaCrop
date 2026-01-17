import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import PageCanvas from './PageCanvas'
import FreeformCanvas from './FreeformCanvas'
import { LeftSidebar, RightSidebar, CanvasToolbar } from './composer'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import {
    getLayout,
    calculatePanelPositions,
    createEmptyComposition,
    updatePanelAssignment,
    clearPanelAssignment,
    changeCompositionLayout,
    PAGE_PRESETS
} from '../utils/panelLayouts'
import { FILTERS } from '../utils/filters'
import { drawShapePath } from '../utils/frameShapes'
import { getImage, createCanvas, saveCanvas, listCanvases, loadCanvas, deleteCanvas } from '../utils/api'

// Auto-save debounce delay in milliseconds
const AUTO_SAVE_DELAY = 30000

/**
 * ComposerView - Main composition view for creating manga-style page layouts
 * Supports both panel-based layouts and freeform placement
 */
function ComposerView({ crops }) {
    // Mode: 'panels' or 'freeform'
    const [mode, setMode] = useState('freeform')

    // Panel mode state
    const [composition, setComposition] = useState(() => createEmptyComposition())
    const [selectedPanelIndex, setSelectedPanelIndex] = useState(null)

    // Freeform mode state with undo/redo support
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

    // Sidebar visibility state
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
    // Canvas size editing mode
    const [editingCanvasSize, setEditingCanvasSize] = useState(false)
    // Right sidebar tab: 'selected' or 'crops'
    const [rightSidebarTab, setRightSidebarTab] = useState('crops')

    // Canvas persistence state
    const [canvasId, setCanvasId] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [savedCanvases, setSavedCanvases] = useState([])
    const [showLoadMenu, setShowLoadMenu] = useState(false)

    // Auto-save state
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

    // Auto-switch tab based on selection state
    useEffect(() => {
        if (mode === 'freeform') {
            setRightSidebarTab(selectedItemId ? 'selected' : 'crops')
        }
    }, [selectedItemId, mode])

    // Mark changes as unsaved when placedItems or composition changes
    useEffect(() => {
        if (canvasId) {
            setHasUnsavedChanges(true)
        }
    }, [placedItems, composition, canvasId])

    // Auto-save functionality
    useEffect(() => {
        if (!hasUnsavedChanges || !canvasId) return

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current)
        }

        // Set new auto-save timer
        autoSaveTimerRef.current = setTimeout(async () => {
            try {
                await saveCanvas(canvasId, composition, placedItems)
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
    }, [hasUnsavedChanges, canvasId, composition, placedItems])

    // Get current layout (for panel mode)
    const currentLayout = useMemo(() => getLayout(composition.layoutId), [composition.layoutId])

    // Calculate panel positions (for panel mode)
    const panels = useMemo(() =>
        calculatePanelPositions(
            currentLayout,
            composition.pageWidth,
            composition.pageHeight,
            composition.margin
        ),
        [currentLayout, composition.pageWidth, composition.pageHeight, composition.margin]
    )

    // Handle layout change (panel mode)
    const handleLayoutChange = useCallback((layoutId) => {
        setComposition(prev => changeCompositionLayout(prev, layoutId))
        setSelectedPanelIndex(null)
    }, [])

    // Handle page preset change
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

    // Handle composition updates from sidebar
    const handleCompositionChange = useCallback((updates) => {
        setComposition(prev => ({
            ...prev,
            ...updates,
            updatedAt: Date.now()
        }))
    }, [])

    // Panel mode handlers
    const handleDropCropToPanel = useCallback((panelIndex, cropId) => {
        setComposition(prev => updatePanelAssignment(prev, panelIndex, { cropId }))
    }, [])

    const handleClearPanel = useCallback((panelIndex) => {
        setComposition(prev => clearPanelAssignment(prev, panelIndex))
    }, [])

    const handlePanelZoom = useCallback((panelIndex, zoom) => {
        setComposition(prev => updatePanelAssignment(prev, panelIndex, { zoom }))
    }, [])

    // Freeform mode handlers
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

    // Update item with history recording (use for discrete actions)
    const handleUpdateItem = useCallback((itemId, updates) => {
        setPlacedItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ))
    }, [setPlacedItems])

    // Update item without history recording (use during drag operations)
    const handleUpdateItemSilent = useCallback((itemId, updates) => {
        setPlacedItemsSilent(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ))
    }, [setPlacedItemsSilent])

    // Record state to history (call on drag end)
    const handleDragEnd = useCallback(() => {
        recordPlacedItemsState()
    }, [recordPlacedItemsState])

    const handleDeleteItem = useCallback((itemId) => {
        setPlacedItems(prev => prev.filter(item => item.id !== itemId))
        if (selectedItemId === itemId) {
            setSelectedItemId(null)
        }
    }, [selectedItemId, setPlacedItems])

    // Handle page size update from canvas resize handles
    const handleUpdatePageSize = useCallback((updates) => {
        setComposition(prev => ({
            ...prev,
            ...updates,
            pagePreset: 'custom',
            updatedAt: Date.now()
        }))
    }, [])

    // Handle drag start for crop
    const handleCropDragStart = useCallback((e, crop) => {
        e.dataTransfer.setData('application/crop-id', crop.id.toString())
        e.dataTransfer.effectAllowed = 'copy'
    }, [])

    // Get selected item (freeform mode)
    const selectedItem = selectedItemId
        ? placedItems.find(item => item.id === selectedItemId)
        : null

    // Handle nudge from keyboard shortcut
    const handleNudge = useCallback(({ dx, dy }) => {
        if (!selectedItemId) return
        setPlacedItems(prev => prev.map(item =>
            item.id === selectedItemId
                ? { ...item, x: item.x + dx, y: item.y + dy }
                : item
        ))
    }, [selectedItemId, setPlacedItems])

    // Handle export
    const handleExport = useCallback(async () => {
        const canvas = document.createElement('canvas')
        canvas.width = composition.pageWidthonUpdateItem
        canvas.height = composition.pageHeight
        const ctx = canvas.getContext('2d')

        // Fill background
        ctx.fillStyle = composition.backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        if (mode === 'panels') {
            // Export panel mode
            for (const panel of panels) {
                const assignment = composition.assignments[panel.index]
                if (!assignment?.cropId) continue

                const crop = crops.find(c => c.id === assignment.cropId)
                if (!crop) continue

                const img = new Image()
                img.crossOrigin = 'anonymous'
                await new Promise((resolve, reject) => {
                    img.onload = resolve
                    img.onerror = reject
                    img.src = crop.imageData
                })

                ctx.save()
                ctx.filter = FILTERS.find(f => f.id === crop.filter)?.css || 'none'
                ctx.beginPath()
                ctx.rect(panel.x, panel.y, panel.width, panel.height)
                ctx.clip()

                const centerX = panel.x + panel.width / 2
                const centerY = panel.y + panel.height / 2
                ctx.translate(centerX, centerY)
                ctx.scale(assignment.zoom, assignment.zoom)
                ctx.translate(assignment.offsetX, assignment.offsetY)

                if (crop.rotation) {
                    ctx.rotate((crop.rotation * Math.PI) / 180)
                }

                const scale = Math.max(panel.width / img.width, panel.height / img.height)
                const drawWidth = img.width * scale
                const drawHeight = img.height * scale
                ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)

                ctx.restore()
            }
        } else {
            // Export freeform mode
            for (const item of placedItems) {
                const crop = crops.find(c => c.id === item.cropId)
                if (!crop) continue

                const rotation = item.rotation ?? crop.rotation ?? 0
                const x = item.x
                const y = item.y
                const width = item.width
                const height = item.height

                ctx.save()

                // Apply polygon clipping for the frame shape
                const shapeId = item.frameShape || 'rectangle'
                drawShapePath(ctx, shapeId, x, y, width, height, item.customPoints)
                ctx.clip()

                if (rotation !== 0 && crop.imageId) {
                    try {
                        const originalImageData = await getImage(crop.imageId)
                        if (originalImageData && originalImageData.data) {
                            const origImg = new Image()
                            origImg.crossOrigin = 'anonymous'
                            await new Promise((resolve, reject) => {
                                origImg.onload = resolve
                                origImg.onerror = reject
                                origImg.src = originalImageData.data
                            })

                            const scaleX = crop.width > 0 ? width / crop.width : 1
                            const scaleY = crop.height > 0 ? height / crop.height : 1

                            const origW = crop.originalImageWidth || origImg.width
                            const origH = crop.originalImageHeight || origImg.height
                            const cropX = crop.x || 0
                            const cropY = crop.y || 0
                            const cropW = crop.width || 100
                            const cropH = crop.height || 100

                            const displayedOrigWidth = origW * scaleX
                            const displayedOrigHeight = origH * scaleY
                            const cropCenterX = (cropX + cropW / 2) * scaleX
                            const cropCenterY = (cropY + cropH / 2) * scaleY

                            ctx.save()
                            ctx.filter = FILTERS.find(f => f.id === crop.filter)?.css || 'none'

                            const itemCenterX = x + width / 2
                            const itemCenterY = y + height / 2
                            ctx.translate(itemCenterX, itemCenterY)
                            ctx.rotate((-rotation * Math.PI) / 180)
                            ctx.drawImage(
                                origImg,
                                -cropCenterX,
                                -cropCenterY,
                                displayedOrigWidth,
                                displayedOrigHeight
                            )
                            ctx.restore()
                        }
                    } catch (error) {
                        console.error('Failed to load original image for export:', error)
                        const img = new Image()
                        img.crossOrigin = 'anonymous'
                        await new Promise((resolve, reject) => {
                            img.onload = resolve
                            img.onerror = reject
                            img.src = crop.imageData
                        })
                        ctx.drawImage(img, x, y, width, height)
                    }
                } else {
                    const img = new Image()
                    img.crossOrigin = 'anonymous'
                    await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = crop.imageData
                    })

                    const imgAspect = img.width / img.height
                    const boxAspect = width / height
                    let drawWidth, drawHeight, drawX, drawY

                    if (imgAspect > boxAspect) {
                        drawWidth = width
                        drawHeight = width / imgAspect
                        drawX = x
                        drawY = y + (height - drawHeight) / 2
                    } else {
                        drawHeight = height
                        drawWidth = height * imgAspect
                        drawX = x + (width - drawWidth) / 2
                        drawY = y
                    }

                    ctx.save()
                    ctx.filter = FILTERS.find(f => f.id === crop.filter)?.css || 'none'
                    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
                    ctx.restore()
                }

                ctx.restore()

                // Draw polygon border on top based on style
                const borderStyle = item.borderStyle || 'manga'
                const borderColor = item.borderColor || '#000'
                const borderWidth = item.borderWidth ?? 3

                if (borderStyle !== 'none') {
                    ctx.save()
                    drawShapePath(ctx, shapeId, x, y, width, height, item.customPoints)
                    ctx.strokeStyle = borderColor
                    ctx.lineWidth = borderWidth
                    ctx.lineJoin = 'miter'

                    if (borderStyle === 'dashed') {
                        ctx.setLineDash([borderWidth * 3, borderWidth * 2])
                    }

                    ctx.stroke()
                    ctx.restore()

                    if (borderStyle === 'manga') {
                        const insetAmount = Math.max(borderWidth, 4) / Math.min(width, height) * 100
                        ctx.save()
                        const insetX = x + (width * insetAmount / 100)
                        const insetY = y + (height * insetAmount / 100)
                        const insetWidth = width * (1 - 2 * insetAmount / 100)
                        const insetHeight = height * (1 - 2 * insetAmount / 100)
                        drawShapePath(ctx, shapeId, insetX, insetY, insetWidth, insetHeight, item.customPoints)
                        ctx.strokeStyle = borderColor
                        ctx.lineWidth = Math.max(1, borderWidth * 0.6)
                        ctx.lineJoin = 'miter'
                        ctx.stroke()
                        ctx.restore()
                    }
                }
            }
        }

        // Trigger download
        const link = document.createElement('a')
        link.download = `manga-page-${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }, [composition, panels, crops, mode, placedItems])

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

            await saveCanvas(currentCanvasId, composition, placedItems)
            setHasUnsavedChanges(false)
            setLastSavedAt(Date.now())
            console.log('Canvas saved successfully:', currentCanvasId)
        } catch (error) {
            console.error('Failed to save canvas:', error)
        } finally {
            setIsSaving(false)
        }
    }, [canvasId, composition, placedItems, mode])

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

    // Handle loading a canvas
    const handleLoadCanvas = useCallback(async (selectedCanvasId) => {
        setIsLoading(true)
        setShowLoadMenu(false)
        try {
            const canvasData = await loadCanvas(selectedCanvasId)
            if (canvasData) {
                setCanvasId(selectedCanvasId)

                if (canvasData.composition) {
                    setComposition(canvasData.composition)
                }

                if (canvasData.placedItems) {
                    resetPlacedItems(canvasData.placedItems)
                }

                if (canvasData.mode) {
                    setMode(canvasData.mode)
                }

                setSelectedItemId(null)
                setSelectedPanelIndex(null)
                setHasUnsavedChanges(false)

                console.log('Canvas loaded successfully:', selectedCanvasId)
            }
        } catch (error) {
            console.error('Failed to load canvas:', error)
        } finally {
            setIsLoading(false)
        }
    }, [resetPlacedItems])

    // Handle deleting a canvas
    const handleDeleteCanvas = useCallback(async (canvasIdToDelete) => {
        try {
            await deleteCanvas(canvasIdToDelete)
            setSavedCanvases(prev => prev.filter(c => c.id !== canvasIdToDelete))

            // If we deleted the currently loaded canvas, reset state
            if (canvasIdToDelete === canvasId) {
                setCanvasId(null)
                setHasUnsavedChanges(false)
            }

            console.log('Canvas deleted:', canvasIdToDelete)
        } catch (error) {
            console.error('Failed to delete canvas:', error)
        }
    }, [canvasId])

    // Handle clear all items
    const handleClear = useCallback(() => {
        setPlacedItems([])
        setSelectedItemId(null)
    }, [setPlacedItems])

    // Get selected panel assignment (panel mode)
    const selectedAssignment = selectedPanelIndex !== null
        ? composition.assignments[selectedPanelIndex]
        : null

    // Keyboard shortcuts
    useKeyboardShortcuts({
        enabled: mode === 'freeform',
        onDelete: () => selectedItemId && handleDeleteItem(selectedItemId),
        onUndo: undo,
        onRedo: redo,
        onSave: handleSave,
        onNudge: handleNudge
    })

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
                    canvasId={canvasId}
                    isSaving={isSaving}
                    isLoading={isLoading}
                    savedCanvases={savedCanvases}
                    showLoadMenu={showLoadMenu}
                    onToggleLoadMenu={() => setShowLoadMenu(!showLoadMenu)}
                    onFetchCanvases={fetchSavedCanvases}
                    onLoadCanvas={handleLoadCanvas}
                    onDeleteCanvas={handleDeleteCanvas}
                    onSave={handleSave}
                    onExport={handleExport}
                    hasUnsavedChanges={hasUnsavedChanges}
                    lastSavedAt={lastSavedAt}
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
