import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FILTERS } from '../utils/filters'
import { getClipPath, getSvgPoints, FRAME_SHAPES, getEffectivePoints } from '../utils/frameShapes'
import RotatableImage from './RotatableImage'
import PhoneMockup from './PhoneMockup'

// ============================================================================
// Constants
// ============================================================================
const ROTATION_EDGE_THRESHOLD = 20 // pixels from edge that triggers rotation mode
const MIN_ITEM_SIZE = 50
const MIN_CANVAS_SIZE = 200

// ============================================================================
// Resize Handle Component
// ============================================================================
const ResizeHandle = memo(function ResizeHandle({ corner, onMouseDown }) {
    const positions = {
        tl: { left: -8, top: -8, cursor: 'nwse-resize' },
        tr: { right: -8, top: -8, cursor: 'nesw-resize' },
        bl: { left: -8, bottom: -8, cursor: 'nesw-resize' },
        br: { right: -8, bottom: -8, cursor: 'nwse-resize' }
    }

    const pos = positions[corner]

    return (
        <div
            className={`resize-handle resize-${corner}`}
            style={{
                position: 'absolute',
                ...pos,
                width: 14,
                height: 14,
                backgroundColor: '#000',
                border: '2px solid var(--accent-primary)',
                zIndex: 4
            }}
            onMouseDown={onMouseDown}
        />
    )
})

// ============================================================================
// Resize Handles Group Component
// ============================================================================
const ResizeHandles = memo(function ResizeHandles({ item, onMouseDown }) {
    const corners = ['tl', 'tr', 'bl', 'br']

    return (
        <>
            {corners.map(corner => (
                <ResizeHandle
                    key={corner}
                    corner={corner}
                    onMouseDown={(e) => onMouseDown(e, item, `resize-${corner}`)}
                />
            ))}
        </>
    )
})

// ============================================================================
// Rotation Ring Component (for original image rotation)
// ============================================================================
const RotationRing = memo(function RotationRing({ onMouseDown }) {
    return (
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
            onMouseDown={onMouseDown}
        />
    )
})

// ============================================================================
// Frame Rotation Handle Component (for selection box rotation)
// ============================================================================
const FrameRotationHandle = memo(function FrameRotationHandle({ onMouseDown, frameRotation }) {
    return (
        <div
            className="frame-rotation-handle"
            style={{
                position: 'absolute',
                top: -35,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 24,
                backgroundColor: 'var(--accent-secondary, #10b981)',
                borderRadius: '50%',
                cursor: 'grab',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: '2px solid white'
            }}
            onMouseDown={onMouseDown}
            title={`Frame rotation: ${Math.round(frameRotation || 0)}°`}
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 12a9 9 0 0 0-9-9M21 3v9h-9" />
                <path d="M3 12a9 9 0 0 0 9 9M3 21v-9h9" />
            </svg>
        </div>
    )
})

// ============================================================================
// Selection Indicator Component
// ============================================================================
const SelectionIndicator = memo(function SelectionIndicator({ frameShape, customPoints }) {
    return (
        <div
            style={{
                position: 'absolute',
                inset: -6,
                clipPath: getClipPath(frameShape || 'rectangle', customPoints),
                border: '2px solid var(--accent-primary)',
                boxShadow: '0 0 12px var(--accent-primary)',
                pointerEvents: 'none',
                zIndex: 3
            }}
        />
    )
})

// ============================================================================
// Empty State Component
// ============================================================================
const EmptyStateHint = memo(function EmptyStateHint() {
    return (
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
    )
})

// ============================================================================
// ShapedBorder Component - SVG polygon borders for manga-style effect
// ============================================================================
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

    // Calculate inner points for double border effect
    const innerPoints = useMemo(() => {
        const insetAmount = Math.max(borderWidth, 4)
        const centerX = size.width / 2
        const centerY = size.height / 2

        return points
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
    }, [points, size.width, size.height, borderWidth])

    // Container style
    const containerStyle = {
        position: 'absolute',
        inset: -4,
        pointerEvents: isEditingCorners ? 'auto' : 'none',
        zIndex: 2
    }

    // Don't render borders if style is 'none'
    if (borderStyle === 'none' && !isEditingCorners) {
        return <div ref={containerRef} style={containerStyle} />
    }

    // Get stroke dash array based on style
    const strokeDashArray = borderStyle === 'dashed'
        ? `${borderWidth * 3},${borderWidth * 2}`
        : 'none'

    return (
        <div ref={containerRef} style={containerStyle}>
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
                    strokeDasharray={strokeDashArray}
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

// ============================================================================
// Resize Logic Helpers
// ============================================================================

/**
 * Calculate resize updates for a specific corner
 * Maintains aspect ratio and anchors to the opposite corner
 */
function calculateResizeUpdates(corner, deltaX, deltaY, startItem, aspectRatio, pageWidth, pageHeight) {
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const useDeltaX = absDeltaX > absDeltaY

    let updates = {}

    switch (corner) {
        case 'br': {
            // Bottom-right: anchor top-left
            if (useDeltaX) {
                const newWidth = Math.max(MIN_ITEM_SIZE, Math.min(pageWidth - startItem.x, startItem.width + deltaX))
                updates.width = newWidth
                updates.height = newWidth / aspectRatio
            } else {
                const newHeight = Math.max(MIN_ITEM_SIZE, Math.min(pageHeight - startItem.y, startItem.height + deltaY))
                updates.height = newHeight
                updates.width = newHeight * aspectRatio
            }
            break
        }
        case 'bl': {
            // Bottom-left: anchor top-right
            if (useDeltaX) {
                const newWidth = Math.max(MIN_ITEM_SIZE, startItem.width - deltaX)
                const widthDiff = newWidth - startItem.width
                updates.width = newWidth
                updates.height = newWidth / aspectRatio
                updates.x = startItem.x - widthDiff
            } else {
                const newHeight = Math.max(MIN_ITEM_SIZE, Math.min(pageHeight - startItem.y, startItem.height + deltaY))
                const newWidth = newHeight * aspectRatio
                const widthDiff = newWidth - startItem.width
                updates.height = newHeight
                updates.width = newWidth
                updates.x = startItem.x - widthDiff
            }
            break
        }
        case 'tr': {
            // Top-right: anchor bottom-left
            if (useDeltaX) {
                const newWidth = Math.max(MIN_ITEM_SIZE, Math.min(pageWidth - startItem.x, startItem.width + deltaX))
                const newHeight = newWidth / aspectRatio
                const heightDiff = newHeight - startItem.height
                updates.width = newWidth
                updates.height = newHeight
                updates.y = startItem.y - heightDiff
            } else {
                const newHeight = Math.max(MIN_ITEM_SIZE, startItem.height - deltaY)
                const heightDiff = newHeight - startItem.height
                updates.height = newHeight
                updates.width = newHeight * aspectRatio
                updates.y = startItem.y - heightDiff
            }
            break
        }
        case 'tl': {
            // Top-left: anchor bottom-right
            if (useDeltaX) {
                const newWidth = Math.max(MIN_ITEM_SIZE, startItem.width - deltaX)
                const newHeight = newWidth / aspectRatio
                const widthDiff = newWidth - startItem.width
                const heightDiff = newHeight - startItem.height
                updates.width = newWidth
                updates.height = newHeight
                updates.x = startItem.x - widthDiff
                updates.y = startItem.y - heightDiff
            } else {
                const newHeight = Math.max(MIN_ITEM_SIZE, startItem.height - deltaY)
                const newWidth = newHeight * aspectRatio
                const widthDiff = newWidth - startItem.width
                const heightDiff = newHeight - startItem.height
                updates.height = newHeight
                updates.width = newWidth
                updates.x = startItem.x - widthDiff
                updates.y = startItem.y - heightDiff
            }
            break
        }
    }

    // Clamp position to stay within canvas
    if (updates.x !== undefined) updates.x = Math.max(0, updates.x)
    if (updates.y !== undefined) updates.y = Math.max(0, updates.y)

    return updates
}

// ============================================================================
// Canvas Edge Resize Handle Component
// ============================================================================
const CanvasResizeHandle = memo(function CanvasResizeHandle({ edge, onMouseDown }) {
    const size = 8
    const len = 50

    const baseStyle = {
        position: 'absolute',
        backgroundColor: 'var(--accent-primary)',
        opacity: 0.7,
        zIndex: 20,
        borderRadius: '3px'
    }

    const edgeStyles = {
        top: { top: -size - 6, left: '50%', transform: 'translateX(-50%)', width: len, height: size, cursor: 'ns-resize' },
        bottom: { bottom: -size - 6, left: '50%', transform: 'translateX(-50%)', width: len, height: size, cursor: 'ns-resize' },
        left: { left: -size - 6, top: '50%', transform: 'translateY(-50%)', width: size, height: len, cursor: 'ew-resize' },
        right: { right: -size - 6, top: '50%', transform: 'translateY(-50%)', width: size, height: len, cursor: 'ew-resize' }
    }

    return (
        <div
            style={{ ...baseStyle, ...edgeStyles[edge] }}
            onMouseDown={(e) => onMouseDown(e, edge)}
            title={edge === 'top' || edge === 'bottom' ? 'Resize height' : 'Resize width'}
        />
    )
})

// ============================================================================
// Placed Item Component
// ============================================================================
const PlacedItem = memo(function PlacedItem({
    item,
    crop,
    isSelected,
    isRotating,
    isFrameRotating,
    isPanning,
    currentRotation,
    currentFrameRotation,
    currentCropOffset,
    composition,
    filterCss,
    onMouseDown,
    onCornerMouseDown
}) {
    // Convert pixel coordinates to percentages for rendering
    const leftPct = (item.x / composition.pageWidth) * 100
    const topPct = (item.y / composition.pageHeight) * 100
    const widthPct = (item.width / composition.pageWidth) * 100
    const heightPct = (item.height / composition.pageHeight) * 100

    // Frame rotation (rotates the entire container/selection box)
    const frameRotation = currentFrameRotation ?? item.frameRotation ?? 0

    const itemStyle = {
        position: 'absolute',
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        boxSizing: 'border-box',
        cursor: isRotating || isFrameRotating ? 'grabbing' : 'grab',
        zIndex: isSelected ? 10 : 1,
        transform: frameRotation !== 0 ? `rotate(${frameRotation}deg)` : undefined,
        transformOrigin: 'center center',
    }

    const imageContainerStyle = {
        position: 'absolute',
        inset: 0,
        clipPath: item.phoneMockup ? 'none' : getClipPath(item.frameShape || 'rectangle', item.customPoints),
        overflow: 'hidden'
    }

    const isEditingCorners = isSelected && !!item.editingCorners

    // Image content (reused in both normal and phone mockup modes)
    const imageContent = (
        <RotatableImage
            crop={crop}
            currentRotation={currentRotation}
            isRotating={isRotating}
            filterCss={filterCss}
            hideRotationOverlay={isEditingCorners}
            cropOffsetX={currentCropOffset?.x ?? item.cropOffsetX ?? 0}
            cropOffsetY={currentCropOffset?.y ?? item.cropOffsetY ?? 0}
            isPanning={isPanning}
        />
    )

    return (
        <div
            className={`freeform-item ${isSelected ? 'selected' : ''}`}
            style={itemStyle}
            onMouseDown={(e) => onMouseDown(e, item, 'move')}
            onClick={(e) => e.stopPropagation()}
        >
            {/* Rotation ring for image rotation - visible when selected */}
            {isSelected && (
                <RotationRing onMouseDown={(e) => onMouseDown(e, item, 'rotate')} />
            )}

            {/* Frame rotation handle - visible when selected */}
            {isSelected && (
                <FrameRotationHandle
                    onMouseDown={(e) => onMouseDown(e, item, 'frame-rotate')}
                    frameRotation={frameRotation}
                />
            )}

            {/* Phone Mockup Frame */}
            {item.phoneMockup ? (
                <PhoneMockup
                    color={item.phoneColor || '#1a1a1a'}
                    style={item.phoneStyle || 'modern'}
                    landscape={crop && crop.width > crop.height}
                >
                    {imageContent}
                </PhoneMockup>
            ) : (
                <>
                    {/* Manga-style polygon border */}
                    <ShapedBorder
                        shapeId={item.frameShape || 'rectangle'}
                        customPoints={item.customPoints}
                        isSelected={isSelected}
                        isEditingCorners={isEditingCorners}
                        onCornerMouseDown={(e, cornerIndex) => onCornerMouseDown(e, item, cornerIndex)}
                        borderColor={item.borderColor || '#000'}
                        borderWidth={item.borderWidth ?? 3}
                        borderStyle={item.borderStyle || 'manga'}
                    />

                    {/* Selection indicator */}
                    {isSelected && (
                        <SelectionIndicator
                            frameShape={item.frameShape}
                            customPoints={item.customPoints}
                        />
                    )}

                    {/* Image container with clipping */}
                    <div style={imageContainerStyle}>
                        {imageContent}
                    </div>
                </>
            )}

            {/* Resize handles (hide when editing custom corners) */}
            {isSelected && !item.editingCorners && (
                <ResizeHandles item={item} onMouseDown={onMouseDown} />
            )}
        </div>
    )
})

// ============================================================================
// Main FreeformCanvas Component
// ============================================================================
function FreeformCanvas({
    composition,
    crops,
    placedItems,
    selectedItemId,
    onSelectItem,
    onUpdateItem,
    onUpdateItemSilent,
    onDragEnd,
    onDropCrop,
    onDeleteItem,
    onUpdatePageSize
}) {
    const canvasRef = useRef(null)
    const [dragState, setDragState] = useState(null)
    const [dragOverCanvas, setDragOverCanvas] = useState(false)
    const [canvasResizeState, setCanvasResizeState] = useState(null)

    // Rotation values during drag (not yet committed to item state)
    const [imageRotation, setImageRotation] = useState(0)  // original image within crop
    const [frameRotation, setFrameRotation] = useState(0)  // entire selection box
    // Crop offset values during Ctrl+drag (panning within original image)
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })

    // ========================================================================
    // Keyboard Event Handler
    // ========================================================================
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
            const x = ((e.clientX - rect.left) / rect.width) * composition.pageWidth
            const y = ((e.clientY - rect.top) / rect.height) * composition.pageHeight
            onDropCrop(parseInt(cropId, 10), x, y)
        }
    }, [onDropCrop, composition.pageWidth, composition.pageHeight])

    // ========================================================================
    // Item Interaction Handlers
    // ========================================================================
    const handleItemMouseDown = useCallback((e, item, type = 'move') => {
        e.stopPropagation()
        e.preventDefault()
        onSelectItem(item.id)

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
            setCropOffset({
                x: item.cropOffsetX ?? 0,
                y: item.cropOffsetY ?? 0
            })
            setDragState(baseDragState)
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
            } else {
                const currentFrameRotation = item.frameRotation ?? 0
                setFrameRotation(currentFrameRotation)
                setDragState({ ...baseDragState, startAngle, centerX, centerY })
            }
        } else {
            setDragState(baseDragState)
        }
    }, [onSelectItem, crops])

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

    // ========================================================================
    // Mouse Move Handler - Handles all drag operations
    // ========================================================================
    const handleMouseMove = useCallback((e) => {
        if (!dragState || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const deltaX = ((e.clientX - dragState.startX) / rect.width) * composition.pageWidth
        const deltaY = ((e.clientY - dragState.startY) / rect.height) * composition.pageHeight
        const updateFn = onUpdateItemSilent || onUpdateItem

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
            return
        }

        // Handle crop panning (Ctrl+drag to shift crop position within original image)
        if (dragState.type === 'crop-pan') {
            const { startItem } = dragState
            const crop = crops.find(c => c.id === startItem.cropId)
            if (!crop) return

            // Calculate delta in original image pixel space
            // The movement in screen pixels needs to be converted to original image pixels
            const screenDeltaX = e.clientX - dragState.startX
            const screenDeltaY = e.clientY - dragState.startY

            // Scale from screen pixels to original image pixels based on crop size
            // The item's display size represents the crop's width/height
            const item = placedItems.find(i => i.id === dragState.itemId)
            if (!item) return
            const itemDisplayWidth = (item.width / composition.pageWidth) * rect.width
            const itemDisplayHeight = (item.height / composition.pageHeight) * rect.height
            const scaleToOriginalX = crop.width / itemDisplayWidth
            const scaleToOriginalY = crop.height / itemDisplayHeight

            const initialOffsetX = startItem.cropOffsetX ?? 0
            const initialOffsetY = startItem.cropOffsetY ?? 0

            // Invert the delta so moving right reveals more of the left side of the image
            const newOffsetX = initialOffsetX - screenDeltaX * scaleToOriginalX
            const newOffsetY = initialOffsetY - screenDeltaY * scaleToOriginalY

            setCropOffset({ x: newOffsetX, y: newOffsetY })
            return
        }

        // Handle move
        if (dragState.type === 'move') {
            updateFn(dragState.itemId, {
                x: Math.max(0, Math.min(composition.pageWidth - dragState.startItem.width, dragState.startItem.x + deltaX)),
                y: Math.max(0, Math.min(composition.pageHeight - dragState.startItem.height, dragState.startItem.y + deltaY))
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
                aspectRatio, composition.pageWidth, composition.pageHeight
            )
            updateFn(dragState.itemId, updates)
            return
        }

        // Handle corner dragging (custom polygon points)
        if (dragState.type === 'corner' && dragState.cornerIndex !== undefined) {
            const item = placedItems.find(i => i.id === dragState.itemId)
            if (!item) return

            const currentPoints = item.customPoints ||
                (FRAME_SHAPES[item.frameShape]?.points || FRAME_SHAPES.rectangle.points).map(p => [...p])

            const itemWidthPx = (item.width / composition.pageWidth) * rect.width
            const itemHeightPx = (item.height / composition.pageHeight) * rect.height
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

            updateFn(dragState.itemId, { customPoints: newPoints })
            setDragState(prev => ({ ...prev, startX: e.clientX, startY: e.clientY }))
        }
    }, [dragState, onUpdateItem, onUpdateItemSilent, crops, placedItems, composition.pageWidth, composition.pageHeight])

    // ========================================================================
    // Mouse Up Handler
    // ========================================================================
    const handleMouseUp = useCallback(() => {
        if (!dragState) return

        // Handle image rotation end - commit value to item state
        if (dragState.type === 'rotate') {
            onUpdateItem(dragState.itemId, { rotation: imageRotation })
        }
        // Handle frame rotation end - commit value to item state
        else if (dragState.type === 'frame-rotate') {
            onUpdateItem(dragState.itemId, { frameRotation: frameRotation })
        }
        // Handle crop pan end - commit offset to item state
        else if (dragState.type === 'crop-pan') {
            onUpdateItem(dragState.itemId, {
                cropOffsetX: cropOffset.x,
                cropOffsetY: cropOffset.y
            })
        }
        // Handle other drag operations
        else if (dragState.type === 'move' || dragState.type.startsWith('resize-') || dragState.type === 'corner') {
            onDragEnd?.()
        }

        setDragState(null)
    }, [dragState, imageRotation, frameRotation, cropOffset, onUpdateItem, onDragEnd])

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
            startWidth: composition.pageWidth,
            startHeight: composition.pageHeight
        })
    }, [composition.pageWidth, composition.pageHeight])

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

        if (Object.keys(updates).length > 0 && onUpdatePageSize) {
            onUpdatePageSize(updates)
        }
    }, [canvasResizeState, onUpdatePageSize])

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
        aspectRatio: composition.pageWidth / composition.pageHeight,
        height: '100%',
        width: 'auto',
        maxWidth: '100%',
        backgroundColor: composition.backgroundColor,
        position: 'relative',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: dragOverCanvas ? '2px dashed var(--accent-primary)' : '2px solid transparent',
        cursor: dragState ? (dragState.type === 'move' ? 'grabbing' : 'nwse-resize') : 'default'
    }), [composition.pageWidth, composition.pageHeight, composition.backgroundColor, dragOverCanvas, dragState])

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
                {onUpdatePageSize && (
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
                    onClick={() => onSelectItem(null)}
                >
                    {/* Render placed items */}
                    {placedItems.map((item) => {
                        const crop = getCropById(item.cropId)
                        if (!crop) return null

                        const isSelected = selectedItemId === item.id
                        // Derive rotation state from dragState - no separate ID tracking needed
                        const isDraggingImageRotation = dragState?.type === 'rotate' && dragState?.itemId === item.id
                        const isDraggingFrameRotation = dragState?.type === 'frame-rotate' && dragState?.itemId === item.id
                        const isDraggingCropPan = dragState?.type === 'crop-pan' && dragState?.itemId === item.id
                        const currentRotation = isDraggingImageRotation ? imageRotation : (item.rotation ?? crop.rotation ?? 0)
                        const currentFrameRotation = isDraggingFrameRotation ? frameRotation : item.frameRotation
                        const currentCropOffset = isDraggingCropPan ? cropOffset : null

                        return (
                            <PlacedItem
                                key={item.id}
                                item={item}
                                crop={crop}
                                isSelected={isSelected}
                                isRotating={isDraggingImageRotation}
                                isFrameRotating={isDraggingFrameRotation}
                                isPanning={isDraggingCropPan}
                                currentRotation={currentRotation}
                                currentFrameRotation={currentFrameRotation}
                                currentCropOffset={currentCropOffset}
                                composition={composition}
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
