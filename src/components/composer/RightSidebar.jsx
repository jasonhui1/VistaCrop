import { memo, useState, useMemo, useCallback } from 'react'
import SelectedItemControls from './SelectedItemControls'
import { useComposerStore, useCropsStore } from '../../stores'

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
 * Now uses Zustand stores directly instead of props
 */
function RightSidebar() {
    // === STATE FROM STORES ===
    const crops = useCropsStore((s) => s.crops)

    const isOpen = useComposerStore((s) => s.rightSidebarOpen)
    const setIsOpen = useComposerStore((s) => s.setRightSidebarOpen)
    const activeTab = useComposerStore((s) => s.rightSidebarTab)
    const setActiveTab = useComposerStore((s) => s.setRightSidebarTab)
    const mode = useComposerStore((s) => s.mode)
    const selectedItem = useComposerStore((s) => s.getSelectedItem)()
    const updateItem = useComposerStore((s) => s.updateItem)
    const deleteItem = useComposerStore((s) => s.deleteItem)
    const getComposition = useComposerStore((s) => s.getComposition)
    const addMultipleCrops = useComposerStore((s) => s.addMultipleCrops)

    // === LOCAL STATE ===
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedTags, setSelectedTags] = useState(new Set())
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedCropIds, setSelectedCropIds] = useState(new Set())
    const [sidebarSize, setSidebarSize] = useState('S') // 'S', 'M', 'L'

    // Width configuration based on size
    const sizeConfig = {
        S: { width: 'w-48', columns: 1, thumbClass: 'aspect-[4/3]' },
        M: { width: 'w-72', columns: 2, thumbClass: 'aspect-square' },
        L: { width: 'w-96', columns: 3, thumbClass: 'aspect-square' }
    }
    const currentConfig = sizeConfig[sidebarSize]

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

    const toggleCropSelection = (cropId) => {
        setSelectedCropIds(prev => {
            const next = new Set(prev)
            if (next.has(cropId)) {
                next.delete(cropId)
            } else {
                next.add(cropId)
            }
            return next
        })
    }

    const handleSelectAll = () => {
        const allFilteredIds = filteredCrops.map(c => c.id)
        setSelectedCropIds(new Set(allFilteredIds))
    }

    const handleDeselectAll = () => {
        setSelectedCropIds(new Set())
    }

    const handleAddSelected = useCallback(() => {
        if (selectedCropIds.size > 0) {
            const composition = getComposition()
            const cropsToAdd = Array.from(selectedCropIds).map(id => crops.find(c => c.id === id)).filter(Boolean)
            addMultipleCrops(cropsToAdd, composition.pageWidth, composition.pageHeight)
            setSelectedCropIds(new Set())
            setSelectionMode(false)
        }
    }, [selectedCropIds, crops, addMultipleCrops, getComposition])

    const toggleSelectionMode = () => {
        if (selectionMode) {
            // Exiting selection mode - clear selections
            setSelectedCropIds(new Set())
        }
        setSelectionMode(!selectionMode)
    }

    const handleCropDragStart = useCallback((e, crop) => {
        e.dataTransfer.setData('application/crop-id', crop.id.toString())
        e.dataTransfer.effectAllowed = 'copy'
    }, [])

    const hasActiveFilters = searchQuery || selectedTags.size > 0

    return (
        <div className={`${isOpen ? currentConfig.width : 'w-12'} border-l border-[var(--border-color)] overflow-y-auto flex flex-col transition-all duration-200`}>
            {/* Sidebar Toggle + Size Controls */}
            <div className="flex items-center justify-between border-b border-[var(--border-color)]">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-3 hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center"
                    title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
                {isOpen && (
                    <div className="flex items-center gap-0.5 pr-2">
                        {['S', 'M', 'L'].map(size => (
                            <button
                                key={size}
                                onClick={() => setSidebarSize(size)}
                                className={`w-6 h-6 text-[10px] font-medium rounded transition-all ${sidebarSize === size
                                    ? 'bg-purple-500 text-white'
                                    : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-tertiary)]'
                                    }`}
                                title={`${size === 'S' ? 'Small' : size === 'M' ? 'Medium' : 'Large'} width`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="overflow-y-auto flex-1 flex flex-col">
                    {/* Tab buttons */}
                    <div className="flex border-b border-[var(--border-color)]">
                        <button
                            onClick={() => setActiveTab('crops')}
                            className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'crops'
                                ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                                }`}
                        >
                            Crops
                        </button>
                        <button
                            onClick={() => setActiveTab('selected')}
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
                                    onUpdateItem={updateItem}
                                    onDeleteItem={deleteItem}
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
                                    {/* Selection Mode Toggle */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={toggleSelectionMode}
                                            className={`flex-1 px-2 py-1.5 text-[10px] font-medium rounded transition-all ${selectionMode
                                                ? 'bg-purple-500 text-white'
                                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white'
                                                }`}
                                        >
                                            {selectionMode ? '✓ Select' : '☐ Select'}
                                        </button>
                                        {selectionMode && selectedCropIds.size > 0 && (
                                            <button
                                                onClick={handleAddSelected}
                                                className="flex-1 px-2 py-1.5 text-[10px] font-medium rounded bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                            >
                                                Add {selectedCropIds.size}
                                            </button>
                                        )}
                                    </div>

                                    {/* Select All / Deselect All (in selection mode) */}
                                    {selectionMode && filteredCrops.length > 0 && (
                                        <div className="flex items-center gap-1 text-[10px]">
                                            <button
                                                onClick={handleSelectAll}
                                                className="text-purple-400 hover:text-purple-300"
                                            >
                                                All
                                            </button>
                                            <span className="text-[var(--text-muted)]">|</span>
                                            <button
                                                onClick={handleDeselectAll}
                                                className="text-purple-400 hover:text-purple-300"
                                            >
                                                None
                                            </button>
                                            <span className="text-[var(--text-muted)] ml-auto">
                                                {selectedCropIds.size} selected
                                            </span>
                                        </div>
                                    )}

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
                                                    {/* Crops in this group - responsive grid */}
                                                    <div
                                                        className="grid gap-2"
                                                        style={{ gridTemplateColumns: `repeat(${currentConfig.columns}, 1fr)` }}
                                                    >
                                                        {groupCrops.map((crop) => (
                                                            <div
                                                                key={crop.id}
                                                                draggable={!selectionMode}
                                                                onDragStart={(e) => !selectionMode && handleCropDragStart(e, crop)}
                                                                onClick={() => selectionMode && toggleCropSelection(crop.id)}
                                                                className={`crop-drawer-item rounded-lg overflow-hidden border transition-colors ${selectionMode
                                                                    ? selectedCropIds.has(crop.id)
                                                                        ? 'border-purple-500 ring-2 ring-purple-500/30'
                                                                        : 'border-[var(--border-color)] hover:border-purple-400 cursor-pointer'
                                                                    : 'border-[var(--border-color)] cursor-grab active:cursor-grabbing hover:border-[var(--accent-primary)]'
                                                                    }`}
                                                            >
                                                                <div className={`${currentConfig.thumbClass} bg-[var(--bg-tertiary)] relative overflow-hidden`}>
                                                                    <img
                                                                        src={crop.imageData}
                                                                        alt=""
                                                                        className="w-full h-full object-cover"
                                                                        style={{
                                                                            transform: `rotate(${crop.rotation || 0}deg)`
                                                                        }}
                                                                        draggable={false}
                                                                    />
                                                                    {/* Selection checkbox overlay */}
                                                                    {selectionMode && (
                                                                        <div className={`absolute top-1 left-1 w-5 h-5 rounded flex items-center justify-center ${selectedCropIds.has(crop.id)
                                                                            ? 'bg-purple-500'
                                                                            : 'bg-black/50'
                                                                            }`}>
                                                                            {selectedCropIds.has(crop.id) && (
                                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                                </svg>
                                                                            )}
                                                                        </div>
                                                                    )}
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
