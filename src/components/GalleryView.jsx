import { useState, useMemo } from 'react'
import CropCard from './CropCard'

// Helper to determine which date group a timestamp belongs to
function getDateGroup(timestamp) {
    const now = new Date()
    const date = new Date(timestamp)

    // Reset time parts for day comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 30)

    const cropDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (cropDate >= today) return 'Today'
    if (cropDate >= yesterday) return 'Yesterday'
    if (cropDate >= weekAgo) return 'This Week'
    if (cropDate >= monthAgo) return 'This Month'
    return 'Older'
}

const DATE_GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older']

function GalleryView({ crops, onUpdateCrop, onDeleteCrop }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState(new Set())

    // Collect all unique tags from all crops
    const allTags = useMemo(() => {
        const tagSet = new Set()
        crops.forEach(crop => {
            (crop.tags || []).forEach(tag => tagSet.add(tag))
        })
        return Array.from(tagSet).sort()
    }, [crops])

    // Filter crops based on search query and selected tags
    const filteredCrops = useMemo(() => {
        return crops.filter(crop => {
            // Search filter: match notes or tags
            const query = searchQuery.toLowerCase().trim()
            if (query) {
                const matchesNotes = (crop.notes || '').toLowerCase().includes(query)
                const matchesTags = (crop.tags || []).some(tag =>
                    tag.toLowerCase().includes(query)
                )
                if (!matchesNotes && !matchesTags) return false
            }

            // Tag filter: crop must have at least one selected tag (OR logic)
            if (selectedTags.size > 0) {
                const hasSelectedTag = (crop.tags || []).some(tag =>
                    selectedTags.has(tag)
                )
                if (!hasSelectedTag) return false
            }

            return true
        })
    }, [crops, searchQuery, selectedTags])

    // Group filtered crops by date
    const groupedCrops = useMemo(() => {
        const groups = {}

        // Sort by newest first, then group
        const sortedCrops = [...filteredCrops].sort((a, b) => b.id - a.id)

        for (const crop of sortedCrops) {
            const group = getDateGroup(crop.id)
            if (!groups[group]) {
                groups[group] = []
            }
            groups[group].push(crop)
        }

        // Return as ordered array of [groupName, crops[]]
        return DATE_GROUP_ORDER
            .filter(group => groups[group]?.length > 0)
            .map(group => [group, groups[group]])
    }, [filteredCrops])

    const toggleTag = (tag) => {
        setSelectedTags(prev => {
            const next = new Set(prev)
            if (next.has(tag)) {
                next.delete(tag)
            } else {
                next.add(tag)
            }
            return next
        })
    }

    const clearFilters = () => {
        setSearchQuery('')
        setSelectedTags(new Set())
    }

    const hasActiveFilters = searchQuery || selectedTags.size > 0

    if (crops.length === 0) {
        return (
            <div className="glass-card flex-1 flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <svg className="w-12 h-12 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold gradient-text mb-2">No Crops Yet</h2>
                    <p className="text-[var(--text-secondary)]">Create crops from the Canvas view to see them here</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Switch to Canvas, upload an image, and select an area
                </div>
            </div>
        )
    }

    return (
        <div className="glass-card flex-1 overflow-auto p-6 flex flex-col gap-4">
            {/* Search and Filter Bar */}
            <div className="flex flex-col gap-3">
                {/* Search Input */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-md">
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search crops by notes or tags..."
                            className="w-full pr-4 py-2 text-sm"
                            style={{ paddingLeft: '2.5rem' }}
                        />
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-white bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 rounded-lg transition-colors"
                        >
                            Clear
                        </button>
                    )}
                    <span className="text-sm text-[var(--text-muted)]">
                        {filteredCrops.length} of {crops.length} crops
                    </span>
                </div>

                {/* Tag Filter Chips */}
                {allTags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Tags:</span>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`px-3 py-1 text-xs rounded-full transition-all ${selectedTags.has(tag)
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-tertiary)]/80'
                                    }`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Crops Grid with Date Groups */}
            {filteredCrops.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <svg className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-[var(--text-secondary)]">No crops match your filters</p>
                        <button
                            onClick={clearFilters}
                            className="mt-2 text-sm text-purple-400 hover:text-purple-300"
                        >
                            Clear filters
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {groupedCrops.map(([groupName, groupCrops]) => (
                        <div key={groupName}>
                            {/* Date Group Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                    {groupName}
                                </h3>
                                <div className="flex-1 h-px bg-[var(--border-color)]"></div>
                                <span className="text-xs text-[var(--text-muted)]">
                                    {groupCrops.length} {groupCrops.length === 1 ? 'crop' : 'crops'}
                                </span>
                            </div>
                            {/* Crops in this group */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {groupCrops.map(crop => (
                                    <CropCard
                                        key={crop.id}
                                        crop={crop}
                                        onUpdate={(updates) => onUpdateCrop(crop.id, updates)}
                                        onDelete={() => onDeleteCrop(crop.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GalleryView
