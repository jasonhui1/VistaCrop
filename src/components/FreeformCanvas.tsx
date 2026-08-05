import { memo, useCallback, useEffect, useMemo, useRef, useState, DragEvent, MouseEvent, CSSProperties } from 'react'
import { Composition, Crop, PlacedItem, Point2D, BorderStyle, PhoneStyle } from '../types'
import { getClipPath, FRAME_SHAPES } from '../utils/frameShapes'
import { getCropById, getFilterStyle, idsEqual } from '../utils/canvasUtils'
import RotatableImage from './RotatableImage'
import PhoneMockup from './PhoneMockup'

const ROTATION_EDGE_THRESHOLD = 20
const MIN_ITEM_SIZE = 50
const MIN_CANVAS_SIZE = 200

export type CornerType = 'tl' | 'tr' | 'bl' | 'br'
export type CanvasEdge = 'top' | 'bottom' | 'left' | 'right'

export interface ResizeDelta {
    deltaX: number
    deltaY: number
}

export interface PageBounds {
    pageWidth: number
    pageHeight: number
}

export interface CalculateResizeParams {
    corner: CornerType
    delta: ResizeDelta
    startItem: PlacedItem
    aspectRatio: number
    page: PageBounds
}

export function calculateResizeUpdates({
    corner,
    delta,
    startItem,
    aspectRatio,
    page
}: CalculateResizeParams): Partial<PlacedItem> {
    const { deltaX, deltaY } = delta
    const { pageWidth, pageHeight } = page
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const useDeltaX = absDeltaX > absDeltaY

    const updates: Partial<PlacedItem> = {}

    switch (corner) {
        case 'br': {
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

    if (updates.x !== undefined) updates.x = Math.max(0, updates.x)
    if (updates.y !== undefined) updates.y = Math.max(0, updates.y)

    return updates
}

interface ResizeHandleProps {
    corner: CornerType
    onMouseDown: (e: MouseEvent<HTMLDivElement>) => void
}

const ResizeHandle = memo(function ResizeHandle({ corner, onMouseDown }: ResizeHandleProps) {
    const positions: Record<CornerType, CSSProperties> = {
        tl: { left: -8, top: -8, cursor: 'nwse-resize' },
        tr: { right: -8, top: -8, cursor: 'nesw-resize' },
        bl: { left: -8, bottom: -8, cursor: 'nesw-resize' },
        br: { right: -8, bottom: -8, cursor: 'nwse-resize' }
    }

    return (
        <div
            className={`resize-handle resize-${corner}`}
            style={{
                position: 'absolute',
                ...positions[corner],
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

interface ResizeHandlesProps {
    item: PlacedItem
    onMouseDown: (e: MouseEvent<HTMLDivElement>, item: PlacedItem, action: string) => void
}

const ResizeHandles = memo(function ResizeHandles({ item, onMouseDown }: ResizeHandlesProps) {
    const corners: CornerType[] = ['tl', 'tr', 'bl', 'br']

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

interface RotationRingProps {
    onMouseDown: (e: MouseEvent<HTMLDivElement>) => void
}

const RotationRing = memo(function RotationRing({ onMouseDown }: RotationRingProps) {
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

interface FrameRotationHandleProps {
    onMouseDown: (e: MouseEvent<HTMLDivElement>) => void
    frameRotation?: number
}

const FrameRotationHandle = memo(function FrameRotationHandle({ onMouseDown, frameRotation }: FrameRotationHandleProps) {
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

interface SelectionIndicatorProps {
    frameShape?: string
    customPoints?: Point2D[]
}

const SelectionIndicator = memo(function SelectionIndicator({ frameShape, customPoints }: SelectionIndicatorProps) {
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

interface ShapedBorderProps {
    shapeId?: string
    customPoints?: Point2D[]
    isSelected?: boolean
    isEditingCorners?: boolean
    onCornerMouseDown?: (e: MouseEvent, cornerIndex: number) => void
    borderColor?: string
    borderWidth?: number
    borderStyle?: BorderStyle
}

const ShapedBorder = memo(function ShapedBorder({
    shapeId = 'rectangle',
    customPoints,
    isEditingCorners,
    onCornerMouseDown,
    borderColor = '#000',
    borderWidth = 3,
    borderStyle = 'manga'
}: ShapedBorderProps) {
    const containerRef = useRef<HTMLDivElement>(null)
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

    const points = customPoints || FRAME_SHAPES[shapeId]?.points || FRAME_SHAPES.rectangle.points

    const outerPoints = points
        .map(([xPct, yPct]) => `${(xPct / 100) * size.width},${(yPct / 100) * size.height}`)
        .join(' ')

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

    const containerStyle: CSSProperties = {
        position: 'absolute',
        inset: -4,
        pointerEvents: isEditingCorners ? 'auto' : 'none',
        zIndex: 2
    }

    if (borderStyle === 'none' && !isEditingCorners) {
        return <div ref={containerRef} style={containerStyle} />
    }

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
                <polygon
                    points={outerPoints}
                    fill="none"
                    stroke={borderColor}
                    strokeWidth={borderWidth}
                    strokeLinejoin="miter"
                    strokeDasharray={strokeDashArray}
                />
                {borderStyle === 'manga' && (
                    <polygon
                        points={innerPoints}
                        fill="none"
                        stroke={borderColor}
                        strokeWidth={Math.max(1, borderWidth * 0.6)}
                        strokeLinejoin="miter"
                    />
                )}
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

interface CanvasResizeHandleProps {
    edge: CanvasEdge
    onMouseDown: (e: MouseEvent<HTMLDivElement>, edge: CanvasEdge) => void
}

const CanvasResizeHandle = memo(function CanvasResizeHandle({ edge, onMouseDown }: CanvasResizeHandleProps) {
    const size = 8
    const len = 50

    const baseStyle: CSSProperties = {
        position: 'absolute',
        backgroundColor: 'var(--accent-primary)',
        opacity: 0.7,
        zIndex: 20,
        borderRadius: '3px'
    }

    const edgeStyles: Record<CanvasEdge, CSSProperties> = {
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

interface PlacedItemComponentProps {
    item: PlacedItem
    crop: Crop
    isSelected: boolean
    isRotating: boolean
    isFrameRotating: boolean
    isPanning: boolean
    currentRotation: number
    currentFrameRotation?: number
    currentCropOffset: { x: number; y: number } | null
    composition: Composition
    filterCss: string
    onMouseDown: (e: MouseEvent<HTMLDivElement>, item: PlacedItem, action: string) => void
    onCornerMouseDown: (e: MouseEvent, item: PlacedItem, cornerIndex: number) => void
}

const PlacedItemComponent = memo(function PlacedItemComponent({
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
}: PlacedItemComponentProps) {
    const leftPct = (item.x / composition.pageWidth) * 100
    const topPct = (item.y / composition.pageHeight) * 100
    const widthPct = (item.width / composition.pageWidth) * 100
    const heightPct = (item.height / composition.pageHeight) * 100

    const frameRotation = currentFrameRotation ?? item.frameRotation ?? 0

    const itemStyle: CSSProperties = {
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

    const imageContainerStyle: CSSProperties = {
        position: 'absolute',
        inset: 0,
        clipPath: item.phoneMockup ? 'none' : getClipPath(item.frameShape || 'rectangle', item.customPoints),
        overflow: 'hidden'
    }

    const isEditingCorners = isSelected && !!item.editingCorners

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
            {isSelected && (
                <RotationRing onMouseDown={(e) => onMouseDown(e, item, 'rotate')} />
            )}

            {isSelected && (
                <FrameRotationHandle
                    onMouseDown={(e) => onMouseDown(e, item, 'frame-rotate')}
                    frameRotation={frameRotation}
                />
            )}

            {item.phoneMockup ? (
                <PhoneMockup
                    color={item.phoneColor || '#1a1a1a'}
                    style={(item.phoneStyle as PhoneStyle) || 'modern'}
                    landscape={crop && crop.width > crop.height}
                >
                    {imageContent}
                </PhoneMockup>
            ) : (
                <>
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

                    {isSelected && (
                        <SelectionIndicator
                            frameShape={item.frameShape}
                            customPoints={item.customPoints}
                        />
                    )}

                    <div style={imageContainerStyle}>
                        {imageContent}
                    </div>
                </>
            )}

            {isSelected && !item.editingCorners && (
                <ResizeHandles item={item} onMouseDown={onMouseDown} />
            )}
        </div>
    )
})

interface DragState {
    type: string
    itemId: string | number
    startX: number
    startY: number
    startItem: PlacedItem
    startAngle?: number
    centerX?: number
    centerY?: number
    cornerIndex?: number
}

interface CanvasResizeState {
    edge: CanvasEdge
    startX: number
    startY: number
    startWidth: number
    startHeight: number
}

export interface FreeformCanvasProps {
    composition: Composition
    crops: Crop[]
    placedItems: PlacedItem[]
    selectedItemId: string | number | null
    onSelectItem: (id: string | number | null) => void
    onUpdateItem: (id: string | number, updates: Partial<PlacedItem>) => void
    onUpdateItemSilent?: (id: string | number, updates: Partial<PlacedItem>) => void
    onDragEnd?: () => void
    onDropCrop: (cropId: string | number, x: number, y: number) => void
    onDeleteItem: (id: string | number) => void
    onUpdatePageSize?: (updates: { pageWidth?: number; pageHeight?: number }) => void
}

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
}: FreeformCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [dragState, setDragState] = useState<DragState | null>(null)
    const [dragOverCanvas, setDragOverCanvas] = useState(false)
    const [canvasResizeState, setCanvasResizeState] = useState<CanvasResizeState | null>(null)

    const [imageRotation, setImageRotation] = useState(0)
    const [frameRotation, setFrameRotation] = useState(0)
    const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItemId && !((e.target as HTMLElement)?.matches('input, textarea'))) {
                e.preventDefault()
                onDeleteItem(selectedItemId)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [selectedItemId, onDeleteItem])

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setDragOverCanvas(true)
    }, [])

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverCanvas(false)
        }
    }, [])

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragOverCanvas(false)

        const rawCropId = e.dataTransfer.getData('application/crop-id') || e.dataTransfer.getData('text/plain')
        if (rawCropId && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            const x = ((e.clientX - rect.left) / rect.width) * composition.pageWidth
            const y = ((e.clientY - rect.top) / rect.height) * composition.pageHeight
            const parsedNumber = parseInt(rawCropId, 10)
            const cropId = isNaN(parsedNumber) ? rawCropId : parsedNumber
            onDropCrop(cropId, x, y)
        }
    }, [onDropCrop, composition.pageWidth, composition.pageHeight])

    const handleItemMouseDown = useCallback((e: MouseEvent<HTMLDivElement>, item: PlacedItem, type = 'move') => {
        e.stopPropagation()
        e.preventDefault()
        onSelectItem(item.id)

        const actualType = (type === 'move' && e.ctrlKey) ? 'crop-pan' : type

        const baseDragState: DragState = {
            type: actualType,
            itemId: item.id,
            startX: e.clientX,
            startY: e.clientY,
            startItem: { ...item }
        }

        if (actualType === 'crop-pan') {
            setCropOffset({
                x: item.cropOffsetX ?? 0,
                y: item.cropOffsetY ?? 0
            })
            setDragState(baseDragState)
            return
        }

        if (type === 'rotate' || type === 'frame-rotate') {
            const itemElement = (e.target as HTMLElement).closest('.freeform-item')
            if (!itemElement) return
            const itemRect = itemElement.getBoundingClientRect()
            const centerX = itemRect.left + itemRect.width / 2
            const centerY = itemRect.top + itemRect.height / 2
            const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)

            if (type === 'rotate') {
                const crop = getCropById(crops, item.cropId)
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

    const handleCornerMouseDown = useCallback((e: MouseEvent, item: PlacedItem, cornerIndex: number) => {
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

    const handleMouseMove = useCallback((e: globalThis.MouseEvent) => {
        if (!dragState || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const deltaX = ((e.clientX - dragState.startX) / rect.width) * composition.pageWidth
        const deltaY = ((e.clientY - dragState.startY) / rect.height) * composition.pageHeight
        const updateFn = onUpdateItemSilent || onUpdateItem

        if (dragState.type === 'rotate') {
            const { centerX = 0, centerY = 0, startAngle = 0, startItem } = dragState
            const crop = getCropById(crops, startItem.cropId)
            const initialAngle = startItem.rotation ?? crop?.rotation ?? 0
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
            let newRotation = initialAngle + (currentAngle - startAngle)

            while (newRotation > 180) newRotation -= 360
            while (newRotation < -180) newRotation += 360

            setImageRotation(newRotation)
            return
        }

        if (dragState.type === 'frame-rotate') {
            const { centerX = 0, centerY = 0, startAngle = 0, startItem } = dragState
            const initialAngle = startItem.frameRotation ?? 0
            const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI)
            let newRotation = initialAngle + (currentAngle - startAngle)

            while (newRotation > 180) newRotation -= 360
            while (newRotation < -180) newRotation += 360

            setFrameRotation(newRotation)
            return
        }

        if (dragState.type === 'crop-pan') {
            const { startItem } = dragState
            const crop = getCropById(crops, startItem.cropId)
            if (!crop) return

            const screenDeltaX = e.clientX - dragState.startX
            const screenDeltaY = e.clientY - dragState.startY

            const item = placedItems.find(i => idsEqual(i.id, dragState.itemId))
            if (!item) return
            const itemDisplayWidth = (item.width / composition.pageWidth) * rect.width
            const itemDisplayHeight = (item.height / composition.pageHeight) * rect.height
            const scaleToOriginalX = crop.width / itemDisplayWidth
            const scaleToOriginalY = crop.height / itemDisplayHeight

            const initialOffsetX = startItem.cropOffsetX ?? 0
            const initialOffsetY = startItem.cropOffsetY ?? 0

            const newOffsetX = initialOffsetX - screenDeltaX * scaleToOriginalX
            const newOffsetY = initialOffsetY - screenDeltaY * scaleToOriginalY

            setCropOffset({ x: newOffsetX, y: newOffsetY })
            return
        }

        if (dragState.type === 'move') {
            updateFn(dragState.itemId, {
                x: Math.max(0, Math.min(composition.pageWidth - dragState.startItem.width, dragState.startItem.x + deltaX)),
                y: Math.max(0, Math.min(composition.pageHeight - dragState.startItem.height, dragState.startItem.y + deltaY))
            })
            return
        }

        if (dragState.type.startsWith('resize-')) {
            const corner = dragState.type.split('-')[1] as CornerType
            const crop = getCropById(crops, dragState.startItem.cropId)
            if (!crop) return

            const aspectRatio = crop.width / crop.height
            const updates = calculateResizeUpdates({
                corner,
                delta: { deltaX, deltaY },
                startItem: dragState.startItem,
                aspectRatio,
                page: { pageWidth: composition.pageWidth, pageHeight: composition.pageHeight }
            })
            updateFn(dragState.itemId, updates)
            return
        }

        if (dragState.type === 'corner' && dragState.cornerIndex !== undefined) {
            const item = placedItems.find(i => idsEqual(i.id, dragState.itemId))
            if (!item) return

            const currentPoints = item.customPoints ||
                (FRAME_SHAPES[item.frameShape || 'rectangle']?.points || FRAME_SHAPES.rectangle.points).map(p => [...p] as Point2D)

            const itemWidthPx = (item.width / composition.pageWidth) * rect.width
            const itemHeightPx = (item.height / composition.pageHeight) * rect.height
            const deltaPctX = ((e.clientX - dragState.startX) / itemWidthPx) * 100
            const deltaPctY = ((e.clientY - dragState.startY) / itemHeightPx) * 100

            const newPoints = currentPoints.map((point, idx) => {
                if (idx === dragState.cornerIndex) {
                    return [
                        Math.max(0, Math.min(100, point[0] + deltaPctX)),
                        Math.max(0, Math.min(100, point[1] + deltaPctY))
                    ] as Point2D
                }
                return [...point] as Point2D
            })

            updateFn(dragState.itemId, { customPoints: newPoints })
            setDragState(prev => prev ? { ...prev, startX: e.clientX, startY: e.clientY } : null)
        }
    }, [dragState, onUpdateItem, onUpdateItemSilent, crops, placedItems, composition.pageWidth, composition.pageHeight])

    const handleMouseUp = useCallback(() => {
        if (!dragState) return

        if (dragState.type === 'rotate') {
            onUpdateItem(dragState.itemId, { rotation: imageRotation })
        } else if (dragState.type === 'frame-rotate') {
            onUpdateItem(dragState.itemId, { frameRotation: frameRotation })
        } else if (dragState.type === 'crop-pan') {
            onUpdateItem(dragState.itemId, {
                cropOffsetX: cropOffset.x,
                cropOffsetY: cropOffset.y
            })
        } else if (dragState.type === 'move' || dragState.type.startsWith('resize-') || dragState.type === 'corner') {
            onDragEnd?.()
        }

        setDragState(null)
    }, [dragState, imageRotation, frameRotation, cropOffset, onUpdateItem, onDragEnd])

    useEffect(() => {
        if (!dragState) return
        const onMove = (e: globalThis.MouseEvent) => handleMouseMove(e)
        const onUp = () => handleMouseUp()
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [dragState, handleMouseMove, handleMouseUp])

    const handleCanvasResizeStart = useCallback((e: MouseEvent<HTMLDivElement>, edge: CanvasEdge) => {
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

    const handleCanvasResizeMove = useCallback((e: globalThis.MouseEvent) => {
        if (!canvasResizeState || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const { edge, startX, startY, startWidth, startHeight } = canvasResizeState
        const screenToPageX = startWidth / rect.width
        const screenToPageY = startHeight / rect.height
        const deltaScreenX = e.clientX - startX
        const deltaScreenY = e.clientY - startY

        const updates: { pageWidth?: number; pageHeight?: number } = {}
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

    useEffect(() => {
        if (!canvasResizeState) return
        const onMove = (e: globalThis.MouseEvent) => handleCanvasResizeMove(e)
        const onUp = () => handleCanvasResizeEnd()
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
    }, [canvasResizeState, handleCanvasResizeMove, handleCanvasResizeEnd])

    const containerStyle = useMemo<CSSProperties>(() => ({
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

    const wrapperStyle: CSSProperties = {
        position: 'relative',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }

    const canvasEdges: CanvasEdge[] = ['top', 'bottom', 'left', 'right']

    return (
        <div style={wrapperStyle}>
            <div style={{ position: 'relative', height: '100%', maxWidth: '100%' }}>
                {onUpdatePageSize && (
                    <>
                        {canvasEdges.map(edge => (
                            <CanvasResizeHandle
                                key={edge}
                                edge={edge}
                                onMouseDown={handleCanvasResizeStart}
                            />
                        ))}
                    </>
                )}

                <div
                    ref={canvasRef}
                    className="freeform-canvas"
                    style={containerStyle}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => onSelectItem(null)}
                >
                    {placedItems.map((item) => {
                        const crop = getCropById(crops, item.cropId)
                        if (!crop) return null

                        const isSelected = idsEqual(selectedItemId, item.id)
                        const isDraggingImageRotation = dragState?.type === 'rotate' && idsEqual(dragState?.itemId, item.id)
                        const isDraggingFrameRotation = dragState?.type === 'frame-rotate' && idsEqual(dragState?.itemId, item.id)
                        const isDraggingCropPan = dragState?.type === 'crop-pan' && idsEqual(dragState?.itemId, item.id)
                        const currentRotation = isDraggingImageRotation ? imageRotation : (item.rotation ?? crop.rotation ?? 0)
                        const currentFrameRotation = isDraggingFrameRotation ? frameRotation : item.frameRotation
                        const currentCropOffset = isDraggingCropPan ? cropOffset : null

                        return (
                            <PlacedItemComponent
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

                    {placedItems.length === 0 && <EmptyStateHint />}
                </div>
            </div>
        </div>
    )
}

export default memo(FreeformCanvas)
