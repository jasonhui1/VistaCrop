import { create } from 'zustand'

/**
 * UI Store - manages UI-related state
 * Separated from canvas data for cleaner architecture
 */
export const useUIStore = create((set) => ({
    // === SIDEBAR STATE ===
    leftSidebarOpen: true,
    rightSidebarOpen: true,
    rightSidebarTab: 'crops',

    // === CANVAS UI STATE ===
    editingCanvasSize: false,
    showGallery: false,

    // === SELECTION STATE ===
    selectedItemId: null,
    selectedPanelIndex: null,

    // === SETTERS ===
    setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
    setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
    setRightSidebarTab: (tab) => set({ rightSidebarTab: tab }),
    setEditingCanvasSize: (editing) => set({ editingCanvasSize: editing }),
    setShowGallery: (show) => set({ showGallery: show }),
    setSelectedItemId: (id) => set({ selectedItemId: id }),
    setSelectedPanelIndex: (index) => set({ selectedPanelIndex: index }),

    // === HELPERS ===
    clearSelection: () => set({ selectedItemId: null, selectedPanelIndex: null }),
    toggleLeftSidebar: () => set((s) => ({ leftSidebarOpen: !s.leftSidebarOpen })),
    toggleRightSidebar: () => set((s) => ({ rightSidebarOpen: !s.rightSidebarOpen }))
}))
