import { useState, useCallback, useRef, useEffect } from 'react'
import ImageUploader from './components/ImageUploader'
import CanvasView from './components/CanvasView'
import GalleryView from './components/GalleryView'
import ComposerView from './components/ComposerView'
import { saveCrops, loadAllCrops, updateCrop, deleteCrop, uploadImage, getImage } from './utils/api'

function App() {
  const [view, setView] = useState('canvas') // 'canvas', 'gallery', or 'composer'
  const [uploadedImage, setUploadedImage] = useState(null)
  const [imageId, setImageId] = useState(null)
  const [crops, setCrops] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Use ref to avoid stale closure issues
  const imageIdRef = useRef(null)

  // Load all crops on app mount
  useEffect(() => {
    async function loadSavedCrops() {
      try {
        const allCrops = await loadAllCrops()
        if (allCrops.length > 0) {
          setCrops(allCrops)
          // Get the imageId from the first crop
          const firstCropImageId = allCrops[0].imageId
          if (firstCropImageId) {
            imageIdRef.current = firstCropImageId
            setImageId(firstCropImageId)
            // Fetch the original image from the server
            try {
              const imageData = await getImage(firstCropImageId)
              if (imageData && imageData.data) {
                setUploadedImage(imageData.data)
              }
            } catch (imgError) {
              console.error('Failed to load image:', imgError)
            }
          }
          console.log(`Loaded ${allCrops.length} crops from database`)
        }
      } catch (error) {
        console.error('Failed to load crops:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadSavedCrops()
  }, [])

  const handleImageUpload = async (imageDataUrl) => {
    // Generate a unique imageId for this upload session
    const newImageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    imageIdRef.current = newImageId
    setImageId(newImageId)
    setUploadedImage(imageDataUrl)
    setCrops([]) // Clear crops for new image
    setView('canvas')

    // Upload the image to the server immediately
    try {
      await uploadImage(newImageId, imageDataUrl)
      console.log(`Uploaded image: ${newImageId}`)
    } catch (error) {
      console.error('Failed to upload image:', error)
    }
  }

  // Helper to save crops to the server - groups by imageId to avoid duplicates
  const saveToServer = useCallback(async (cropsToSave) => {
    // Group crops by their imageId
    const cropsByImageId = {}
    for (const crop of cropsToSave) {
      const cropImageId = crop.imageId || imageIdRef.current
      if (!cropImageId) continue
      if (!cropsByImageId[cropImageId]) {
        cropsByImageId[cropImageId] = []
      }
      cropsByImageId[cropImageId].push(crop)
    }

    // Save each group to its respective imageId
    try {
      for (const [imgId, imgCrops] of Object.entries(cropsByImageId)) {
        await saveCrops(imgId, imgCrops)
        console.log(`Saved ${imgCrops.length} crops to image: ${imgId}`)
      }
    } catch (error) {
      console.error('Failed to save crops:', error)
    }
  }, [])

  const handleAddCrop = async (cropData) => {
    const newCrop = {
      id: Date.now(),
      imageId: imageIdRef.current, // Tag with current image
      imageData: cropData.imageData,
      // Note: originalImage is not stored in the crop - it's fetched separately via imageId
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
    const updatedCrops = [...crops, newCrop]
    setCrops(updatedCrops)

    // Save to server immediately
    await saveToServer(updatedCrops)
  }

  const handleUpdateCrop = async (id, updates) => {
    const crop = crops.find(c => c.id === id)
    if (!crop) return

    const updatedCrops = crops.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
    setCrops(updatedCrops)

    // Use granular update API
    try {
      const cropImageId = crop.imageId || imageIdRef.current
      if (cropImageId) {
        await updateCrop(cropImageId, id, updates)
        console.log(`Updated crop ${id} for image: ${cropImageId}`)
      }
    } catch (error) {
      console.error('Failed to update crop:', error)
    }
  }

  const handleDeleteCrop = async (id) => {
    const crop = crops.find(c => c.id === id)
    const updatedCrops = crops.filter(c => c.id !== id)
    setCrops(updatedCrops)

    // Use granular delete API
    try {
      const cropImageId = crop?.imageId || imageIdRef.current
      if (cropImageId) {
        await deleteCrop(cropImageId, id)
        console.log(`Deleted crop ${id} from image: ${cropImageId}`)
      }
    } catch (error) {
      console.error('Failed to delete crop:', error)
    }
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
            onUpdateCrop={handleUpdateCrop}
            onDeleteCrop={handleDeleteCrop}
          />
        ) : (
          <ComposerView
            crops={crops}
          />
        )}
      </main>
    </div>
  )
}

export default App
