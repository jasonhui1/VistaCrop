import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FILTERS } from '../utils/filters'
import { getClipPath, getSvgPoints, FRAME_SHAPES, getEffectivePoints } from '../utils/frameShapes'
import RotatableImage from './RotatableImage'

// Constants for rotation
const ROTATION_EDGE_THRESHOLD = 20 // pixels from edge that triggers rotation mode

/**
 * ShapedBorder - Renders SVG polygon borders that match the clip-path shape
 * provides manga-style layered border effect for irregular shapes
 */
const ShapedBorder = memo(function ShapedBorder({
    shapeId,
    customPoints,
    isSelected,
    isEditingCorners,
    onCornerMouseDown,
    borderColor = '#000',
    borderWidth = 3,
    borderStyle = 'manga'
}) {
    const containerRef = useRef(null)
    const [size, setSize] = useState({ width: 100, height: 100 })

    useEffect(() => {
        if (!containerRef.current) return
        const updateSize = () => {
            if (containerRef.current) {
                setSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight
                })
            }
        }
        updateSize()
        const resizeObserver = new ResizeObserver(updateSize)
        resizeObserver.observe(containerRef.current)
        return () => resizeObserver.disconnect()
    }, [])

    // Use custom points if provided, else fall back to shape preset
    const points = customPoints || FRAME_SHAPES[shapeId]?.points || FRAME_SHAPES.rectangle.points

    // Generate SVG points for the shape
    const outerPoints = points
        .map(([xPct, yPct]) => `${(xPct / 100) * size.width},${(yPct / 100) * size.height}`)
        .join(' ')

    // Inset points for inner border (approximate by scaling towards center)
    const insetAmount = Math.max(borderWidth, 4)
    const centerX = size.width / 2
    const centerY = size.height / 2
    const innerPoints = points
        .map(([xPct, yPct]) => {
            const x = (xPct / 100) * size.width
            const y = (yPct / 100) * size.height
            const dx = centerX - x
            const dy = centerY - y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const factor = dist > 0 ? insetAmount / dist : 0
            return `${x + dx * factor},${y + dy * factor}`
        })
        .join(' ')

    // Don't render borders if style is 'none'
    if (borderStyle === 'none' && !isEditingCorners) {
        return (
            <div
                ref={containerRef}
                style={{
                    position: 'absolute',
                    inset: -4,
                    pointerEvents: isEditingCorners ? 'auto' : 'none',
                    zIndex: 2
                }}
            />
        )
    }

    // Get stroke dash array based on style
    const getStrokeDashArray = () => {
        switch (borderStyle) {
            case 'dashed':
                return `${borderWidth * 3},${borderWidth * 2}`
            default:
                return 'none'
        }
    }

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                inset: -4,
                pointerEvents: isEditingCorners ? 'auto' : 'none',
                zIndex: 2
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${size.width} ${size.height}`}
                preserveAspectRatio="none"
                style={{ position: 'absolute', inset: 0, overflow: 'visible', pointerEvents: 'none' }}
            >
                {/* Outer border */}
                <polygon
                    points={outerPoints}
                    fill="none"
                    stroke={borderColor}
                    strokeWidth={borderWidth}
                    strokeLinejoin="miter"
                    strokeDasharray={getStrokeDashArray()}
                />
                {/* Inner border for manga double style */}
                {borderStyle === 'manga' && (
                    <polygon
                        points={innerPoints}
                        fill="none"
                        stroke={borderColor}
                        strokeWidth={Math.max(1, borderWidth * 0.6)}
                        strokeLinejoin="miter"
                    />
                )}
                {/* Corner handles when editing */}
                {isEditingCorners && points.map((point, index) => {
                    const x = (point[0] / 100) * size.width
                    const y = (point[1] / 100) * size.height
                    return (
                        <circle
                            key={index}
                            cx={x}
                            cy={y}
                            r={8}
                            fill="var(--accent-primary)"
                            stroke="#fff"
                            strokeWidth="2"
                            style={{ cursor: 'move', pointerEvents: 'auto' }}
                            onMouseDown={(e) => onCornerMouseDown?.(e, index)}
                        />
                    )
                })}
            </svg>
        </div>
    )
})

/**
 * FreeformCanvas - Allows free placement and resizing of crops on a canvas
 * No fixed panel constraints - crops can be placed anywhere and sized freely
 */
function FreeformCanvas({
    composition,
    crops,
    placedItems,
    selectedItemId,
    onSelectItem,
    onUpdateItem,
    onDropCrop,
    onDeleteItem
}) {
    const canvasRef = useRef(null)
    const [dragState, setDragState] = useState(null) // { type: 'move' | 'resize' | 'rotate' | 'corner', itemId, startX, startY, startItem, cornerIndex }
    const [dragOverCanvas, setDragOverCanvas] = useState(false)
    // Track local rotation during drag for immediate visual feedback
    const [rotatingItemId, setRotatingItemId] = useState(null)
    const [localRotation, setLocalRotation] = useState(0)
    const initialRotationRef = useRef({ angle: 0, startAngle: 0, centerX: 0, centerY: 0 })
    // Track which item is in corner editing mode
    const [editingCornersItemId, setEditingCornersItemId] = useState(null)

    // Handle keyboard Delete key to delete selected item
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId && !e.target.matches('input, textarea')) {
                e.preventDefault()
                onDeleteItem(selectedItemId)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedItemId, onDeleteItem])

    // Get CSS filter string from filter name
    const getFilterStyle = useCallback((filterName) => {
        const filter = FILTERS.find(f => f.id === filterName)
        return filter ? filter.css : 'none'
    }, [])

    // Find crop by ID
    const getCropById = useCallback((cropId) => {
        return crops.find(c => c.id === cropId)
    }, [crops])

    // Handle drag over canvas (for dropping new crops)
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

    // Handle drop new crop onto canvas
    const handleDrop = useCallback((e) => {
        e.preventDefault()
        setDragOverCanvas(false)

        const cropId = e.dataTransfer.getData('application/crop-id')
        if (cropId && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * 100
            const y = ((e.clientY - rect.top) / rect.height) * 100
            // Pass the actual canvas aspect ratio for proper sizing
            const canvasAspect = rect.width / rect.height
            onDropCrop(parseInt(cropId, 10), x, y, canvasAspect)
        }
    }, [onDropCrop])

    // Handle mouse down on item (for moving/resizing/rotating)
    // type can be: 'move', 'resize-tl', 'resize-tr', 'resize-bl', 'resize-br', 'rotate'
    const handleItemMouseDown = useCallback((e, item, type = 'move') => {
        e.stopPropagation()
        e.preventDefault()
        onSelectItem(item.id)

        if (type === 'rotate') {
            // Get the item's bounding element
            const itemElement = e.target.closest('.freeform-item')
            if (!itemElement) return
            const itemRect = itemElement.getBoundingClientRect()
            const centerX = itemRect.left + itemRect.width / 2
            const centerY = itemRect.top + itemRect.height / 2

            // Get the crop for current rotation
            const crop = crops.find(c => c.id === item.cropId)
            // Read rotation from item first (where it's saved), then crop as fallback
            const currentRotation = item.rotation ?? crop?.rotation ?? 0

            // Calculate starting angle from center to mouse
            const startAngle = Math.atan2(
                e.clientY - centerY,
                e.clientX - centerX
            ) * (180 / Math.PI)

            initialRotationRef.current = {
                angle: currentRotation,
                startAngle,
                centerX,
                centerY
            }

            setRotatingItemId(item.id)
            setLocalRotation(currentRotation)
        }

        setDragState({
            type,
            itemId: item.id,
            startX: e.clientX,
            startY: e.clientY,
            startItem: { ...item }
        })
    }, [onSelectItem, crops])

    // Handle corner mouse down (for dragging polygon corners)
    const handleCornerMouseDown = useCallback((e, item, cornerIndex) => {
        e.stopPropagation()
        e.preventDefault()

        setDragState({
            type: 'corner',
            itemId: item.id,
            cornerIndex,
            startX: e.clientX,
            startY: e.clientY,
            startItem: { ...item }
        })
    }, [])

    // Handle mouse move (for dragging/rotating)
    const handleMouseMove = useCallback((e) => {
        if (!dragState || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100
        const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100

        if (dragState.type === 'rotate') {
            // Calculate current angle from center to mouse
            const { centerX, centerY, startAngle, angle } = initialRotationRef.current
            const currentAngle = Math.atan2(
                e.clientY - centerY,
                e.clientX - centerX
            ) * (180 / Math.PI)

            // Calculate rotation delta
            let newRotation = angle + (currentAngle - startAngle)

            // Normalize to -180 to 180
            while (newRotation > 180) newRotation -= 360
            while (newRotation < -180) newRotation += 360

            setLocalRotation(newRotation)
        } else if (dragState.type === 'move') {
            onUpdateItem(dragState.itemId, {
                x: Math.max(0, Math.min(100 - dragState.startItem.width, dragState.startItem.x + deltaX)),
                y: Math.max(0, Math.min(100 - dragState.startItem.height, dragState.startItem.y + deltaY))
            })
        } else if (dragState.type.startsWith('resize-')) {
            const corner = dragState.type.split('-')[1]
            const crop = crops.find(c => c.id === dragState.startItem.cropId)
            if (!crop) return

            // Get the crop's aspect ratio to maintain during resize
            const cropAspect = crop.width / crop.height
            const canvasAspect = rect.width / rect.height
            // Convert crop aspect to percentage-space aspect
            const aspectRatio = cropAspect / canvasAspect

            let updates = {}

            // Use the dominant axis (larger delta) to drive the resize, maintain aspect ratio
            const absDeltaX = Math.abs(deltaX)
            const absDeltaY = Math.abs(deltaY)

            if (corner === 'br') {
                // Bottom-right: expand from bottom-right
                if (absDeltaX > absDeltaY) {
                    const newWidth = Math.max(5, Math.min(100 - dragState.startItem.x, dragState.startItem.width + deltaX))
                    updates.width = newWidth
                    updates.height = newWidth / aspectRatio
                } else {
                    const newHeight = Math.max(5, Math.min(100 - dragState.startItem.y, dragState.startItem.height + deltaY))
                    updates.height = newHeight
                    updates.width = newHeight * aspectRatio
                }
            } else if (corner === 'bl') {
                // Bottom-left: anchor top-right corner
                if (absDeltaX > absDeltaY) {
                    const newWidth = Math.max(5, dragState.startItem.width - deltaX)
                    const widthDiff = newWidth - dragState.startItem.width
                    updates.width = newWidth
                    updates.height = newWidth / aspectRatio
                    updates.x = dragState.startItem.x - widthDiff
                } else {
                    const newHeight = Math.max(5, Math.min(100 - dragState.startItem.y, dragState.startItem.height + deltaY))
                    const newWidth = newHeight * aspectRatio
                    const widthDiff = newWidth - dragState.startItem.width
                    updates.height = newHeight
                    updates.width = newWidth
                    updates.x = dragState.startItem.x - widthDiff
                }
            } else if (corner === 'tr') {
                // Top-right: anchor bottom-left corner
                if (absDeltaX > absDeltaY) {
                    const newWidth = Math.max(5, Math.min(100 - dragState.startItem.x, dragState.startItem.width + deltaX))
                    const newHeight = newWidth / aspectRatio
                    const heightDiff = newHeight - dragState.startItem.height
                    updates.width = newWidth
                    updates.height = newHeight
                    updates.y = dragState.startItem.y - heightDiff
                } else {
                    const newHeight = Math.max(5, dragState.startItem.height - deltaY)
                    const heightDiff = newHeight - dragState.startItem.height
                    updates.height = newHeight
                    updates.width = newHeight * aspectRatio
                    updates.y = dragState.startItem.y - heightDiff
                }
            } else if (corner === 'tl') {
                // Top-left: anchor bottom-right corner
                if (absDeltaX > absDeltaY) {
                    const newWidth = Math.max(5, dragState.startItem.width - deltaX)
                    const newHeight = newWidth / aspectRatio
                    const widthDiff = newWidth - dragState.startItem.width
                    const heightDiff = newHeight - dragState.startItem.height
                    updates.width = newWidth
                    updates.height = newHeight
                    updates.x = dragState.startItem.x - widthDiff
                    updates.y = dragState.startItem.y - heightDiff
                } else {
                    const newHeight = Math.max(5, dragState.startItem.height - deltaY)
                    const newWidth = newHeight * aspectRatio
                    const widthDiff = newWidth - dragState.startItem.width
                    const heightDiff = newHeight - dragState.startItem.height
                    updates.height = newHeight
                    updates.width = newWidth
                    updates.x = dragState.startItem.x - widthDiff
                    updates.y = dragState.startItem.y - heightDiff
                }
            }

            // Clamp position to stay within canvas
            if (updates.x !== undefined) {
                updates.x = Math.max(0, updates.x)
            }
            if (updates.y !== undefined) {
                updates.y = Math.max(0, updates.y)
            }

            onUpdateItem(dragState.itemId, updates)
        } else if (dragState.type === 'corner' && dragState.cornerIndex !== undefined) {
            // Corner dragging - update custom points
            const item = placedItems.find(i => i.id === dragState.itemId)
            if (!item) return

            // Get the current points (custom or from shape preset)
            const currentPoints = item.customPoints ||
                (FRAME_SHAPES[item.frameShape]?.points || FRAME_SHAPES.rectangle.points).map(p => [...p])

            // Create new points array with updated corner
            const newPoints = currentPoints.map((point, idx) => {
                if (idx === dragState.cornerIndex) {
                    // Update this corner position
                    const newX = Math.max(0, Math.min(100, point[0] + deltaX))
                    const newY = Math.max(0, Math.min(100, point[1] + deltaY))
                    return [newX, newY]
                }
                return [...point]
            })

            onUpdateItem(dragState.itemId, { customPoints: newPoints })

            // Update drag state for next move
            setDragState(prev => ({
                ...prev,
                startX: e.clientX,
                startY: e.clientY
            }))
        }
    }, [dragState, onUpdateItem, crops, placedItems])

    // Handle mouse up - save rotation if we were rotating
    const handleMouseUp = useCallback(() => {
        if (dragState?.type === 'rotate' && rotatingItemId) {
            // Save rotation to the crop
            const item = placedItems.find(i => i.id === rotatingItemId)
            if (item) {
                const crop = crops.find(c => c.id === item.cropId)
                if (crop) {
                    // We need to update the crop's rotation - this is done via onUpdateItem
                    // But crops are separate, so we need a way to update crop rotation
                    // For now, store rotation in the item itself
                    onUpdateItem(rotatingItemId, { rotation: localRotation })
                }
            }
        }
        setDragState(null)
        setRotatingItemId(null)
    }, [dragState, rotatingItemId, localRotation, placedItems, crops, onUpdateItem])

    // Calculate container style
    const containerStyle = {
        aspectRatio: composition.pageWidth / composition.pageHeight,
        maxWidth: '100%',
        maxHeight: '100%',
        backgroundColor: composition.backgroundColor,
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: dragOverCanvas ? '2px dashed var(--accent-primary)' : '2px solid transparent',
        cursor: dragState ? (dragState.type === 'move' ? 'grabbing' : 'nwse-resize') : 'default'
    }

    return (
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
            onClick={() => onSelectItem(null)}
        >
            {/* Render placed items */}
            {placedItems.map((item) => {
                const crop = getCropById(item.cropId)
                if (!crop) return null

                const isSelected = selectedItemId === item.id
                const isRotating = rotatingItemId === item.id

                // Use local rotation during drag, otherwise use item/crop rotation
                const currentRotation = isRotating ? localRotation : (item.rotation ?? crop.rotation ?? 0)

                // Since we preserve aspect ratio during resize, use item coordinates directly
                // This prevents movement during resize operations

                return (
                    <div
                        key={item.id}
                        className={`freeform-item ${isSelected ? 'selected' : ''}`}
                        style={{
                            position: 'absolute',
                            left: `${item.x}%`,
                            top: `${item.y}%`,
                            width: `${item.width}%`,
                            height: `${item.height}%`,
                            boxSizing: 'border-box',
                            cursor: isRotating ? 'grabbing' : 'grab',
                            zIndex: isSelected ? 10 : 1,
                        }}
                        onMouseDown={(e) => handleItemMouseDown(e, item, 'move')}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Rotation ring - visible when selected, drag to rotate */}
                        {isSelected && (
                            <div
                                className="rotation-ring"
                                style={{
                                    position: 'absolute',
                                    inset: -ROTATION_EDGE_THRESHOLD,
                                    border: '2px dashed rgba(168, 85, 247, 0.5)',
                                    borderRadius: '50%',
                                    cursor: 'grab',
                                    zIndex: 0
                                }}
                                onMouseDown={(e) => handleItemMouseDown(e, item, 'rotate')}
                            />
                        )}

                        {/* Manga-style polygon border using SVG */}
                        <ShapedBorder
                            shapeId={item.frameShape || 'rectangle'}
                            customPoints={item.customPoints}
                            isSelected={isSelected}
                            isEditingCorners={isSelected && !!item.customPoints}
                            onCornerMouseDown={(e, cornerIndex) => handleCornerMouseDown(e, item, cornerIndex)}
                            borderColor={item.borderColor || '#000'}
                            borderWidth={item.borderWidth ?? 3}
                            borderStyle={item.borderStyle || 'manga'}
                        />

                        {/* Selection indicator - follows shape */}
                        {isSelected && (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: -6,
                                    clipPath: getClipPath(item.frameShape || 'rectangle', item.customPoints),
                                    border: '2px solid var(--accent-primary)',
                                    boxShadow: '0 0 12px var(--accent-primary)',
                                    pointerEvents: 'none',
                                    zIndex: 3
                                }}
                            />
                        )}

                        {/* Image container with clipping - matches gallery mode behavior */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                clipPath: getClipPath(item.frameShape || 'rectangle', item.customPoints),
                                overflow: 'hidden'
                            }}
                        >
                            <RotatableImage
                                crop={crop}
                                currentRotation={currentRotation}
                                isRotating={isRotating}
                                filterCss={getFilterStyle(crop.filter)}
                            />
                        </div>


                        {/* Resize handles - all four corners */}
                        {isSelected && (
                            <>
                                {/* Top-left */}
                                <div
                                    className="resize-handle resize-tl"
                                    style={{
                                        position: 'absolute',
                                        left: -8,
                                        top: -8,
                                        width: 14,
                                        height: 14,
                                        backgroundColor: '#000',
                                        cursor: 'nwse-resize',
                                        border: '2px solid var(--accent-primary)',
                                        zIndex: 4
                                    }}
                                    onMouseDown={(e) => handleItemMouseDown(e, item, 'resize-tl')}
                                />
                                {/* Top-right */}
                                <div
                                    className="resize-handle resize-tr"
                                    style={{
                                        position: 'absolute',
                                        right: -8,
                                        top: -8,
                                        width: 14,
                                        height: 14,
                                        backgroundColor: '#000',
                                        cursor: 'nesw-resize',
                                        border: '2px solid var(--accent-primary)',
                                        zIndex: 4
                                    }}
                                    onMouseDown={(e) => handleItemMouseDown(e, item, 'resize-tr')}
                                />
                                {/* Bottom-left */}
                                <div
                                    className="resize-handle resize-bl"
                                    style={{
                                        position: 'absolute',
                                        left: -8,
                                        bottom: -8,
                                        width: 14,
                                        height: 14,
                                        backgroundColor: '#000',
                                        cursor: 'nesw-resize',
                                        border: '2px solid var(--accent-primary)',
                                        zIndex: 4
                                    }}
                                    onMouseDown={(e) => handleItemMouseDown(e, item, 'resize-bl')}
                                />
                                {/* Bottom-right */}
                                <div
                                    className="resize-handle resize-br"
                                    style={{
                                        position: 'absolute',
                                        right: -8,
                                        bottom: -8,
                                        width: 14,
                                        height: 14,
                                        backgroundColor: '#000',
                                        cursor: 'nwse-resize',
                                        border: '2px solid var(--accent-primary)',
                                        zIndex: 4
                                    }}
                                    onMouseDown={(e) => handleItemMouseDown(e, item, 'resize-br')}
                                />

                            </>
                        )}
                    </div>
                )
            })}

            {/* Empty state hint */}
            {placedItems.length === 0 && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                        opacity: 0.5,
                        pointerEvents: 'none'
                    }}
                >
                    <svg
                        style={{ width: 48, height: 48, marginBottom: 8 }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    <span>Drag crops here</span>
                </div>
            )}
        </div>
    )
}

export default memo(FreeformCanvas)
