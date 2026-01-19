import { memo, useState, useCallback } from 'react'

/**
 * PageStrip - Horizontal page navigation strip showing page thumbnails
 * Allows adding, deleting, duplicating, and reordering pages
 */
function PageStrip({
    pages,
    currentPageIndex,
    onSelectPage,
    onAddPage,
    onDeletePage,
    onDuplicatePage,
    disabled = false
}) {
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
            onDeletePage(contextMenuPage)
        }
        closeContextMenu()
    }, [contextMenuPage, onDeletePage, closeContextMenu])

    const handleDuplicate = useCallback(() => {
        if (contextMenuPage !== null) {
            onDuplicatePage(contextMenuPage)
        }
        closeContextMenu()
    }, [contextMenuPage, onDuplicatePage, closeContextMenu])

    return (
        <div className="page-strip" onClick={closeContextMenu}>
            <div className="page-strip-scroll">
                {pages.map((page, index) => (
                    <button
                        key={page.id}
                        className={`page-thumbnail ${index === currentPageIndex ? 'active' : ''}`}
                        onClick={() => onSelectPage(index)}
                        onContextMenu={(e) => handleContextMenu(e, index)}
                        disabled={disabled}
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
                    onClick={onAddPage}
                    disabled={disabled}
                    title="Add new page"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                </button>
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
                    {pages.length > 1 && (
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

export default memo(PageStrip)
