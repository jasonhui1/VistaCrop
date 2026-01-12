import { memo, useCallback, useRef, useState } from 'react'
import { FILTERS } from '../utils/filters'

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
    const [dragState, setDragState] = useState(null) // { type: 'move' | 'resize', itemId, startX, startY, startItem }
    const [dragOverCanvas, setDragOverCanvas] = useState(false)

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
            onDropCrop(parseInt(cropId, 10), x, y)
        }
    }, [onDropCrop])

    // Handle mouse down on item (for moving/resizing)
    const handleItemMouseDown = useCallback((e, item, type = 'move') => {
        e.stopPropagation()
        e.preventDefault()
        onSelectItem(item.id)
        setDragState({
            type,
            itemId: item.id,
            startX: e.clientX,
            startY: e.clientY,
            startItem: { ...item }
        })
    }, [onSelectItem])

    // Handle mouse move (for dragging)
    const handleMouseMove = useCallback((e) => {
        if (!dragState || !canvasRef.current) return

        const rect = canvasRef.current.getBoundingClientRect()
        const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100
        const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100

        if (dragState.type === 'move') {
            onUpdateItem(dragState.itemId, {
                x: Math.max(0, Math.min(100 - dragState.startItem.width, dragState.startItem.x + deltaX)),
                y: Math.max(0, Math.min(100 - dragState.startItem.height, dragState.startItem.y + deltaY))
            })
        } else if (dragState.type === 'resize') {
            const newWidth = Math.max(5, dragState.startItem.width + deltaX)
            const newHeight = Math.max(5, dragState.startItem.height + deltaY)
            onUpdateItem(dragState.itemId, {
                width: Math.min(100 - dragState.startItem.x, newWidth),
                height: Math.min(100 - dragState.startItem.y, newHeight)
            })
        }
    }, [dragState, onUpdateItem])

    // Handle mouse up
    const handleMouseUp = useCallback(() => {
        setDragState(null)
    }, [])

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
                            border: isSelected ? '2px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.2)',
                            boxSizing: 'border-box',
                            cursor: 'grab',
                            zIndex: isSelected ? 10 : 1,
                            boxShadow: isSelected ? '0 0 0 2px var(--accent-primary), 0 4px 12px rgba(0,0,0,0.3)' : 'none'
                        }}
                        onMouseDown={(e) => handleItemMouseDown(e, item, 'move')}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={crop.imageData}
                            alt=""
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: item.objectFit || 'contain',
                                filter: getFilterStyle(crop.filter),
                                transform: `rotate(${crop.rotation || 0}deg)`,
                                pointerEvents: 'none'
                            }}
                            draggable={false}
                        />

                        {/* Resize handle */}
                        {isSelected && (
                            <>
                                <div
                                    className="resize-handle"
                                    style={{
                                        position: 'absolute',
                                        right: -6,
                                        bottom: -6,
                                        width: 12,
                                        height: 12,
                                        backgroundColor: 'var(--accent-primary)',
                                        borderRadius: '50%',
                                        cursor: 'nwse-resize',
                                        border: '2px solid white'
                                    }}
                                    onMouseDown={(e) => handleItemMouseDown(e, item, 'resize')}
                                />
                                {/* Delete button */}
                                <button
                                    className="delete-item-btn"
                                    style={{
                                        position: 'absolute',
                                        top: -10,
                                        right: -10,
                                        width: 20,
                                        height: 20,
                                        backgroundColor: '#ef4444',
                                        borderRadius: '50%',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 12,
                                        color: 'white',
                                        fontWeight: 'bold'
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDeleteItem(item.id)
                                    }}
                                >
                                    ×
                                </button>
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
