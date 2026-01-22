import { useState, useMemo, useCallback } from 'react'
import CropCard from './CropCard'
import { useCropsStore } from '../stores'

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

// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

const DATE_GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older']

const COLUMN_OPTIONS = [1, 2, 3, 4, 5, 6]

function GalleryView() {
    // Get state and actions from store
    const crops = useCropsStore((s) => s.crops)
    const onUpdateCrop = useCropsStore((s) => s.updateCrop)
    const onDeleteCrop = useCropsStore((s) => s.deleteCrop)

    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState(new Set())
    const [hideInfo, setHideInfo] = useState(false)
    const [columnCount, setColumnCount] = useState(3)
    const [shuffleMode, setShuffleMode] = useState(false)
    const [shuffleSeed, setShuffleSeed] = useState(0) // Used to trigger re-shuffle
    const [masonryLayout, setMasonryLayout] = useState(false)
    const [starFilter, setStarFilter] = useState(0) // 0 = all, 1-3 = minimum stars

    // Collect all unique tags from all crops
    const allTags = useMemo(() => {
        const tagSet = new Set()
        crops.forEach(crop => {
            (crop.tags || []).forEach(tag => tagSet.add(tag))
        })
        return Array.from(tagSet).sort()
    }, [crops])

    // Filter crops based on search query, selected tags, and star rating
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

            // Star filter: crop must have at least the minimum stars
            if (starFilter > 0) {
                if ((crop.stars || 0) < starFilter) return false
            }

            return true
        })
    }, [crops, searchQuery, selectedTags, starFilter])

    // Memoize the shuffled order based on crop IDs only (not other crop properties)
    // This prevents reshuffling when editing rotation, stars, etc.
    const shuffledCropIds = useMemo(() => {
        const ids = filteredCrops.map(c => c.id)
        return shuffleArray(ids)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredCrops.map(c => c.id).join(','), shuffleSeed])

    // Group filtered crops by date (or shuffle if shuffleMode is enabled)
    const groupedCrops = useMemo(() => {
        // In shuffle mode, return a single flat group with shuffled crops
        if (shuffleMode) {
            // Map shuffled IDs back to current crop objects
            const cropMap = new Map(filteredCrops.map(c => [c.id, c]))
            const shuffledCrops = shuffledCropIds
                .filter(id => cropMap.has(id))
                .map(id => cropMap.get(id))
            return [['Shuffled', shuffledCrops]]
        }

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
    }, [filteredCrops, shuffleMode, shuffledCropIds])

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
        setStarFilter(0)
    }

    const hasActiveFilters = searchQuery || selectedTags.size > 0 || starFilter > 0

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

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Display Options */}
                    <div className="flex items-center gap-3">
                        {/* Shuffle Toggle */}
                        <div className="flex items-center">
                            <button
                                onClick={() => {
                                    if (!shuffleMode) {
                                        setShuffleMode(true)
                                        setShuffleSeed(s => s + 1) // Initial shuffle
                                    } else {
                                        setShuffleMode(false)
                                    }
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${shuffleMode
                                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30 rounded-r-none'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                                    }`}
                                title={shuffleMode ? 'Disable shuffle' : 'Show in random order'}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Shuffle
                            </button>
                            {/* Re-shuffle button (only visible when shuffle is active) */}
                            {shuffleMode && (
                                <button
                                    onClick={() => setShuffleSeed(s => s + 1)}
                                    className="px-2 py-1.5 text-sm rounded-lg rounded-l-none bg-pink-500/20 text-pink-400 border border-pink-500/30 border-l-0 hover:bg-pink-500/30 transition-all"
                                    title="Re-shuffle order"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Masonry Layout Toggle */}
                        <button
                            onClick={() => setMasonryLayout(!masonryLayout)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${masonryLayout
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                                }`}
                            title={masonryLayout ? 'Standard grid' : 'Masonry layout'}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {masonryLayout ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 14a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1v-5zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                                )}
                            </svg>
                            Masonry
                        </button>

                        {/* Hide Info Toggle */}
                        <button
                            onClick={() => setHideInfo(!hideInfo)}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all ${hideInfo
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                                }`}
                            title={hideInfo ? 'Show info' : 'Hide info'}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {hideInfo ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                )}
                            </svg>
                            {hideInfo ? 'Show Info' : 'Hide Info'}
                        </button>

                        {/* Column Count Selector */}
                        <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
                            <svg className="w-4 h-4 text-[var(--text-muted)] ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            {COLUMN_OPTIONS.map(num => (
                                <button
                                    key={num}
                                    onClick={() => setColumnCount(num)}
                                    className={`w-7 h-7 text-xs font-medium rounded transition-all ${columnCount === num
                                        ? 'bg-purple-500 text-white'
                                        : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--bg-secondary)]'
                                        }`}
                                    title={`${num} column${num > 1 ? 's' : ''}`}
                                >
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
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

                {/* Star Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Favourites:</span>
                    <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-1">
                        <button
                            onClick={() => setStarFilter(0)}
                            className={`px-2 py-1 text-xs rounded transition-all ${starFilter === 0
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'text-[var(--text-secondary)] hover:text-white'
                                }`}
                            title="Show all"
                        >
                            All
                        </button>
                        {[1, 2, 3].map(stars => (
                            <button
                                key={stars}
                                onClick={() => setStarFilter(starFilter === stars ? 0 : stars)}
                                className={`flex items-center gap-0.5 px-2 py-1 text-xs rounded transition-all ${starFilter === stars
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'text-[var(--text-secondary)] hover:text-white'
                                    }`}
                                title={`${stars}+ star${stars > 1 ? 's' : ''}`}
                            >
                                {[...Array(stars)].map((_, i) => (
                                    <svg
                                        key={i}
                                        className="w-3.5 h-3.5 fill-current"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                ))}
                            </button>
                        ))}
                    </div>
                </div>
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
                            {/* Date Group Header - hidden in shuffle mode */}
                            {!shuffleMode && (
                                <div className="flex items-center gap-3 mb-4">
                                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                        {groupName}
                                    </h3>
                                    <div className="flex-1 h-px bg-[var(--border-color)]"></div>
                                    <span className="text-xs text-[var(--text-muted)]">
                                        {groupCrops.length} {groupCrops.length === 1 ? 'crop' : 'crops'}
                                    </span>
                                </div>
                            )}
                            {/* Crops in this group - standard grid or masonry layout */}
                            {masonryLayout ? (
                                <div
                                    className="gap-6"
                                    style={{ columnCount: columnCount, columnGap: '1.5rem' }}
                                >
                                    {groupCrops.map(crop => (
                                        <div key={crop.id} className="break-inside-avoid mb-6">
                                            <CropCard
                                                crop={crop}
                                                onUpdate={(updates) => onUpdateCrop(crop.id, updates)}
                                                onDelete={() => onDeleteCrop(crop.id)}
                                                hideInfo={hideInfo}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    className="grid gap-6"
                                    style={{
                                        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
                                    }}
                                >
                                    {groupCrops.map(crop => (
                                        <CropCard
                                            key={crop.id}
                                            crop={crop}
                                            onUpdate={(updates) => onUpdateCrop(crop.id, updates)}
                                            onDelete={() => onDeleteCrop(crop.id)}
                                            hideInfo={hideInfo}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default GalleryView
