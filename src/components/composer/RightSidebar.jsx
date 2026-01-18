import { memo } from 'react'
import SelectedItemControls from './SelectedItemControls'

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
                            className="p-3 flex-1 overflow-y-auto"
                            style={{ display: activeTab === 'crops' ? 'block' : 'none' }}
                        >
                            {crops.length === 0 ? (
                                <p className="text-xs text-[var(--text-muted)]">
                                    No crops yet. Create some in the Canvas view.
                                </p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {crops.slice().reverse().map((crop) => (
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
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default memo(RightSidebar)
