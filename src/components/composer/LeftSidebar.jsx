import { memo } from 'react'
import { PAGE_PRESETS, getLayoutList } from '../../utils/panelLayouts'

/**
 * Left sidebar component for Composer view
 * Contains mode toggle, layout selection, page settings, and tips
 */
function LeftSidebar({
    isOpen,
    onToggle,
    mode,
    onModeChange,
    composition,
    onCompositionChange,
    onLayoutChange,
    onPagePresetChange
}) {
    const allLayouts = getLayoutList()

    return (
        <div className={`${isOpen ? 'w-48' : 'w-12'} border-r border-[var(--border-color)] overflow-y-auto flex flex-col transition-all duration-200`}>
            {/* Sidebar Toggle */}
            <button
                onClick={onToggle}
                className="p-3 hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center"
                title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
                <svg className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${isOpen ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="p-3 flex flex-col gap-4">
                    {/* Mode Toggle */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Mode
                        </h3>
                        <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
                            <button
                                onClick={() => onModeChange('freeform')}
                                className={`flex-1 py-2 text-xs font-medium transition-colors ${mode === 'freeform'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                                    }`}
                            >
                                Freeform
                            </button>
                            <button
                                onClick={() => onModeChange('panels')}
                                className={`flex-1 py-2 text-xs font-medium transition-colors ${mode === 'panels'
                                    ? 'bg-[var(--accent-primary)] text-white'
                                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-white'
                                    }`}
                            >
                                Panels
                            </button>
                        </div>
                    </div>

                    {/* Panel Layouts (only in panel mode) */}
                    {mode === 'panels' && (
                        <>
                            <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                Layouts
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {allLayouts.map((layout) => (
                                    <button
                                        key={layout.id}
                                        onClick={() => onLayoutChange(layout.id)}
                                        className={`layout-thumbnail p-2 rounded-lg border transition-all ${composition.layoutId === layout.id
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                                            : 'border-[var(--border-color)] hover:border-[var(--accent-secondary)] bg-[var(--bg-tertiary)]'
                                            }`}
                                        title={layout.description}
                                    >
                                        <div className="aspect-[3/4] bg-[var(--bg-primary)] rounded relative overflow-hidden">
                                            {layout.panels.map((panel, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${panel.x * 100}%`,
                                                        top: `${panel.y * 100}%`,
                                                        width: `${panel.width * 100}%`,
                                                        height: `${panel.height * 100}%`,
                                                        backgroundColor: composition.layoutId === layout.id
                                                            ? 'var(--accent-primary)'
                                                            : 'var(--bg-tertiary)',
                                                        border: '1px solid var(--border-color)',
                                                        boxSizing: 'border-box',
                                                        opacity: 0.7
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-[var(--text-muted)] mt-1 block truncate">
                                            {layout.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Page Settings */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Page Size
                        </h3>
                        <select
                            value={composition.pagePreset}
                            onChange={(e) => onPagePresetChange(e.target.value)}
                            className="w-full text-sm"
                        >
                            {Object.entries(PAGE_PRESETS).map(([key, preset]) => (
                                <option key={key} value={key}>{preset.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Background Color */}
                    <div>
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                            Background
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="color"
                                value={composition.backgroundColor}
                                onChange={(e) => onCompositionChange({ backgroundColor: e.target.value })}
                                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                            />
                            <input
                                type="text"
                                value={composition.backgroundColor}
                                onChange={(e) => onCompositionChange({ backgroundColor: e.target.value })}
                                className="flex-1 text-xs"
                            />
                        </div>
                    </div>

                    {/* Freeform tips */}
                    {mode === 'freeform' && (
                        <div className="text-xs text-[var(--text-muted)] bg-[var(--bg-tertiary)] p-3 rounded-lg">
                            <p className="font-medium text-[var(--text-secondary)] mb-1">Freeform Mode</p>
                            <ul className="space-y-1">
                                <li>• Drag crops onto the canvas</li>
                                <li>• Click to select, drag to move</li>
                                <li>• Drag corner to resize</li>
                                <li>• Delete key to remove</li>
                                <li>• Ctrl+Z/Y to undo/redo</li>
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default memo(LeftSidebar)
