import { memo } from 'react'
import { FRAME_SHAPES, getShapeList } from '../../utils/frameShapes'

/**
 * Selected item controls component for the right sidebar
 * Contains frame shape, border, and style controls
 */
function SelectedItemControls({ selectedItem, onUpdateItem, onDeleteItem }) {
    if (!selectedItem) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <svg className="w-10 h-10 text-[var(--text-muted)] mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                <p className="text-xs text-[var(--text-muted)]">
                    Click an item on the canvas to select it
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {/* Phone Mockup Toggle */}
            <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1">Phone Mockup</label>
                <div className="flex items-center gap-2 mb-2">
                    <button
                        onClick={() => onUpdateItem(selectedItem.id, { phoneMockup: !selectedItem.phoneMockup })}
                        className={`flex-1 py-1.5 text-xs rounded transition-all flex items-center justify-center gap-1.5 ${selectedItem.phoneMockup
                            ? 'bg-[var(--accent-primary)] text-white'
                            : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)]'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="5" y="2" width="14" height="20" rx="2" strokeWidth={1.5} />
                            <line x1="9" y1="19" x2="15" y2="19" strokeWidth={1.5} strokeLinecap="round" />
                        </svg>
                        {selectedItem.phoneMockup ? 'Phone Frame On' : 'Add Phone Frame'}
                    </button>
                </div>
                {selectedItem.phoneMockup && (
                    <div className="space-y-2 p-2 rounded-lg bg-[var(--bg-tertiary)]">
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-[var(--text-muted)] w-12">Color</label>
                            <input
                                type="color"
                                value={selectedItem.phoneColor || '#1a1a1a'}
                                onChange={(e) => onUpdateItem(selectedItem.id, { phoneColor: e.target.value })}
                                className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <div className="flex gap-1">
                                {['#1a1a1a', '#ffffff', '#1e3a5f', '#3d1a1a', '#c0c0c0'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => onUpdateItem(selectedItem.id, { phoneColor: c })}
                                        className="w-5 h-5 rounded-full border border-[var(--border-color)]"
                                        style={{ backgroundColor: c }}
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-[var(--text-muted)] w-12">Style</label>
                            <div className="flex flex-1 gap-1">
                                <button
                                    onClick={() => onUpdateItem(selectedItem.id, { phoneStyle: 'modern' })}
                                    className={`flex-1 py-1 text-xs rounded transition-colors ${(selectedItem.phoneStyle || 'modern') === 'modern'
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-white'
                                        }`}
                                >
                                    Modern
                                </button>
                                <button
                                    onClick={() => onUpdateItem(selectedItem.id, { phoneStyle: 'classic' })}
                                    className={`flex-1 py-1 text-xs rounded transition-colors ${selectedItem.phoneStyle === 'classic'
                                        ? 'bg-[var(--accent-primary)] text-white'
                                        : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-white'
                                        }`}
                                >
                                    Classic
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Frame Shape Selector */}
            <div>
                <label className="text-xs text-[var(--text-muted)] block mb-1">Frame Shape</label>
                <div className="grid grid-cols-4 gap-1">
                    {getShapeList().slice(0, 12).map((shape) => (
                        <button
                            key={shape.id}
                            onClick={() => onUpdateItem(selectedItem.id, { frameShape: shape.id })}
                            className={`aspect-square rounded text-sm flex items-center justify-center transition-all ${(selectedItem.frameShape || 'rectangle') === shape.id
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)]'
                                }`}
                            title={shape.name}
                        >
                            {shape.icon}
                        </button>
                    ))}
                </div>

                {/* More shapes toggle */}
                <details className="mt-1">
                    <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)]">
                        More shapes...
                    </summary>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                        {getShapeList().slice(12).map((shape) => (
                            <button
                                key={shape.id}
                                onClick={() => onUpdateItem(selectedItem.id, { frameShape: shape.id })}
                                className={`aspect-square rounded text-sm flex items-center justify-center transition-all ${(selectedItem.frameShape || 'rectangle') === shape.id
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)]'
                                    }`}
                                title={shape.name}
                            >
                                {shape.icon}
                            </button>
                        ))}
                    </div>
                </details>

                {/* Corner customization controls */}
                {!selectedItem.customPoints ? (
                    <button
                        onClick={() => {
                            const shape = FRAME_SHAPES[selectedItem.frameShape || 'rectangle'] || FRAME_SHAPES.rectangle
                            onUpdateItem(selectedItem.id, {
                                customPoints: shape.points.map(p => [...p]),
                                editingCorners: true
                            })
                        }}
                        className="w-full text-xs py-1.5 mt-2 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)] hover:text-white transition-colors flex items-center justify-center gap-1.5"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Custom Shape
                    </button>
                ) : (
                    <div className="mt-2 p-2 rounded-lg bg-[var(--bg-tertiary)] space-y-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--text-muted)]">Custom Shape</span>
                            {selectedItem.editingCorners && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                                    Editing
                                </span>
                            )}
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => onUpdateItem(selectedItem.id, { editingCorners: !selectedItem.editingCorners })}
                                className={`flex-1 text-xs py-1.5 rounded transition-colors flex items-center justify-center gap-1 ${selectedItem.editingCorners
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-white'
                                    }`}
                            >
                                {selectedItem.editingCorners ? (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Done
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Edit
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => onUpdateItem(selectedItem.id, { customPoints: null, editingCorners: false })}
                                className="px-2 py-1.5 text-xs rounded bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-red-400 transition-colors"
                                title="Reset to preset shape"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Border & Style Controls */}
            <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                <label className="text-xs text-[var(--text-muted)] block mb-1">Border Style</label>
                <div className="grid grid-cols-4 gap-1 mb-2">
                    {[
                        { id: 'solid', label: '━', title: 'Solid' },
                        { id: 'manga', label: '▰', title: 'Manga Double' },
                        { id: 'dashed', label: '┅', title: 'Dashed' },
                        { id: 'none', label: '○', title: 'None' }
                    ].map((style) => (
                        <button
                            key={style.id}
                            onClick={() => onUpdateItem(selectedItem.id, { borderStyle: style.id })}
                            className={`aspect-square rounded text-sm flex items-center justify-center transition-all ${(selectedItem.borderStyle || 'manga') === style.id
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-primary)]'
                                }`}
                            title={style.title}
                        >
                            {style.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 mb-2">
                    <label className="text-xs text-[var(--text-muted)] w-12">Color</label>
                    <input
                        type="color"
                        value={selectedItem.borderColor || '#000000'}
                        onChange={(e) => onUpdateItem(selectedItem.id, { borderColor: e.target.value })}
                        className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent"
                    />
                    <input
                        type="text"
                        value={selectedItem.borderColor || '#000000'}
                        onChange={(e) => onUpdateItem(selectedItem.id, { borderColor: e.target.value })}
                        className="flex-1 text-xs py-1"
                        placeholder="#000000"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--text-muted)] w-12">Width</label>
                    <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={selectedItem.borderWidth ?? 3}
                        onChange={(e) => onUpdateItem(selectedItem.id, { borderWidth: parseFloat(e.target.value) })}
                        className="flex-1"
                    />
                    <span className="text-xs text-[var(--text-secondary)] w-6">
                        {selectedItem.borderWidth ?? 3}
                    </span>
                </div>
            </div>

            {/* Frame Rotation Control */}
            <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-[var(--text-muted)]">Frame Rotation</label>
                    {(selectedItem.frameRotation ?? 0) !== 0 && (
                        <button
                            onClick={() => onUpdateItem(selectedItem.id, { frameRotation: 0 })}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white transition-colors"
                            title="Reset frame rotation"
                        >
                            Reset
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <input
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={selectedItem.frameRotation ?? 0}
                        onChange={(e) => onUpdateItem(selectedItem.id, { frameRotation: parseFloat(e.target.value) })}
                        className="flex-1"
                    />
                    <span className="text-xs text-[var(--text-secondary)] w-10 text-right">
                        {Math.round(selectedItem.frameRotation ?? 0)}°
                    </span>
                </div>
            </div>

            {/* Crop Position Control */}
            {((selectedItem.cropOffsetX ?? 0) !== 0 || (selectedItem.cropOffsetY ?? 0) !== 0) && (
                <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                    <div className="flex items-center justify-between mb-1">
                        <label className="text-xs text-[var(--text-muted)]">Crop Position</label>
                        <button
                            onClick={() => onUpdateItem(selectedItem.id, { cropOffsetX: 0, cropOffsetY: 0 })}
                            className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-white transition-colors"
                            title="Reset crop position"
                        >
                            Reset
                        </button>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)]">
                        Offset: {Math.round(selectedItem.cropOffsetX ?? 0)}, {Math.round(selectedItem.cropOffsetY ?? 0)}
                        <br />
                        <span className="opacity-70">Ctrl+drag to adjust</span>
                    </p>
                </div>
            )}

            <div className="flex items-center gap-2 mt-2">
                <label className="text-xs text-[var(--text-muted)]">Fit:</label>
                <select
                    value={selectedItem.objectFit || 'contain'}
                    onChange={(e) => onUpdateItem(selectedItem.id, { objectFit: e.target.value })}
                    className="text-xs py-1 flex-1"
                >
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                </select>
            </div>

            <div className="text-xs text-[var(--text-muted)]">
                {Math.round(selectedItem.width)}px × {Math.round(selectedItem.height)}px
            </div>

            <button
                onClick={() => onDeleteItem(selectedItem.id)}
                className="w-full text-xs py-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
                Delete Item
            </button>
        </div>
    )
}

export default memo(SelectedItemControls)
