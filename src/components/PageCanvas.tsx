import { memo, useCallback, useMemo, useRef, useState, DragEvent, CSSProperties } from 'react'
import { Composition, Panel, Crop } from '../types'
import { getCropById, getFilterStyle } from '../utils/canvasUtils'

export interface PageCanvasProps {
    composition: Composition
    panels: Panel[]
    crops: Crop[]
    selectedPanelIndex: number | null
    onSelectPanel: (index: number) => void
    onDropCrop: (panelIndex: number, cropId: string | number) => void
    previewMode?: boolean
}

function PageCanvas({
    composition,
    panels,
    crops,
    selectedPanelIndex,
    onSelectPanel,
    onDropCrop,
    previewMode = false
}: PageCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [dragOverPanel, setDragOverPanel] = useState<number | null>(null)

    const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, panelIndex: number) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setDragOverPanel(panelIndex)
    }, [])

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverPanel(null)
        }
    }, [])

    const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, panelIndex: number) => {
        e.preventDefault()
        setDragOverPanel(null)

        const rawCropId = e.dataTransfer.getData('application/crop-id') || e.dataTransfer.getData('text/plain')
        if (rawCropId) {
            const parsedNumber = parseInt(rawCropId, 10)
            const cropId = isNaN(parsedNumber) ? rawCropId : parsedNumber
            onDropCrop(panelIndex, cropId)
        }
    }, [onDropCrop])

    const containerStyle = useMemo<CSSProperties>(() => {
        const aspectRatio = composition.pageWidth / composition.pageHeight
        return {
            aspectRatio,
            maxWidth: '100%',
            maxHeight: '100%',
            backgroundColor: composition.backgroundColor,
            position: 'relative',
            borderRadius: previewMode ? '0' : '8px',
            overflow: 'hidden',
            boxShadow: previewMode ? 'none' : '0 8px 32px rgba(0,0,0,0.4)'
        }
    }, [composition.pageWidth, composition.pageHeight, composition.backgroundColor, previewMode])

    return (
        <div
            ref={canvasRef}
            className="page-canvas"
            style={containerStyle}
        >
            {panels.map((panel, index) => {
                const assignment = composition.assignments[index]
                const crop = assignment?.cropId ? getCropById(crops, assignment.cropId) : null
                const isSelected = selectedPanelIndex === index
                const isDragOver = dragOverPanel === index

                const panelStyle: CSSProperties = {
                    position: 'absolute',
                    left: `${(panel.x / composition.pageWidth) * 100}%`,
                    top: `${(panel.y / composition.pageHeight) * 100}%`,
                    width: `${(panel.width / composition.pageWidth) * 100}%`,
                    height: `${(panel.height / composition.pageHeight) * 100}%`,
                    border: isSelected
                        ? '2px solid var(--accent-primary)'
                        : isDragOver
                            ? '2px dashed var(--accent-secondary)'
                            : '1px solid rgba(0,0,0,0.1)',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s ease',
                    backgroundColor: crop ? 'transparent' : 'rgba(0,0,0,0.03)'
                }

                return (
                    <div
                        key={index}
                        className={`composer-panel ${crop ? 'panel-slot-filled' : 'panel-slot-empty'}`}
                        style={panelStyle}
                        onClick={() => onSelectPanel(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                    >
                        {crop ? (
                            <div
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    position: 'relative',
                                    transform: `scale(${assignment.zoom}) translate(${assignment.offsetX}px, ${assignment.offsetY}px)`,
                                    transformOrigin: 'center center'
                                }}
                            >
                                <img
                                    src={crop.imageData}
                                    alt=""
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        filter: getFilterStyle(crop.filter),
                                        transform: `rotate(${crop.rotation || 0}deg)`,
                                        pointerEvents: 'none'
                                    }}
                                    draggable={false}
                                />
                            </div>
                        ) : (
                            <div className="empty-panel-indicator">
                                <svg
                                    className="w-8 h-8 text-[var(--text-muted)]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    style={{ opacity: 0.3, width: 32, height: 32, color: 'var(--text-muted)' }}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M12 4v16m8-8H4"
                                    />
                                </svg>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default memo(PageCanvas)
