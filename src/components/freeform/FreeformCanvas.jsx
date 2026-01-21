import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FILTERS } from '../../utils/filters'
import { FRAME_SHAPES } from '../../utils/frameShapes'
import { useCanvasStore, useUIStore, usePersistenceStore, useCropsStore } from '../../stores'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { calculateResizeUpdates, MIN_CANVAS_SIZE } from './resizeUtils'
import { CanvasResizeHandle } from './resizeHandles'
import { PlacedItem } from './PlacedItem'
import { EmptyStateHint } from './EmptyStateHint'

// ============================================================================
// Main FreeformCanvas Component
// ============================================================================
// Self-contained component that subscribes directly to stores
// ============================================================================
function FreeformCanvas() {
    // === CROPS STORE ===
    const crops = useCropsStore((s) => s.crops)

    // === CANVAS STORE ===
    const placedItems = useCanvasStore((s) => s.placedItems)
    const updateItem = useCanvasStore((s) => s.updateItem)
    const updateItemSilent = useCanvasStore((s) => s.updateItemSilent)
    const deleteItem = useCanvasStore((s) => s.deleteItem)
    const handleDragEnd = useCanvasStore((s) => s.handleDragEnd)
    const dropCropToFreeform = useCanvasStore((s) => s.dropCropToFreeform)
    const handleUpdatePageSize = useCanvasStore((s) => s.handleUpdatePageSize)
    const undo = useCanvasStore((s) => s.undo)
    const redo = useCanvasStore((s) => s.redo)
    const nudgeItem = useCanvasStore((s) => s.nudgeItem)
    const mode = useCanvasStore((s) => s.mode)
    const getPagesForSave = useCanvasStore((s) => s.getPagesForSave)

    // Direct subscriptions to current page properties (avoids getComposition)
    const currentPage = useCanvasStore((s) => s.pages[s.currentPageIndex] || s.pages[0])
    const pageWidth = currentPage?.pageWidth || 800
    const pageHeight = currentPage?.pageHeight || 1200
    const backgroundColor = currentPage?.backgroundColor || '#ffffff'

    // === UI STORE ===
    const selectedItemId = useUIStore((s) => s.selectedItemId)
    const setSelectedItemId = useUIStore((s) => s.setSelectedItemId)
    const editingCanvasSize = useUIStore((s) => s.editingCanvasSize)

    // === PERSISTENCE STORE ===
    const saveCanvas = usePersistenceStore((s) => s.saveCanvas)

    // === KEYBOARD SHORTCUTS ===
    const handleSave = useCallback(() => {
        const getCanvasData = () => ({
            pages: getPagesForSave(),
            mode,
            composition: { pageWidth, pageHeight, backgroundColor },
            placedItems,
            crops
        })
        saveCanvas(getCanvasData)
    }, [getPagesForSave, mode, pageWidth, pageHeight, backgroundColor, placedItems, crops, saveCanvas])

    useKeyboardShortcuts({
        enabled: mode === 'freeform',
        onDelete: () => selectedItemId && deleteItem(selectedItemId),
        onUndo: undo,
        onRedo: redo,
        onSave: handleSave,
        onNudge: ({ dx, dy }) => nudgeItem(selectedItemId, dx, dy)
    })

    const canvasRef = useRef(null)
    const skipClickDeselectRef = useRef(false)
    const [dragState, setDragState] = useState(null)
    const [dragOverCanvas, setDragOverCanvas] = useState(false)
    const [canvasResizeState, setCanvasResizeState] = useState(null)

    // Local state for active drag updates
    // This accumulates all changes during a drag (move, resize, rotate, custom corners)
    // and is only committed to the store on mouse up
    const [localItemUpdates, setLocalItemUpdates] = useState(null)

    // Rotation values during drag (not yet committed to item state)
    // Note: We still keep these for the rotation UI/logic, but they will also feed into localItemUpdates
    const [imageRotation, setImageRotation] = useState(0)  // original image within crop
    const [frameRotation, setFrameRotation] = useState(0)  // entire selection box
    // Crop offset values during Ctrl+drag (panning within original image)
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })

    // ========================================================================
    // Utility Functions
    // ========================================================================
    const getFilterStyle = useCallback((filterName) => {
        const filter = FILTERS.find(f => f.id === filterName)
        return filter ? filter.css : 'none'
    }, [])

    const getCropById = useCallback((cropId) => {
        return crops.find(c => c.id === cropId)
    }, [crops])

    // ========================================================================
    // Drag & Drop Handlers (for dropping new crops)
    // ========================================================================
    const handleDragOver = useCallback((e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setDragOverCanvas(true)
    }, [])

    const handleDragLeave = useCallback((e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverCanvas(false)
        }
    }, [])

    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setDragOverCanvas(false)

        const cropId = e.dataTransfer.getData('application/crop-id')
        if (cropId && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * pageWidth
            const y = ((e.clientY - rect.top) / rect.height) * pageHeight
            // Find crop and drop it
            const crop = crops.find(c => c.id === parseInt(cropId, 10))
            if (crop) {
                dropCropToFreeform(crop, x, y, pageWidth, pageHeight)
            }
        }
    }, [crops, dropCropToFreeform, pageWidth, pageHeight])

    // ========================================================================
    // Item Interaction Handlers
    // ========================================================================
    const handleItemMouseDown = useCallback((e, item, type = 'move') => {
        e.stopPropagation()
        e.preventDefault()
        setSelectedItemId(item.id)

        // Reset local updates on new drag start
        setLocalItemUpdates(null)

        // Check if Ctrl is held for crop panning (only during move)
        const actualType = (type === 'move' && e.ctrlKey) ? 'crop-pan' : type

        // Base drag state
        const baseDragState = {
            type: actualType,
            itemId: item.id,
            startX: e.clientX,
            startY: e.clientY,
            startItem: { ...item }
        }

        // For crop-pan, initialize offset from item
        if (actualType === 'crop-pan') {
            const initialOffset = {
                x: item.cropOffsetX ?? 0,
                y: item.cropOffsetY ?? 0
            }
            setCropOffset(initialOffset)
            setDragState(baseDragState)
            // Initialize local updates with current state to ensure continuity
            setLocalItemUpdates({
                cropOffsetX: initialOffset.x,
                cropOffsetY: initialOffset.y
            })
            return
        }

        // For rotation types, add rotation-specific data
        if (type === 'rotate' || type === 'frame-rotate') {
            const itemElement = e.target.closest('.freeform-item')
            if (!itemElement) return
            const itemRect = itemElement.getBoundingClientRect()
            const centerX = itemRect.left + itemRect.width / 2
            const centerY = itemRect.top + itemRect.height / 2
            const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)

            if (type === 'rotate') {
                const crop = crops.find(c => c.id === item.cropId)
                const currentRotation = item.rotation ?? crop?.rotation ?? 0
                setImageRotation(currentRotation)
                setDragState({ ...baseDragState, startAngle, centerX, centerY })
                setLocalItemUpdates({ rotation: currentRotation })
            } else {
                const currentFrameRotation = item.frameRotation ?? 0
                setFrameRotation(currentFrameRotation)
                setDragState({ ...baseDragState, startAngle, centerX, centerY })
                setLocalItemUpdates({ frameRotation: currentFrameRotation })
            }
        } else {
            setDragState(baseDragState)
            // Initialize local updates for move/resize
            if (type === 'move') {
                setLocalItemUpdates({ x: item.x, y: item.y })
            } else if (type.startsWith('resize-')) {
                setLocalItemUpdates({
                    x: item.x,
                    y: item.y,
                    width: item.width,
                    height: item.height
                })
            }
        }
    }, [setSelectedItemId, crops])

    const handleCornerMouseDown = useCallback((e, item, cornerIndex) => {
        e.stopPropagation()
        e.preventDefault()

        const currentPoints = item.customPoints ||
            (FRAME_SHAPES[item.frameShape]?.points || FRAME_SHAPES.rectangle.points).map(p => [...p])

        setLocalItemUpdates({ customPoints: currentPoints })

        setDragState({
            type: 'corner',
            itemId: item.id,
            cornerIndex,
            startX: e.clientX,
            startY: e.clientY,
            startItem: { ...item }
        })
    }, [])

    // ========================================================================
    // Mouse Move Handler - Handles all drag operations by updating LOCAL state
    // ========================================================================
    const handleMouseMove = useCallback((e) => {
        if (!dragState || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const deltaX = ((e.clientX - dragState.startX) / rect.width) * pageWidth
        const deltaY = ((e.clientY - dragState.startY) / rect.height) * pageHeight

        // Handle image rotation (rotating the original image within the crop)
        if (dragState.type === 'rotate') {
            const { centerX, centerY, startAngle, startItem } = dragState
            const crop = crops.find(c => c.id === startItem.cropId)
            const initialAngle = startItem.rotation ?? crop?.rotation ?? 0
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
            let newRotation = initialAngle + (currentAngle - startAngle)

            // Normalize to -180 to 180
            while (newRotation > 180) newRotation -= 360
            while (newRotation < -180) newRotation += 360

            setImageRotation(newRotation)
            setLocalItemUpdates({ rotation: newRotation })
            return
        }

        // Handle frame rotation (rotating the entire selection box)
        if (dragState.type === 'frame-rotate') {
            const { centerX, centerY, startAngle, startItem } = dragState
            const initialAngle = startItem.frameRotation ?? 0
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
            let newRotation = initialAngle + (currentAngle - startAngle)

            // Normalize to -180 to 180
            while (newRotation > 180) newRotation -= 360
            while (newRotation < -180) newRotation += 360

            setFrameRotation(newRotation)
            setLocalItemUpdates({ frameRotation: newRotation })
            return
        }

        // Handle crop panning (Ctrl+drag to shift crop position within original image)
        if (dragState.type === 'crop-pan') {
            const { startItem } = dragState
            const crop = crops.find(c => c.id === startItem.cropId)
            if (!crop) return

            // Calculate delta in screen pixels
            const screenDeltaX = e.clientX - dragState.startX
            const screenDeltaY = e.clientY - dragState.startY

            const frameRotationValue = startItem.frameRotation ?? 0
            const imageRotationValue = startItem.rotation ?? crop.rotation ?? 0

            const totalRotationRad = ((frameRotationValue - imageRotationValue) * Math.PI) / 180
            const cos = Math.cos(-totalRotationRad)
            const sin = Math.sin(-totalRotationRad)

            // Apply inverse rotation to get delta in image-aligned space
            const rotatedDeltaX = screenDeltaX * cos - screenDeltaY * sin
            const rotatedDeltaY = screenDeltaX * sin + screenDeltaY * cos

            // Scale from screen pixels to original image pixels based on crop size
            const item = placedItems.find(i => i.id === dragState.itemId)
            if (!item) return
            const itemDisplayWidth = (item.width / pageWidth) * rect.width
            const itemDisplayHeight = (item.height / pageHeight) * rect.height
            const scaleToOriginalX = crop.width / itemDisplayWidth
            const scaleToOriginalY = crop.height / itemDisplayHeight

            const initialOffsetX = startItem.cropOffsetX ?? 0
            const initialOffsetY = startItem.cropOffsetY ?? 0

            // Invert the delta so moving right reveals more of the left side of the image
            const newOffsetX = initialOffsetX - rotatedDeltaX * scaleToOriginalX
            const newOffsetY = initialOffsetY - rotatedDeltaY * scaleToOriginalY

            setCropOffset({ x: newOffsetX, y: newOffsetY })
            setLocalItemUpdates({ cropOffsetX: newOffsetX, cropOffsetY: newOffsetY })
            return
        }

        // Handle move
        if (dragState.type === 'move') {
            setLocalItemUpdates({
                x: Math.max(0, Math.min(pageWidth - dragState.startItem.width, dragState.startItem.x + deltaX)),
                y: Math.max(0, Math.min(pageHeight - dragState.startItem.height, dragState.startItem.y + deltaY))
            })
            return
        }

        // Handle resize
        if (dragState.type.startsWith('resize-')) {
            const corner = dragState.type.split('-')[1]
            const crop = crops.find(c => c.id === dragState.startItem.cropId)
            if (!crop) return

            const aspectRatio = crop.width / crop.height
            const updates = calculateResizeUpdates(
                corner, deltaX, deltaY, dragState.startItem,
                aspectRatio, pageWidth, pageHeight
            )
            setLocalItemUpdates(updates)
            return
        }

        // Handle corner dragging (custom polygon points)
        if (dragState.type === 'corner' && dragState.cornerIndex !== undefined) {
            const item = placedItems.find(i => i.id === dragState.itemId)
            if (!item) return

            // Use the accumulated points from localItemUpdates (set on mouse down and updated on each move)
            // This prevents the corner from snapping back to the original position
            const currentPoints = localItemUpdates?.customPoints ||
                item.customPoints ||
                (FRAME_SHAPES[item.frameShape]?.points || FRAME_SHAPES.rectangle.points).map(p => [...p])

            const itemWidthPx = (item.width / pageWidth) * rect.width
            const itemHeightPx = (item.height / pageHeight) * rect.height
            const deltaPctX = ((e.clientX - dragState.startX) / itemWidthPx) * 100
            const deltaPctY = ((e.clientY - dragState.startY) / itemHeightPx) * 100

            const newPoints = currentPoints.map((point, idx) => {
                if (idx === dragState.cornerIndex) {
                    return [
                        Math.max(0, Math.min(100, point[0] + deltaPctX)),
                        Math.max(0, Math.min(100, point[1] + deltaPctY))
                    ]
                }
                return [...point]
            })

            setLocalItemUpdates({ customPoints: newPoints })
            // Update start pos for next delta calculation
            setDragState(prev => ({ ...prev, startX: e.clientX, startY: e.clientY }))
        }
    }, [dragState, crops, placedItems, pageWidth, pageHeight, localItemUpdates])

    // ========================================================================
    // Mouse Up Handler - Commits LOCAL state to STORE
    // ========================================================================
    const handleMouseUp = useCallback(() => {
        if (!dragState) return

        // Commit any local updates to the global store
        if (localItemUpdates) {
            updateItem(dragState.itemId, localItemUpdates)
        }
        // Backward compatibility for cases where localItemUpdates might not be set (e.g. slight click)
        // OR cases explicitly handled separately before (rotate/pan)
        else if (dragState.type === 'rotate') {
            // Redundant safeguard if localItemUpdates wasn't set, but handleMouseMove should have set it
            updateItem(dragState.itemId, { rotation: imageRotation })
        }
        else if (dragState.type === 'frame-rotate') {
            updateItem(dragState.itemId, { frameRotation: frameRotation })
        }
        else if (dragState.type === 'crop-pan') {
            updateItem(dragState.itemId, {
                cropOffsetX: cropOffset.x,
                cropOffsetY: cropOffset.y
            })
        }

        handleDragEnd?.()

        // Mark that we just finished a drag - this prevents the canvas click from deselecting
        // Only set this for resize operations (scaling), not for move/rotate
        if (localItemUpdates && dragState.type?.startsWith('resize-')) {
            skipClickDeselectRef.current = true
        }

        setDragState(null)
        setLocalItemUpdates(null)
    }, [dragState, localItemUpdates, imageRotation, frameRotation, cropOffset, updateItem, handleDragEnd])

    // ========================================================================
    // Canvas Resize Handlers
    // ========================================================================
    const handleCanvasResizeStart = useCallback((e, edge) => {
        e.preventDefault()
        e.stopPropagation()
        setCanvasResizeState({
            edge,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: pageWidth,
            startHeight: pageHeight
        })
    }, [pageWidth, pageHeight])

    const handleCanvasResizeMove = useCallback((e) => {
        if (!canvasResizeState || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const { edge, startX, startY, startWidth, startHeight } = canvasResizeState
        const screenToPageX = startWidth / rect.width
        const screenToPageY = startHeight / rect.height
        const deltaScreenX = e.clientX - startX
        const deltaScreenY = e.clientY - startY

        let updates = {}
        if (edge === 'right') updates.pageWidth = Math.max(MIN_CANVAS_SIZE, startWidth + deltaScreenX * screenToPageX)
        else if (edge === 'left') updates.pageWidth = Math.max(MIN_CANVAS_SIZE, startWidth - deltaScreenX * screenToPageX)
        else if (edge === 'bottom') updates.pageHeight = Math.max(MIN_CANVAS_SIZE, startHeight + deltaScreenY * screenToPageY)
        else if (edge === 'top') updates.pageHeight = Math.max(MIN_CANVAS_SIZE, startHeight - deltaScreenY * screenToPageY)

        if (Object.keys(updates).length > 0 && editingCanvasSize) {
            handleUpdatePageSize(updates)
        }
    }, [canvasResizeState, editingCanvasSize, handleUpdatePageSize])

    const handleCanvasResizeEnd = useCallback(() => {
        setCanvasResizeState(null)
    }, [])

    // Global mouse events for canvas resize
    useEffect(() => {
        if (!canvasResizeState) return
        const onMove = (e) => handleCanvasResizeMove(e)
        const onUp = () => handleCanvasResizeEnd()
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [canvasResizeState, handleCanvasResizeMove, handleCanvasResizeEnd])

    // ========================================================================
    // Styles
    // ========================================================================
    const containerStyle = useMemo(() => ({
        aspectRatio: pageWidth / pageHeight,
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        backgroundColor: backgroundColor,
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: dragOverCanvas ? '2px dashed var(--accent-primary)' : '2px solid transparent',
        cursor: dragState ? (dragState.type === 'move' ? 'grabbing' : 'nwse-resize') : 'default'
    }), [pageWidth, pageHeight, backgroundColor, dragOverCanvas, dragState])

    const wrapperStyle = {
        position: 'relative',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }

    // ========================================================================
    // Render
    // ========================================================================
    return (
        <div style={wrapperStyle}>
            <div style={{ position: 'relative', height: '100%', maxWidth: '100%' }}>
                {/* Canvas resize handles */}
                {editingCanvasSize && (
                    <>
                        {['top', 'bottom', 'left', 'right'].map(edge => (
                            <CanvasResizeHandle
                                key={edge}
                                edge={edge}
                                onMouseDown={handleCanvasResizeStart}
                            />
                        ))}
                    </>
                )}

                {/* Main canvas */}
                <div
                    ref={canvasRef}
                    className="freeform-canvas"
                    style={containerStyle}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={() => {
                        // Skip deselection if we just finished a resize operation
                        if (skipClickDeselectRef.current) {
                            skipClickDeselectRef.current = false
                            return
                        }
                        setSelectedItemId(null)
                    }}
                >
                    {/* Render placed items */}
                    {placedItems.map((item) => {
                        const crop = getCropById(item.cropId)
                        if (!crop) return null

                        // Merge store item with local updates if this item is being dragged
                        const isDragging = dragState?.itemId === item.id
                        const displayItem = isDragging && localItemUpdates
                            ? { ...item, ...localItemUpdates }
                            : item

                        const isSelected = selectedItemId === item.id

                        // Derived values for specific interaction types
                        const isDraggingImageRotation = dragState?.type === 'rotate' && isDragging
                        const isDraggingFrameRotation = dragState?.type === 'frame-rotate' && isDragging
                        const isDraggingCropPan = dragState?.type === 'crop-pan' && isDragging

                        // We can use the props from displayItem which now includes local updates
                        const currentRotation = displayItem.rotation ?? crop.rotation ?? 0
                        const currentFrameRotation = displayItem.frameRotation ?? 0
                        // For crop offset, we pass the separate prop or fall back to item props
                        // Construct an object for the PlacedItem to use
                        const currentCropOffset = {
                            x: displayItem.cropOffsetX ?? 0,
                            y: displayItem.cropOffsetY ?? 0
                        }

                        return (
                            <PlacedItem
                                key={item.id}
                                item={displayItem}
                                crop={crop}
                                isSelected={isSelected}
                                isRotating={isDraggingImageRotation}
                                isFrameRotating={isDraggingFrameRotation}
                                isPanning={isDraggingCropPan}
                                currentRotation={currentRotation}
                                currentFrameRotation={currentFrameRotation}
                                currentCropOffset={currentCropOffset}
                                pageWidth={pageWidth}
                                pageHeight={pageHeight}
                                filterCss={getFilterStyle(crop.filter)}
                                onMouseDown={handleItemMouseDown}
                                onCornerMouseDown={handleCornerMouseDown}
                            />
                        )
                    })}

                    {/* Empty state hint */}
                    {placedItems.length === 0 && <EmptyStateHint />}
                </div>
            </div>
        </div>
    )
}

export default memo(FreeformCanvas)
