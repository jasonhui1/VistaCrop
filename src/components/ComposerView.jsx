import { useCallback, useMemo, useRef, useState } from 'react'
import PageCanvas from './PageCanvas'
import FreeformCanvas from './FreeformCanvas'
import {
    getLayoutList,
    getLayout,
    calculatePanelPositions,
    createEmptyComposition,
    updatePanelAssignment,
    clearPanelAssignment,
    changeCompositionLayout,
    PAGE_PRESETS
} from '../utils/panelLayouts'
import { FILTERS } from '../utils/filters'
import { FRAME_SHAPES, getShapeList, drawShapePath } from '../utils/frameShapes'
import { getImage } from '../utils/api'

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

    // Freeform mode state
    const [placedItems, setPlacedItems] = useState([])
    const [selectedItemId, setSelectedItemId] = useState(null)

    // Sidebar visibility state
    const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
    const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

    const exportCanvasRef = useRef(null)

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

    // Get all available layouts
    const allLayouts = useMemo(() => getLayoutList(), [])

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

        // Calculate initial size in pixels relative to composition page dimensions
        // In page pixel space, width/height ratio equals crop aspect ratio directly
        const cropAspectRatio = crop.width / crop.height

        // Start with 25% of page width as base
        let width = composition.pageWidth * 0.25
        let height = width / cropAspectRatio

        // Clamp to reasonable bounds (max 50% of page dimension)
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
    }, [crops, composition.pageWidth, composition.pageHeight])

    const handleUpdateItem = useCallback((itemId, updates) => {
        setPlacedItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ))
    }, [])

    const handleDeleteItem = useCallback((itemId) => {
        setPlacedItems(prev => prev.filter(item => item.id !== itemId))
        if (selectedItemId === itemId) {
            setSelectedItemId(null)
        }
    }, [selectedItemId])

    // Handle drag start for crop
    const handleCropDragStart = useCallback((e, crop) => {
        e.dataTransfer.setData('application/crop-id', crop.id.toString())
        e.dataTransfer.effectAllowed = 'copy'
    }, [])

    // Get selected item (freeform mode)
    const selectedItem = selectedItemId
        ? placedItems.find(item => item.id === selectedItemId)
        : null

    // Handle export
    const handleExport = useCallback(async () => {
        const canvas = document.createElement('canvas')
        canvas.width = composition.pageWidth
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

                // Items are stored in pixel coordinates that match composition dimensions
                // Since canvas.width === composition.pageWidth, use directly
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
                    // When rotated, we need to use the ORIGINAL image and rotate it
                    // around the crop center, matching RotatableImage behavior
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

                            // Calculate scale factors to map crop to display box
                            const scaleX = crop.width > 0 ? width / crop.width : 1
                            const scaleY = crop.height > 0 ? height / crop.height : 1

                            // Calculate how the original image should be positioned
                            const origW = crop.originalImageWidth || origImg.width
                            const origH = crop.originalImageHeight || origImg.height
                            const cropX = crop.x || 0
                            const cropY = crop.y || 0
                            const cropW = crop.width || 100
                            const cropH = crop.height || 100

                            const displayedOrigWidth = origW * scaleX
                            const displayedOrigHeight = origH * scaleY
                            const offsetX = -cropX * scaleX
                            const offsetY = -cropY * scaleY
                            const cropCenterX = (cropX + cropW / 2) * scaleX
                            const cropCenterY = (cropY + cropH / 2) * scaleY

                            // Draw original image with rotation around crop center
                            ctx.save()
                            ctx.filter = FILTERS.find(f => f.id === crop.filter)?.css || 'none'

                            // Move to the visual center of the item on canvas (the rotation pivot)
                            const itemCenterX = x + width / 2
                            const itemCenterY = y + height / 2
                            ctx.translate(itemCenterX, itemCenterY)

                            // Rotate around the center (negative to match screen behavior)
                            ctx.rotate((-rotation * Math.PI) / 180)

                            // Draw image such that its "crop center" aligns with the current origin (item center)
                            // We do this by offsetting by the distance from image-top-left to crop-center
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
                        // Fall back to cropped image
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
                    // No rotation - use the cropped preview image directly
                    const img = new Image()
                    img.crossOrigin = 'anonymous'
                    await new Promise((resolve, reject) => {
                        img.onload = resolve
                        img.onerror = reject
                        img.src = crop.imageData
                    })

                    // Draw image with proper aspect ratio (contain)
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

                    // Draw inner border for manga double style
                    if (borderStyle === 'manga') {
                        const insetAmount = Math.max(borderWidth, 4) / Math.min(width, height) * 100
                        ctx.save()
                        // Draw inset path
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

    // Get selected panel assignment (panel mode)
    const selectedAssignment = selectedPanelIndex !== null
        ? composition.assignments[selectedPanelIndex]
        : null

    return (
        <div className="glass-card flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <div className={`${leftSidebarOpen ? 'w-48' : 'w-12'} border-r border-[var(--border-color)] overflow-y-auto flex flex-col transition-all duration-200`}>
                {/* Sidebar Toggle */}
                <button
                    onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
                    className="p-3 hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center"
                    title={leftSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${leftSidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
                {leftSidebarOpen && <div className="p-3 flex flex-col gap-4">
                    {/* Mode Toggle */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Mode
                        </h3>
                        <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
                            <button
                                onClick={() => setMode('freeform')}
                                className={`flex-1 py-2 text-xs font-medium transition-colors ${mode === 'freeform'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                                    }`}
                            >
                                Freeform
                            </button>
                            <button
                                onClick={() => setMode('panels')}
                                className={`flex-1 py-2 text-xs font-medium transition-colors ${mode === 'panels'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                                    }`}
                            >
                                Panels
                            </button>
                        </div>
                    </div>

                    {/* Panel Layouts (only in panel mode) */}
                    {mode === 'panels' && (
                        <>
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                Layouts
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {allLayouts.map((layout) => (
                                    <button
                                        key={layout.id}
                                        onClick={() => handleLayoutChange(layout.id)}
                                        className={`layout-thumbnail p-2 rounded-lg border transition-all ${composition.layoutId === layout.id
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                            : 'border-[var(--border-color)] hover:border-[var(--accent-secondary)] bg-[var(--bg-tertiary)]'
                                            }`}
                                        title={layout.description}
                                    >
                                        <div className="aspect-[3/4] bg-[var(--bg-primary)] rounded relative overflow-hidden">
                                            {layout.panels.map((panel, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${panel.x * 100}%`,
                                                        top: `${panel.y * 100}%`,
                                                        width: `${panel.width * 100}%`,
                                                        height: `${panel.height * 100}%`,
                                                        backgroundColor: composition.layoutId === layout.id
                                                            ? 'var(--accent-primary)'
                                                            : 'var(--bg-tertiary)',
                                                        border: '1px solid var(--border-color)',
                                                        boxSizing: 'border-box',
                                                        opacity: 0.7
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-[var(--text-muted)] mt-1 block truncate">
                                            {layout.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Page Settings */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Page Size
                        </h3>
                        <select
                            value={composition.pagePreset}
                            onChange={(e) => handlePagePresetChange(e.target.value)}
                            className="w-full text-sm"
                        >
                            {Object.entries(PAGE_PRESETS).map(([key, preset]) => (
                                <option key={key} value={key}>{preset.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Background Color */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Background
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={composition.backgroundColor}
                                onChange={(e) => setComposition(prev => ({
                                    ...prev,
                                    backgroundColor: e.target.value,
                                    updatedAt: Date.now()
                                }))}
                                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                                type="text"
                                value={composition.backgroundColor}
                                onChange={(e) => setComposition(prev => ({
                                    ...prev,
                                    backgroundColor: e.target.value,
                                    updatedAt: Date.now()
                                }))}
                                className="flex-1 text-xs"
                            />
                        </div>
                    </div>

                    {/* Freeform tips */}
                    {mode === 'freeform' && (
                        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] p-3 rounded-lg">
                            <p className="font-medium text-[var(--text-secondary)] mb-1">Freeform Mode</p>
                            <ul className="space-y-1">
                                <li>• Drag crops onto the canvas</li>
                                <li>• Click to select, drag to move</li>
                                <li>• Drag corner to resize</li>
                                <li>• Click × to delete</li>
                            </ul>
                        </div>
                    )}
                </div>}
            </div>

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col p-2 overflow-hidden">
                {/* Compact Toolbar */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                            {mode === 'freeform' ? 'Freeform' : currentLayout.name}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                            ({mode === 'freeform' ? placedItems.length : currentLayout.panels.length})
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {mode === 'freeform' && placedItems.length > 0 && (
                            <button
                                onClick={() => {
                                    setPlacedItems([])
                                    setSelectedItemId(null)
                                }}
                                className="text-xs px-2 py-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={handleExport}
                            className="text-xs px-3 py-1.5 rounded bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] transition-colors flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                        </button>
                    </div>
                </div>

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
                            onDropCrop={handleDropCropToFreeform}
                            onDeleteItem={handleDeleteItem}
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

            {/* Crops Drawer */}
            <div className={`${rightSidebarOpen ? 'w-48' : 'w-12'} border-l border-[var(--border-color)] overflow-y-auto flex flex-col transition-all duration-200`}>
                {/* Sidebar Toggle */}
                <button
                    onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
                    className="p-3 hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center"
                    title={rightSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${rightSidebarOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
                {rightSidebarOpen && <div className="p-3 overflow-y-auto flex-1 flex flex-col">
                    {/* Selected Item Controls */}
                    {mode === 'freeform' && selectedItem && (
                        <div className="mb-3 pb-3 border-b border-[var(--border-color)]">
                            <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                                Selected
                            </h3>
                            <div className="space-y-2">
                                {/* Frame Shape Selector */}
                                <div>
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Frame Shape</label>
                                    <div className="grid grid-cols-4 gap-1">
                                        {getShapeList().slice(0, 12).map((shape) => (
                                            <button
                                                key={shape.id}
                                                onClick={() => handleUpdateItem(selectedItem.id, { frameShape: shape.id })}
                                                className={`aspect-square rounded text-sm flex items-center justify-center transition-all ${(selectedItem.frameShape || 'rectangle') === shape.id
                                                    ? 'bg-[var(--accent-primary)] text-white'
                                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)]'
                                                    }`}
                                                title={shape.name}
                                            >
                                                {shape.icon}
                                            </button>
                                        ))}
                                    </div>
                                    {/* More shapes toggle */}
                                    <details className="mt-1">
                                        <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)]">
                                            More shapes...
                                        </summary>
                                        <div className="grid grid-cols-4 gap-1 mt-1">
                                            {getShapeList().slice(12).map((shape) => (
                                                <button
                                                    key={shape.id}
                                                    onClick={() => handleUpdateItem(selectedItem.id, { frameShape: shape.id })}
                                                    className={`aspect-square rounded text-sm flex items-center justify-center transition-all ${(selectedItem.frameShape || 'rectangle') === shape.id
                                                        ? 'bg-[var(--accent-primary)] text-white'
                                                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)]'
                                                        }`}
                                                    title={shape.name}
                                                >
                                                    {shape.icon}
                                                </button>
                                            ))}
                                        </div>
                                    </details>
                                    {/* Customize corners button */}
                                    <button
                                        onClick={() => {
                                            // Initialize customPoints from current shape if not already set
                                            if (!selectedItem.customPoints) {
                                                const shape = FRAME_SHAPES[selectedItem.frameShape || 'rectangle'] || FRAME_SHAPES.rectangle
                                                handleUpdateItem(selectedItem.id, {
                                                    customPoints: shape.points.map(p => [...p])
                                                })
                                            }
                                        }}
                                        className={`w-full text-xs py-1.5 mt-1 rounded transition-colors ${selectedItem.customPoints
                                            ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]'
                                            : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white'
                                            }`}
                                    >
                                        {selectedItem.customPoints ? '✓ Corners Editable' : '✏️ Customize Corners'}
                                    </button>
                                    {selectedItem.customPoints && (
                                        <button
                                            onClick={() => handleUpdateItem(selectedItem.id, { customPoints: null })}
                                            className="w-full text-xs py-1 mt-1 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white transition-colors"
                                        >
                                            Reset to Preset
                                        </button>
                                    )}
                                </div>

                                {/* Border & Style Controls */}
                                <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                                    <label className="text-xs text-[var(--text-muted)] block mb-1">Border Style</label>
                                    <div className="grid grid-cols-4 gap-1 mb-2">
                                        {[
                                            { id: 'solid', label: '━', title: 'Solid' },
                                            { id: 'manga', label: '▰', title: 'Manga Double' },
                                            { id: 'dashed', label: '┅', title: 'Dashed' },
                                            { id: 'none', label: '○', title: 'None' }
                                        ].map((style) => (
                                            <button
                                                key={style.id}
                                                onClick={() => handleUpdateItem(selectedItem.id, { borderStyle: style.id })}
                                                className={`aspect-square rounded text-sm flex items-center justify-center transition-all ${(selectedItem.borderStyle || 'manga') === style.id
                                                    ? 'bg-[var(--accent-primary)] text-white'
                                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)]'
                                                    }`}
                                                title={style.title}
                                            >
                                                {style.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 mb-2">
                                        <label className="text-xs text-[var(--text-muted)] w-12">Color</label>
                                        <input
                                            type="color"
                                            value={selectedItem.borderColor || '#000000'}
                                            onChange={(e) => handleUpdateItem(selectedItem.id, { borderColor: e.target.value })}
                                            className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={selectedItem.borderColor || '#000000'}
                                            onChange={(e) => handleUpdateItem(selectedItem.id, { borderColor: e.target.value })}
                                            className="flex-1 text-xs py-1"
                                            placeholder="#000000"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-[var(--text-muted)] w-12">Width</label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={selectedItem.borderWidth ?? 3}
                                            onChange={(e) => handleUpdateItem(selectedItem.id, { borderWidth: parseFloat(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <span className="text-xs text-[var(--text-secondary)] w-6">
                                            {selectedItem.borderWidth ?? 3}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-[var(--text-muted)]">Fit:</label>
                                    <select
                                        value={selectedItem.objectFit || 'contain'}
                                        onChange={(e) => handleUpdateItem(selectedItem.id, { objectFit: e.target.value })}
                                        className="text-xs py-1 flex-1"
                                    >
                                        <option value="contain">Contain</option>
                                        <option value="cover">Cover</option>
                                        <option value="fill">Fill</option>
                                    </select>
                                </div>
                                <div className="text-xs text-[var(--text-muted)]">
                                    {Math.round(selectedItem.width)}px × {Math.round(selectedItem.height)}px
                                </div>
                                <button
                                    onClick={() => handleDeleteItem(selectedItem.id)}
                                    className="w-full text-xs py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                >
                                    Delete Item
                                </button>
                            </div>
                        </div>
                    )}

                    <h3 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                        Crops
                    </h3>
                    {crops.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)]">
                            No crops yet. Create some in the Canvas view.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {crops.map((crop) => (
                                <div
                                    key={crop.id}
                                    draggable
                                    onDragStart={(e) => handleCropDragStart(e, crop)}
                                    className="crop-drawer-item rounded-lg overflow-hidden border border-[var(--border-color)] cursor-grab active:cursor-grabbing hover:border-[var(--accent-primary)] transition-colors"
                                >
                                    <div className="aspect-video bg-[var(--bg-tertiary)] relative overflow-hidden">
                                        <img
                                            src={crop.imageData}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            style={{
                                                transform: `rotate(${crop.rotation || 0}deg)`
                                            }}
                                            draggable={false}
                                        />
                                    </div>
                                    <div className="p-2 bg-[var(--bg-secondary)]">
                                        <span className="text-xs text-[var(--text-muted)]">
                                            {crop.width} × {crop.height}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>}
            </div>
        </div>
    )
}

export default ComposerView
