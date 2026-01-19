import PageCanvas from './PageCanvas'
import FreeformCanvas from './FreeformCanvas'
import { LeftSidebar, RightSidebar, CanvasToolbar, PageStrip, PanelControls } from './composer'
import { PageNavigationArrows } from './composer/PageStrip'
import { useComposerStore } from '../stores'

/**
 * ComposerView - Main composition view for creating manga-style page layouts
 * 
 * This is a pure layout component that orchestrates the UI structure.
 * All child components are self-contained and subscribe to their own state from stores.
 */
function ComposerView() {
    // Only mode needed for layout decisions
    const mode = useComposerStore((s) => s.mode)

    return (
        <div className="glass-card flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <LeftSidebar />

            {/* Main Canvas Area */}
            <div className="flex-1 flex flex-col p-2 overflow-hidden">
                {/* Toolbar (self-contained with persistence & gallery) */}
                <CanvasToolbar />

                {/* Page Strip (freeform mode only) */}
                {mode === 'freeform' && <PageStrip />}

                {/* Canvas Container with Navigation Arrows */}
                <div className="flex-1 flex items-center justify-center bg-[var(--bg-tertiary)] rounded-lg p-2 min-h-0 canvas-with-nav">
                    {/* Page Navigation Arrows */}
                    {mode === 'freeform' && <PageNavigationArrows />}

                    {/* Canvas - each canvas type is self-contained */}
                    {mode === 'panels' ? <PageCanvas /> : <FreeformCanvas />}
                </div>

                {/* Panel Controls (panel mode only, self-contained) */}
                <PanelControls />
            </div>

            {/* Right Sidebar */}
            <RightSidebar />
        </div>
    )
}

export default ComposerView
