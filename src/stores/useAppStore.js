import { create } from 'zustand'

/**
 * App-level navigation store
 * Manages which view is currently active
 */
export const useAppStore = create((set) => ({
    // Current view: 'canvas' | 'gallery' | 'composer'
    view: 'canvas',
    isLoading: true,

    // Actions
    setView: (view) => set({ view }),
    setLoading: (isLoading) => set({ isLoading }),
}))
