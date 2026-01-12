import { useState } from 'react'

function CropCard({ crop, onUpdate, onDelete }) {
    const [tagInput, setTagInput] = useState('')

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

    return (
        <div className="bg-[var(--bg-card)] rounded-2xl overflow-hidden border border-[var(--border-color)] transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
            {/* Image container */}
            <div className="relative w-full aspect-square overflow-hidden bg-[var(--bg-tertiary)]">
                <img
                    src={crop.imageData}
                    alt="Crop"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                />

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
                    onClick={onDelete}
                    className="absolute top-3 left-3 w-9 h-9 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-200 z-10"
                >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
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

export default CropCard
