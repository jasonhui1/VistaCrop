import { useEffect } from 'react'
import ImageUploader from './components/ImageUploader'
import CanvasView from './components/CanvasView'
import GalleryView from './components/GalleryView'
import ComposerView from './components/ComposerView'
import { useAppStore, useCropsStore } from './stores'

function App() {
  // Get state and actions from stores
  const view = useAppStore((s) => s.view)
  const setView = useAppStore((s) => s.setView)
  const isLoading = useAppStore((s) => s.isLoading)
  const setLoading = useAppStore((s) => s.setLoading)

  const crops = useCropsStore((s) => s.crops)
  const uploadedImage = useCropsStore((s) => s.uploadedImage)
  const loadSavedCrops = useCropsStore((s) => s.loadSavedCrops)
  const handleImageUpload = useCropsStore((s) => s.handleImageUpload)
  const addCrop = useCropsStore((s) => s.addCrop)

  // Load all crops on app mount
  useEffect(() => {
    async function init() {
      await loadSavedCrops()
      setLoading(false)
    }
    init()
  }, [loadSavedCrops, setLoading])

  // Wrapper to set view after image upload
  const onImageUpload = async (imageDataUrl) => {
    await handleImageUpload(imageDataUrl)
    setView('canvas')
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Header */}
      <header className="glass-card px-4 py-2 flex items-center justify-between border-b border-[var(--border-color)] rounded-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold gradient-text">Art Detail Studio</h1>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-xl p-1">
          <button
            onClick={() => setView('canvas')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === 'canvas'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-[var(--text-secondary)] hover:text-white'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Canvas
            </span>
          </button>
          <button
            onClick={() => setView('gallery')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === 'gallery'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-[var(--text-secondary)] hover:text-white'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Gallery
              {crops.length > 0 && (
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {crops.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setView('composer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${view === 'composer'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'text-[var(--text-secondary)] hover:text-white'
              }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Composer
            </span>
          </button>
        </div>

        {/* Upload Button */}
        {/* <ImageUploader onImageUpload={onImageUpload} /> */}
        <div></div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 min-h-0 flex flex-col">
        {view === 'canvas' ? (
          <CanvasView
            image={uploadedImage}
            onAddCrop={addCrop}
            onImageUpload={onImageUpload}
            onSwitchToGallery={() => setView('gallery')}
          />
        ) : view === 'gallery' ? (
          <GalleryView />
        ) : (
          <ComposerView />
        )}
      </main>
    </div>
  )
}

export default App
