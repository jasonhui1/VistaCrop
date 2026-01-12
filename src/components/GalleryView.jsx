import CropCard from './CropCard'

function GalleryView({ crops, originalImage, onUpdateCrop, onDeleteCrop }) {
    if (crops.length === 0) {
        return (
            <div className="glass-card flex-1 flex flex-col items-center justify-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <svg className="w-12 h-12 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold gradient-text mb-2">No Crops Yet</h2>
                    <p className="text-[var(--text-secondary)]">Create crops from the Canvas view to see them here</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Switch to Canvas, upload an image, and select an area
                </div>
            </div>
        )
    }

    return (
        <div className="glass-card flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {crops.map(crop => (
                    <CropCard
                        key={crop.id}
                        crop={crop}
                        originalImage={crop.originalImage || originalImage}
                        onUpdate={(updates) => onUpdateCrop(crop.id, updates)}
                        onDelete={() => onDeleteCrop(crop.id)}
                    />
                ))}
            </div>
        </div>
    )
}

export default GalleryView
