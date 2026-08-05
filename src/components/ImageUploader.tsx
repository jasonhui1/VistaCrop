import { useRef, ChangeEvent } from 'react'

export interface ImageUploaderProps {
    onImageUpload: (imageDataUrl: string) => void
}

function ImageUploader({ onImageUpload }: ImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (event: ProgressEvent<FileReader>) => {
                if (event.target?.result && typeof event.target.result === 'string') {
                    onImageUpload(event.target.result)
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
                className="btn btn-primary"
                aria-label="Upload artwork image"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Artwork
            </button>
        </>
    )
}

export default ImageUploader
