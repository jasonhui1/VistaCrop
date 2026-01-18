import { memo, useState, useMemo } from 'react'
import SelectedItemControls from './SelectedItemControls'

// Helper to determine which date group a timestamp belongs to
function getDateGroup(timestamp) {
    const now = new Date()
    const date = new Date(timestamp)

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

/**
 * Right sidebar component for Composer view
 * Contains tabs for Crops list and Selected item controls
 */
function RightSidebar({
    isOpen,
    onToggle,
    activeTab,
    onTabChange,
    mode,
    selectedItem,
    crops,
    onUpdateItem,
    onDeleteItem,
    onCropDragStart
}) {
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
            const query = searchQuery.toLowerCase().trim()
            if (query) {
                const matchesNotes = (crop.notes || '').toLowerCase().includes(query)
                const matchesTags = (crop.tags || []).some(tag =>
                    tag.toLowerCase().includes(query)
                )
                if (!matchesNotes && !matchesTags) return false
            }

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
        const sortedCrops = [...filteredCrops].sort((a, b) => b.id - a.id)

        for (const crop of sortedCrops) {
            const group = getDateGroup(crop.id)
            if (!groups[group]) {
                groups[group] = []
            }
            groups[group].push(crop)
        }

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

    return (
        <div className={`${isOpen ? 'w-48' : 'w-12'} border-l border-[var(--border-color)] overflow-y-auto flex flex-col transition-all duration-200`}>
            {/* Sidebar Toggle */}
            <button
                onClick={onToggle}
                className="p-3 hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center"
                title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
            </button>

            {isOpen && (
                <div className="overflow-y-auto flex-1 flex flex-col">
                    {/* Tab buttons */}
                    <div className="flex border-b border-[var(--border-color)]">
                        <button
                            onClick={() => onTabChange('crops')}
                            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'crops'
                                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }`}
                        >
                            Crops
                        </button>
                        <button
                            onClick={() => onTabChange('selected')}
                            className={`flex-1 py-2 text-xs font-medium transition-colors relative ${activeTab === 'selected'
                                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }`}
                        >
                            Selected
                            {mode === 'freeform' && selectedItem && activeTab !== 'selected' && (
                                <span className="absolute top-1 right-2 w-2 h-2 bg-[var(--accent-primary)] rounded-full"></span>
                            )}
                        </button>
                    </div>

                    {/* Tab Content - Both rendered but hidden with CSS to preserve scroll */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {/* Selected Item Controls */}
                        <div
                            className="p-3 flex-1 overflow-y-auto"
                            style={{ display: activeTab === 'selected' ? 'block' : 'none' }}
                        >
                            {mode === 'freeform' && (
                                <SelectedItemControls
                                    selectedItem={selectedItem}
                                    onUpdateItem={onUpdateItem}
                                    onDeleteItem={onDeleteItem}
                                />
                            )}
                        </div>

                        {/* Crops List */}
                        <div
                            className="p-3 flex-1 overflow-y-auto flex flex-col gap-2"
                            style={{ display: activeTab === 'crops' ? 'flex' : 'none' }}
                        >
                            {crops.length === 0 ? (
                                <p className="text-xs text-[var(--text-muted)]">
                                    No crops yet. Create some in the Canvas view.
                                </p>
                            ) : (
                                <>
                                    {/* Compact Search */}
                                    <div className="relative">
                                        <svg
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]"
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
                                            placeholder="Search..."
                                            className="w-full pr-2 py-1.5 text-xs"
                                            style={{ paddingLeft: '1.75rem' }}
                                        />
                                    </div>

                                    {/* Compact Tag Chips */}
                                    {allTags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {allTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    onClick={() => toggleTag(tag)}
                                                    className={`px-2 py-0.5 text-[10px] rounded-full transition-all ${selectedTags.has(tag)
                                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                        : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white'
                                                        }`}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Filter status */}
                                    {hasActiveFilters && (
                                        <div className="flex items-center justify-between text-[10px]">
                                            <span className="text-[var(--text-muted)]">
                                                {filteredCrops.length}/{crops.length}
                                            </span>
                                            <button
                                                onClick={clearFilters}
                                                className="text-purple-400 hover:text-purple-300"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    )}

                                    {/* Crops with Date Groups */}
                                    {filteredCrops.length === 0 ? (
                                        <p className="text-xs text-[var(--text-muted)] text-center py-4">
                                            No matches
                                        </p>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            {groupedCrops.map(([groupName, groupCrops]) => (
                                                <div key={groupName}>
                                                    {/* Compact Date Group Header */}
                                                    <div className="flex items-center gap-1 mb-2">
                                                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase">
                                                            {groupName}
                                                        </span>
                                                        <div className="flex-1 h-px bg-[var(--border-color)]"></div>
                                                    </div>
                                                    {/* Crops in this group */}
                                                    <div className="flex flex-col gap-2">
                                                        {groupCrops.map((crop) => (
                                                            <div
                                                                key={crop.id}
                                                                draggable
                                                                onDragStart={(e) => onCropDragStart(e, crop)}
                                                                className="crop-drawer-item rounded-lg overflow-hidden border border-[var(--border-color)] cursor-grab active:cursor-grabbing hover:border-[var(--accent-primary)] transition-colors"
                                                            >
                                                                <div className="aspect-video bg-[var(--bg-tertiary)] relative overflow-hidden">
                                                                    <img
                                                                        src={crop.imageData}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        style={{
                                                                            transform: `rotate(${crop.rotation || 0}deg)`
                                                                        }}
                                                                        draggable={false}
                                                                    />
                                                                </div>
                                                                <div className="p-2 bg-[var(--bg-secondary)]">
                                                                    <span className="text-xs text-[var(--text-muted)]">
                                                                        {crop.width} × {crop.height}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default memo(RightSidebar)


