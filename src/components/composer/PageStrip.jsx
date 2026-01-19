import { memo, useState, useCallback } from 'react'
import { useComposerStore } from '../../stores'
import { useCanvasPersistence } from '../../hooks/useCanvasPersistence'

/**
 * PageStrip - Collapsible horizontal page navigation strip with thumbnails
 * Allows adding, deleting, duplicating pages with context menu
 * Now uses Zustand stores directly
 */
function PageStrip() {
    // Get state and actions from store
    const pages = useComposerStore((s) => s.pages)
    const currentPageIndex = useComposerStore((s) => s.currentPageIndex)
    const placedItems = useComposerStore((s) => s.placedItems)
    const selectPage = useComposerStore((s) => s.selectPage)
    const addPage = useComposerStore((s) => s.addPage)
    const deletePage = useComposerStore((s) => s.deletePage)
    const duplicatePage = useComposerStore((s) => s.duplicatePage)

    // Merge current page's placedItems for accurate display
    const displayPages = pages.map((p, i) =>
        i === currentPageIndex ? { ...p, placedItems } : p
    )

    // Local UI state
    const [isExpanded, setIsExpanded] = useState(false)
    const [contextMenuPage, setContextMenuPage] = useState(null)
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })

    const handleContextMenu = useCallback((e, index) => {
        e.preventDefault()
        setContextMenuPage(index)
        setContextMenuPos({ x: e.clientX, y: e.clientY })
    }, [])

    const closeContextMenu = useCallback(() => {
        setContextMenuPage(null)
    }, [])

    const handleDelete = useCallback(() => {
        if (contextMenuPage !== null) {
            deletePage(contextMenuPage)
        }
        closeContextMenu()
    }, [contextMenuPage, deletePage, closeContextMenu])

    const handleDuplicate = useCallback(() => {
        if (contextMenuPage !== null) {
            duplicatePage(contextMenuPage)
        }
        closeContextMenu()
    }, [contextMenuPage, duplicatePage, closeContextMenu])

    return (
        <div className="page-strip-container" onClick={closeContextMenu}>
            {/* Collapse/Expand toggle */}
            <button
                className="page-strip-toggle"
                onClick={(e) => {
                    e.stopPropagation()
                    setIsExpanded(!isExpanded)
                }}
                title={isExpanded ? 'Collapse pages' : 'Expand pages'}
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
                <span className="page-strip-toggle-label">
                    Pages ({displayPages.length})
                </span>
            </button>

            {/* Collapsible content */}
            <div className={`page-strip ${isExpanded ? 'expanded' : 'collapsed'}`}>
                <div className="page-strip-scroll">
                    {displayPages.map((page, index) => (
                        <button
                            key={page.id}
                            className={`page-thumbnail ${index === currentPageIndex ? 'active' : ''}`}
                            onClick={() => selectPage(index)}
                            onContextMenu={(e) => handleContextMenu(e, index)}
                            title={page.name}
                        >
                            <span className="page-number">{index + 1}</span>
                            <div
                                className="page-preview"
                                style={{
                                    aspectRatio: `${page.pageWidth} / ${page.pageHeight}`,
                                    backgroundColor: page.backgroundColor
                                }}
                            >
                                {page.placedItems?.length > 0 && (
                                    <span className="item-count">{page.placedItems.length}</span>
                                )}
                            </div>
                        </button>
                    ))}

                    <button
                        className="page-add-btn"
                        onClick={addPage}
                        title="Add new page"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Context Menu */}
            {contextMenuPage !== null && (
                <div
                    className="page-context-menu"
                    style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={handleDuplicate}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Duplicate
                    </button>
                    {displayPages.length > 1 && (
                        <button onClick={handleDelete} className="danger">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

/**
 * PageNavigationArrows - Left/right arrows on canvas sides that appear on hover
 * Still uses props since it's a simple presentational component
 */
export function PageNavigationArrows({
    currentPageIndex,
    pageCount,
    onPrevPage,
    onNextPage
}) {
    if (pageCount <= 1) return null

    const hasPrev = currentPageIndex > 0
    const hasNext = currentPageIndex < pageCount - 1

    return (
        <>
            {/* Left Arrow */}
            <button
                className={`page-nav-arrow page-nav-arrow-left ${hasPrev ? '' : 'disabled'}`}
                onClick={hasPrev ? onPrevPage : undefined}
                disabled={!hasPrev}
                title="Previous page"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                </svg>
            </button>

            {/* Right Arrow */}
            <button
                className={`page-nav-arrow page-nav-arrow-right ${hasNext ? '' : 'disabled'}`}
                onClick={hasNext ? onNextPage : undefined}
                disabled={!hasNext}
                title="Next page"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                </svg>
            </button>
        </>
    )
}

export default memo(PageStrip)
