import { memo, useCallback, useRef, useState, KeyboardEvent, ChangeEvent, MouseEvent } from 'react'
import RotatableImage, { CropData } from './RotatableImage'
import { FILTERS } from '../utils/filters'

// Constants for rotation
const ROTATION_EDGE_THRESHOLD = 40 // pixels from edge that triggers rotation mode
const SELECTION_BOX_INSET = 12 // pixels of padding around selection box

export interface CropCardProps {
    crop: CropData
    onUpdate: (updates: Partial<CropData>) => void
    onDelete: () => void
}

/** Domain helper methods to avoid direct crop mutation smells */
export const cropDomainHelpers = {
    addTag: (tags: string[] = [], tag: string): string[] => [...tags, tag],
    removeTag: (tags: string[] = [], index: number): string[] => tags.filter((_, i) => i !== index),
    hasSourceRotation: (sourceRotation?: number): boolean => sourceRotation !== undefined && sourceRotation !== 0,
    hasTags: (tags?: string[]): boolean => Boolean(tags && tags.length > 0)
}

function CropCard({ crop, onUpdate, onDelete }: CropCardProps) {
    const [tagInput, setTagInput] = useState('')
    const [isRotating, setIsRotating] = useState(false)
    const [imageRotation, setImageRotation] = useState(crop.rotation || 0)
    const containerRef = useRef<HTMLDivElement>(null)
    const initialRotationRef = useRef({ angle: 0, startAngle: 0 })

    // Get CSS filter string from filter name
    const getFilterStyle = useCallback((filterName?: string) => {
        const filter = FILTERS.find(f => f.id === filterName)
        return filter ? filter.css : 'none'
    }, [])

    const handleTagKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            const newTags = cropDomainHelpers.addTag(crop.tags, tagInput.trim())
            onUpdate({ tags: newTags })
            setTagInput('')
        }
    }

    const handleRemoveTag = (index: number) => {
        const newTags = cropDomainHelpers.removeTag(crop.tags, index)
        onUpdate({ tags: newTags })
    }

    const handleNotesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        onUpdate({ notes: e.target.value })
    }

    const getMousePosition = useCallback((e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return { x: 0, y: 0 }
        const rect = containerRef.current.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }, [])

    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const pos = getMousePosition(e)

        const centerX = rect.width / 2
        const centerY = rect.height / 2

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
                angle: angleToMouse,
                startAngle: imageRotation
            }
            setIsRotating(true)
        }
    }

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!isRotating || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const pos = getMousePosition(e)

        const centerX = rect.width / 2
        const centerY = rect.height / 2

        const currentAngleToMouse = Math.atan2(
            pos.y - centerY,
            pos.x - centerX
        ) * (180 / Math.PI)

        const deltaAngle = currentAngleToMouse - initialRotationRef.current.angle
        let newRotation = (initialRotationRef.current.startAngle + deltaAngle) % 360
        if (newRotation < 0) newRotation += 360

        // Snap to 0, 90, 180, 270 if close (within 3 degrees)
        const snapThreshold = 3
        const snapAngles = [0, 90, 180, 270, 360]
        for (const snap of snapAngles) {
            if (Math.abs(newRotation - snap) < snapThreshold) {
                newRotation = snap === 360 ? 0 : snap
                break
            }
        }

        setImageRotation(newRotation)
    }

    const handleMouseUp = () => {
        if (isRotating) {
            setIsRotating(false)
            onUpdate({ rotation: imageRotation })
        }
    }

    const handleFilterChange = (e: ChangeEvent<HTMLSelectElement>) => {
        onUpdate({ filter: e.target.value })
    }

    const handleResetRotation = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        setImageRotation(0)
        onUpdate({ rotation: 0 })
    }

    return (
        <div className="glass-card flex flex-col overflow-hidden">
            {/* Image Preview Area with Interactive Rotation */}
            <div
                ref={containerRef}
                className="relative aspect-square cursor-grab active:cursor-grabbing group bg-black/40 overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <RotatableImage
                    crop={crop}
                    currentRotation={imageRotation}
                    isRotating={isRotating}
                    filterCss={getFilterStyle(crop.filter)}
                    containerInset={SELECTION_BOX_INSET}
                    showCornerHandles={true}
                />

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                    <span className="bg-black/80 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-purple-500/30 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Drag outer edge to rotate
                    </span>
                </div>

                {/* Source rotation indicator - shows if crop was taken at an angle */}
                {cropDomainHelpers.hasSourceRotation(crop.sourceRotation) && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white flex items-center gap-1 z-10">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Original: {Math.round(crop.sourceRotation || 0)}°</span>
                    </div>
                )}

                {/* Reset rotation button if rotated */}
                {imageRotation !== 0 && (
                    <button
                        onClick={handleResetRotation}
                        className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs flex items-center gap-1 transition-colors z-10"
                        title="Reset rotation"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset
                    </button>
                )}

                {/* Delete button */}
                <button
                    onClick={onDelete}
                    className="absolute top-3 left-3 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg z-10"
                    title="Delete crop"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            {/* Controls & Metadata Area */}
            <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                {/* Filter Selector */}
                <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                        Filter Preset
                    </label>
                    <select
                        value={crop.filter || 'none'}
                        onChange={handleFilterChange}
                        className="w-full text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:border-purple-500 outline-none transition-colors"
                    >
                        {FILTERS.map(f => (
                            <option key={f.id} value={f.id}>
                                {f.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Tagging System */}
                <div className="space-y-2">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Tags
                    </label>

                    {/* Tag chips */}
                    {cropDomainHelpers.hasTags(crop.tags) && (
                        <div className="flex flex-wrap gap-2">
                            {crop.tags?.map((tag, index) => (
                                <span key={index} className="tag-chip">
                                    {tag}
                                    <button
                                        onClick={() => handleRemoveTag(index)}
                                        className="hover:text-pink-400 transition-colors"
                                    >
                                        ×
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
                        placeholder="Add tag and press Enter..."
                        className="w-full text-sm"
                    />
                </div>

                {/* Notes System */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                        Notes
                    </label>
                    <textarea
                        value={crop.notes || ''}
                        onChange={handleNotesChange}
                        placeholder="Add observations about this detail..."
                        rows={3}
                        className="w-full text-sm resize-none"
                    />
                </div>
            </div>
        </div>
    )
}

export default memo(CropCard)
