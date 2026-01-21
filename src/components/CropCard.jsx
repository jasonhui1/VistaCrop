import { memo, useCallback, useRef, useState } from 'react'
import RotatableImage from './RotatableImage'
import { FILTERS } from '../utils/filters'

// Constants for rotation
const ROTATION_EDGE_THRESHOLD = 40 // pixels from edge that triggers rotation mode
const SELECTION_BOX_INSET = 12 // pixels of padding around selection box

function CropCard({ crop, onUpdate, onDelete }) {
    const [tagInput, setTagInput] = useState('')
    const [isRotating, setIsRotating] = useState(false)
    const [imageRotation, setImageRotation] = useState(crop.rotation || 0)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const containerRef = useRef(null)
    const initialRotationRef = useRef({ angle: 0, startAngle: 0 })

    const handleDeleteClick = (e) => {
        e.stopPropagation()
        if (deleteConfirm) {
            onDelete()
        } else {
            setDeleteConfirm(true)
            setTimeout(() => setDeleteConfirm(false), 3000)
        }
    }

    // Get CSS filter string from filter name
    const getFilterStyle = useCallback((filterName) => {
        const filter = FILTERS.find(f => f.id === filterName)
        return filter ? filter.css : 'none'
    }, [])

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            const newTags = [...crop.tags, tagInput.trim()]
            onUpdate({ tags: newTags })
            setTagInput('')
        }
    }

    const handleRemoveTag = (index) => {
        const newTags = crop.tags.filter((_, i) => i !== index)
        onUpdate({ tags: newTags })
    }

    const handleNotesChange = (e) => {
        onUpdate({ notes: e.target.value })
    }

    const getMousePosition = useCallback((e) => {
        if (!containerRef.current) return { x: 0, y: 0 }
        const rect = containerRef.current.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }, [])

    const handleMouseDown = (e) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const pos = getMousePosition(e)

        // Calculate center of the image container
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Define inner area (the actual image content area, with some padding)
        const isOutsideInner =
            pos.x < ROTATION_EDGE_THRESHOLD || pos.x > rect.width - ROTATION_EDGE_THRESHOLD ||
            pos.y < ROTATION_EDGE_THRESHOLD || pos.y > rect.height - ROTATION_EDGE_THRESHOLD

        if (isOutsideInner) {

            // Start rotation mode
            const angleToMouse = Math.atan2(
                pos.y - centerY,
                pos.x - centerX
            ) * (180 / Math.PI)

            initialRotationRef.current = {
                angle: imageRotation,
                startAngle: angleToMouse
            }
            setIsRotating(true)
            e.preventDefault()
        }
    }

    const handleMouseMove = (e) => {
        if (!isRotating || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const pos = getMousePosition(e)
        const centerX = rect.width / 2
        const centerY = rect.height / 2

        // Calculate current angle from center to mouse
        const currentAngle = Math.atan2(
            pos.y - centerY,
            pos.x - centerX
        ) * (180 / Math.PI)

        // Calculate rotation delta
        const angleDelta = currentAngle - initialRotationRef.current.startAngle
        let newRotation = initialRotationRef.current.angle + angleDelta

        // Normalize to -180 to 180
        while (newRotation > 180) newRotation -= 360
        while (newRotation < -180) newRotation += 360

        setImageRotation(newRotation)
    }

    const handleMouseUp = () => {
        if (isRotating) {
            // Save the rotation to crop data
            onUpdate({ rotation: imageRotation })
        }
        setIsRotating(false)
    }

    const handleResetRotation = () => {
        setImageRotation(0)
        onUpdate({ rotation: 0 })
    }

    return (
        <div className="group bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border-color)] transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
            {/* Image container with rotation */}
            <div
                ref={containerRef}
                className={`relative w-full overflow-hidden bg-[var(--bg-tertiary)] ${isRotating ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{
                    // Use aspect-ratio to maintain height based on crop dimensions
                    aspectRatio: `${crop.width} / ${crop.height}`
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Rotatable image with lazy loading */}
                <RotatableImage
                    crop={crop}
                    currentRotation={imageRotation}
                    isRotating={isRotating}
                    filterCss={getFilterStyle(crop.filter)}
                    containerInset={SELECTION_BOX_INSET}
                />

                {/* Rotation angle badge */}
                {imageRotation !== 0 && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full pointer-events-none z-10">
                        {Math.round(imageRotation)}°
                    </div>
                )}

                {/* Source rotation indicator - shows if crop was taken at an angle */}
                {crop.sourceRotation && crop.sourceRotation !== 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 z-10">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {Math.round(crop.sourceRotation)}°
                    </div>
                )}

                {/* Delete button */}
                <button
                    onClick={handleDeleteClick}
                    className={`absolute top-3 right-3 w-9 h-9 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-200 z-10 ${deleteConfirm
                        ? 'bg-red-500 opacity-100'
                        : 'bg-black/50 hover:bg-red-500 opacity-0 group-hover:opacity-100'
                        }`}
                    aria-label={deleteConfirm ? 'Click again to confirm' : 'Delete crop'}
                    title={deleteConfirm ? 'Click again to confirm' : 'Delete crop'}
                >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>

                {/* Reset rotation button (when rotated) */}
                {imageRotation !== 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleResetRotation() }}
                        className="absolute bottom-3 right-3 w-9 h-9 bg-purple-500/80 hover:bg-purple-500 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-200 z-10"
                        title="Reset rotation"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                )}

                {/* Rotation hint */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white/70 pointer-events-none">
                    Drag edge to rotate
                </div>
            </div>

            {/* Controls */}
            <div className="p-5 space-y-5">
                {/* Tags */}
                <div className="space-y-3">
                    <label className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Tags
                    </label>

                    {/* Tag chips */}
                    {crop.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {crop.tags.map((tag, index) => (
                                <span key={index} className="tag-chip">
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(index)}
                                        className="hover:text-white transition-colors p-0"
                                        aria-label={`Remove tag ${tag}`}
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Tag input */}
                    <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Add tag and press Enter"
                    />
                </div>

                {/* Notes */}
                <div className="space-y-3">
                    <label className="text-sm text-[var(--text-secondary)] flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Notes
                    </label>
                    <textarea
                        value={crop.notes}
                        onChange={handleNotesChange}
                        placeholder="Add observations about this detail..."
                        rows={3}
                        className="resize-none"
                    />
                </div>
            </div>
        </div>
    )
}

export default memo(CropCard)
