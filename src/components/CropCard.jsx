import { memo, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import RotatableImage from './RotatableImage'
import { FILTERS } from '../utils/filters'
import { getImageUrl } from '../utils/api'
import { useCropsStore } from '../stores'

// Constants for rotation
const ROTATION_EDGE_THRESHOLD = 40 // pixels from edge that triggers rotation mode
const SELECTION_BOX_INSET = 12 // pixels of padding around selection box

function CropCard({ crop, onUpdate, onDelete, hideInfo = false }) {
    const setActiveImage = useCropsStore((s) => s.setActiveImage)
    const [tagInput, setTagInput] = useState('')
    const [isRotating, setIsRotating] = useState(false)
    const [imageRotation, setImageRotation] = useState(crop.rotation || 0)
    const [deleteConfirm, setDeleteConfirm] = useState(false)
    const [showOriginal, setShowOriginal] = useState(false)
    const [originalImage, setOriginalImage] = useState(null)
    const containerRef = useRef(null)
    const initialRotationRef = useRef({ angle: 0, startAngle: 0 })
    const isDraggingRef = useRef(false) // Track if dragging happened to prevent click

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
            isDraggingRef.current = true // Mark that dragging started
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

    // View original image - use direct URL for efficiency (no base64 fetching)
    const handleViewOriginal = () => {
        if (!crop.imageId) return
        // Use URL directly - browser handles loading and caching
        setOriginalImage(getImageUrl(crop.imageId))
        setShowOriginal(true)
    }

    const handleCloseOriginal = () => {
        setShowOriginal(false)
    }

    const handleLoadToCanvas = () => {
        if (crop.imageId && originalImage) {
            setActiveImage(crop.imageId, originalImage)
            setShowOriginal(false)
        }
    }

    return (
        <div className="group bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-transparent transition-all duration-300">
            {/* Image container with rotation */}
            <div
                ref={containerRef}
                className={`relative w-full overflow-hidden bg-[var(--bg-tertiary)] ${isRotating ? 'cursor-grabbing' : 'cursor-pointer'}`}
                style={{
                    // Use aspect-ratio to maintain height based on crop dimensions
                    aspectRatio: `${crop.width} / ${crop.height}`
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onClick={(e) => {
                    // Only view original if not rotating and no rotation happened
                    if (!isDraggingRef.current && crop.imageId) {
                        handleViewOriginal()
                    }
                    // Reset the flag after click
                    isDraggingRef.current = false
                }}
            >
                {/* Rotatable image with lazy loading */}
                <RotatableImage
                    crop={crop}
                    currentRotation={imageRotation}
                    isRotating={isRotating}
                    filterCss={getFilterStyle(crop.filter)}
                    containerInset={SELECTION_BOX_INSET}
                    hideRotationOverlay={!isRotating}
                    showCornerHandles={isRotating}
                />

                {/* Rotation angle badge - hidden by default, shown on hover */}
                {imageRotation !== 0 && (
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {Math.round(imageRotation)}°
                    </div>
                )}

                {/* Source rotation indicator - shows if crop was taken at an angle, hidden by default */}
                {crop.sourceRotation != null && crop.sourceRotation !== 0 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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

                {/* Reset rotation button (when rotated) - hidden by default, shown on hover */}
                {imageRotation !== 0 && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleResetRotation() }}
                        className="absolute bottom-3 right-3 w-9 h-9 bg-purple-500/80 hover:bg-purple-500 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-200 z-10 opacity-0 group-hover:opacity-100"
                        title="Reset rotation"
                    >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                )}

                {/* Rotation hint - hidden by default, shown on hover */}
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white/70 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Drag edge to rotate
                </div>
            </div>

            {/* Controls - hidden when hideInfo is true */}
            {!hideInfo && (
                <div className="p-5 space-y-5">
                    {/* Stars Rating */}
                    <div className="flex items-center gap-1">
                        {[1, 2, 3].map((star) => (
                            <button
                                key={star}
                                onClick={() => {
                                    const newStars = (crop.stars || 0) === star ? 0 : star
                                    onUpdate({ stars: newStars })
                                }}
                                className="w-8 h-8 flex items-center justify-center hover:scale-110 transition-transform rounded-lg hover:bg-[var(--bg-tertiary)]"
                                title={`${star} star${star > 1 ? 's' : ''}`}
                            >
                                <svg
                                    className={`w-6 h-6 ${star <= (crop.stars || 0)
                                        ? 'text-yellow-400 fill-yellow-400'
                                        : 'text-[var(--text-muted)] fill-transparent'
                                        }`}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                </svg>
                            </button>
                        ))}
                        {(crop.stars || 0) > 0 && (
                            <button
                                onClick={() => onUpdate({ stars: 0 })}
                                className="ml-2 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>

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
            )}

            {/* Original Image Modal - rendered via portal to escape backdrop-filter containing block */}
            {showOriginal && originalImage && createPortal(
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                    onClick={handleCloseOriginal}
                >
                    <div
                        className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl group"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={handleCloseOriginal}
                            className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/60 hover:bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Load to Canvas button */}
                        <button
                            onClick={handleLoadToCanvas}
                            className="absolute top-4 left-4 z-10 w-10 h-10 bg-black/60 hover:bg-purple-500 backdrop-blur-sm rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                            title="Load to Canvas"
                        >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>

                        {/* Original image with crop highlight overlay */}
                        <div className="relative">
                            <img
                                src={originalImage}
                                alt="Original image"
                                className="max-w-[90vw] max-h-[90vh] object-contain"
                            />
                            {/* Semi-transparent overlay with cutout for crop area */}
                            <svg
                                className="absolute inset-0 w-full h-full pointer-events-none"
                                viewBox={`0 0 ${crop.originalImageWidth || 1000} ${crop.originalImageHeight || 1000}`}
                                preserveAspectRatio="xMidYMid meet"
                            >
                                {/* Dark overlay with a transparent hole for the crop */}
                                <defs>
                                    <mask id={`crop-mask-${crop.id}`}>
                                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                        <rect
                                            x={crop.x}
                                            y={crop.y}
                                            width={crop.width}
                                            height={crop.height}
                                            fill="black"
                                        />
                                    </mask>
                                </defs>
                                <rect
                                    x="0"
                                    y="0"
                                    width="100%"
                                    height="100%"
                                    fill="rgba(0,0,0,0.6)"
                                    mask={`url(#crop-mask-${crop.id})`}
                                />
                                {/* Crop border highlight */}
                                <rect
                                    x={crop.x}
                                    y={crop.y}
                                    width={crop.width}
                                    height={crop.height}
                                    fill="none"
                                    stroke="#a855f7"
                                    strokeWidth="3"
                                    strokeDasharray="8 4"
                                />
                            </svg>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

export default memo(CropCard)
