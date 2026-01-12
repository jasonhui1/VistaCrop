import { useState } from 'react'
import ImageUploader from './components/ImageUploader'
import CanvasView from './components/CanvasView'
import GalleryView from './components/GalleryView'
import ComposerView from './components/ComposerView'

function App() {
  const [view, setView] = useState('canvas') // 'canvas', 'gallery', or 'composer'
  const [uploadedImage, setUploadedImage] = useState(null)
  const [crops, setCrops] = useState([])

  const handleImageUpload = (imageDataUrl) => {
    setUploadedImage(imageDataUrl)
    setView('canvas')
  }

  const handleAddCrop = (cropData) => {
    const newCrop = {
      id: Date.now(),
      imageData: cropData.imageData,
      originalImage: uploadedImage, // Store reference to original image
      x: cropData.x,
      y: cropData.y,
      width: cropData.width,
      height: cropData.height,
      originalImageWidth: cropData.originalImageWidth,
      originalImageHeight: cropData.originalImageHeight,
      rotation: 0,
      tags: [],
      notes: '',
      sourceRotation: cropData.sourceRotation || 0,
      filter: cropData.filter || 'none'
    }
    setCrops(prev => [...prev, newCrop])
  }

  const handleUpdateCrop = (id, updates) => {
    setCrops(prev => prev.map(crop =>
      crop.id === id ? { ...crop, ...updates } : crop
    ))
  }

  const handleDeleteCrop = (id) => {
    setCrops(prev => prev.filter(crop => crop.id !== id))
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Header */}
      <header className="glass-card m-4 mb-0 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text">Art Detail Studio</h1>
            <p className="text-xs text-[var(--text-muted)]">Explore artwork details with precision</p>
          </div>
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
        <ImageUploader onImageUpload={handleImageUpload} />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 min-h-0 flex flex-col">
        {view === 'canvas' ? (
          <CanvasView
            image={uploadedImage}
            onAddCrop={handleAddCrop}
            onImageUpload={handleImageUpload}
            onSwitchToGallery={() => setView('gallery')}
          />
        ) : view === 'gallery' ? (
          <GalleryView
            crops={crops}
            originalImage={uploadedImage}
            onUpdateCrop={handleUpdateCrop}
            onDeleteCrop={handleDeleteCrop}
          />
        ) : (
          <ComposerView
            crops={crops}
            originalImage={uploadedImage}
          />
        )}
      </main>
    </div>
  )
}

export default App
