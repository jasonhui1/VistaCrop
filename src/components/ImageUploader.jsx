import { useRef, useState } from 'react'

function ImageUploader({ onImageUpload }) {
    const fileInputRef = useRef(null)
    const [isLoading, setIsLoading] = useState(false)

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            setIsLoading(true)
            const reader = new FileReader()
            reader.onload = async (event) => {
                try {
                    await onImageUpload(event.target.result)
                } finally {
                    setIsLoading(false)
                }
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className={`btn btn-primary ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                aria-label="Upload artwork image"
                disabled={isLoading}
            >
                {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                )}
                {isLoading ? 'Uploading...' : 'Upload Artwork'}
            </button>
        </>
    )
}

export default ImageUploader
