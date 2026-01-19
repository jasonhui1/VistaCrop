import { memo, useCallback, useMemo, useRef, useState } from 'react'
import { FILTERS } from '../utils/filters'
import { useComposerStore, useCropsStore } from '../stores'
import { getLayout, calculatePanelPositions } from '../utils/panelLayouts'

/**
 * PageCanvas - Renders the composition with assigned crops in panels
 * Self-contained component that subscribes directly to stores
 */
function PageCanvas({ previewMode = false }) {
    // === STORE SUBSCRIPTIONS ===
    const crops = useCropsStore((s) => s.crops)
    const getComposition = useComposerStore((s) => s.getComposition)
    const selectedPanelIndex = useComposerStore((s) => s.selectedPanelIndex)
    const setSelectedPanelIndex = useComposerStore((s) => s.setSelectedPanelIndex)
    const dropCropToPanel = useComposerStore((s) => s.dropCropToPanel)

    // Derived state
    const composition = getComposition()
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

    const canvasRef = useRef(null)
    const [dragOverPanel, setDragOverPanel] = useState(null)

    // Find crop by ID
    const getCropById = useCallback((cropId) => {
        return crops.find(c => c.id === cropId)
    }, [crops])

    // Handle drag over panel
    const handleDragOver = useCallback((e, panelIndex) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setDragOverPanel(panelIndex)
    }, [])

    // Handle drag leave
    const handleDragLeave = useCallback((e) => {
        // Only clear if leaving the panel entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverPanel(null)
        }
    }, [])

    // Handle drop
    const handleDrop = useCallback((e, panelIndex) => {
        e.preventDefault()
        setDragOverPanel(null)

        const cropId = e.dataTransfer.getData('application/crop-id')
        if (cropId) {
            dropCropToPanel(panelIndex, parseInt(cropId, 10))
        }
    }, [dropCropToPanel])

    // Get CSS filter string from filter name
    const getFilterStyle = useCallback((filterName) => {
        const filter = FILTERS.find(f => f.id === filterName)
        return filter ? filter.css : 'none'
    }, [])

    // Calculate scale to fit page in container
    const containerStyle = useMemo(() => {
        const aspectRatio = composition.pageWidth / composition.pageHeight
        return {
            aspectRatio: aspectRatio,
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
                const crop = assignment?.cropId ? getCropById(assignment.cropId) : null
                const isSelected = selectedPanelIndex === index
                const isDragOver = dragOverPanel === index

                // Calculate panel position as percentage
                const panelStyle = {
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
                        onClick={() => setSelectedPanelIndex(index)}
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
