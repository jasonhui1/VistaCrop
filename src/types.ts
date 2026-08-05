/**
 * Shared TypeScript type definitions for VistaCrop
 */

export type Point2D = [number, number];

export interface Point {
    x: number;
    y: number;
}

export interface Dimensions {
    width: number;
    height: number;
}

export interface Rect extends Point, Dimensions {}

export type BorderStyle = 'none' | 'solid' | 'dashed' | 'manga';

export type PhoneStyle = 'modern' | 'classic';

export interface Crop {
    id: string | number;
    imageId?: string;
    imageData?: string;
    imageDataPath?: string;
    x?: number;
    y?: number;
    width: number;
    height: number;
    originalImageWidth?: number;
    originalImageHeight?: number;
    rotation?: number;
    sourceRotation?: number;
    filter?: string;
    tags?: string[];
    notes?: string;
    createdAt?: number;
    updatedAt?: number;
}

export interface PlacedItem extends Rect {
    id: string | number;
    cropId: string | number;
    rotation?: number;
    frameRotation?: number;
    frameShape?: string;
    customPoints?: Point2D[];
    borderWidth?: number;
    borderColor?: string;
    borderStyle?: BorderStyle;
    cropOffsetX?: number;
    cropOffsetY?: number;
    editingCorners?: boolean;
    phoneMockup?: boolean;
    phoneColor?: string;
    phoneStyle?: PhoneStyle;
}

export interface PanelAssignment {
    panelIndex: number;
    cropId: string | number | null;
    zoom: number;
    offsetX: number;
    offsetY: number;
}

export interface Composition {
    id: string | number;
    name: string;
    layoutId: string;
    pagePreset: string;
    pageWidth: number;
    pageHeight: number;
    margin: number;
    backgroundColor: string;
    assignments: PanelAssignment[];
    createdAt?: number;
    updatedAt?: number;
}

export interface Panel extends Rect {
    index: number;
    ratioX?: number;
    ratioY?: number;
    ratioWidth?: number;
    ratioHeight?: number;
}

export interface PanelRatio extends Rect {}

export interface PanelLayout {
    id: string;
    name: string;
    description: string;
    panels: PanelRatio[];
}

export interface PagePreset extends Dimensions {
    label: string;
}

export interface FrameShape {
    id: string;
    name: string;
    icon: string;
    points: Point2D[];
}

export interface FilterPreset {
    id: string;
    name: string;
    filter: string;
    description: string;
    vibe: string;
}

export interface StoredImage {
    id: string;
    data?: string;
    width?: number;
    height?: number;
    createdAt?: number;
    updatedAt?: number;
}

export interface SavedCanvas {
    id: string | number;
    name?: string;
    mode?: string;
    composition: Composition;
    placedItems?: PlacedItem[];
    createdAt?: number;
    updatedAt?: number;
}

export interface SaveCropsResponse {
    crops: Crop[];
    updatedAt: number;
}

export interface CreateCanvasResponse {
    canvasId: string;
}

export interface OperationSuccessResponse {
    success: boolean;
    message?: string;
}

export interface CanvasStorageAdapter {
    listCanvases(): Promise<SavedCanvas[]>;
    getCanvas(canvasId: string): Promise<SavedCanvas | null>;
    loadCanvas(canvasId: string): Promise<SavedCanvas | null>;
    createCanvas(options?: { name?: string; mode?: string; [key: string]: unknown }): Promise<CreateCanvasResponse & Partial<SavedCanvas>>;
    saveCanvas(canvasId: string, composition: Composition, placedItems?: PlacedItem[]): Promise<OperationSuccessResponse & Partial<SavedCanvas>>;
    deleteCanvas(canvasId: string): Promise<OperationSuccessResponse>;
}

export interface ImageStorageAdapter {
    listImages(): Promise<StoredImage[]>;
    getImage(imageId: string): Promise<StoredImage | null>;
    uploadImage(imageId: string, base64Data: string, metadata?: { width?: number; height?: number }): Promise<StoredImage>;
    saveImage(imageId: string, base64Data: string, metadata?: { width?: number; height?: number }): Promise<StoredImage & { success?: boolean; path?: string }>;
    deleteImage(imageId: string, deleteCrops?: boolean): Promise<OperationSuccessResponse & { cropsDeleted?: number }>;
}

export interface CropStorageAdapter {
    loadAllCrops(): Promise<Crop[]>;
    loadCrops(imageId: string): Promise<Crop[]>;
    getCrop(cropId: string | number): Promise<Crop | null>;
    saveCrops(imageId: string, crops: Partial<Crop>[]): Promise<SaveCropsResponse & { success?: boolean; count?: number; imageCreated?: boolean }>;
    updateCrop(imageId: string, cropId: string | number, updates: Partial<Crop>): Promise<Crop>;
    deleteCrop(imageId: string, cropId: string | number): Promise<OperationSuccessResponse>;
}

export interface StorageAdapter extends CanvasStorageAdapter, ImageStorageAdapter, CropStorageAdapter {}
