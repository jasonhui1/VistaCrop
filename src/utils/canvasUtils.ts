import { Crop } from '../types'
import { FILTERS } from './filters'

export function getFilterStyle(filterName?: string): string {
    if (!filterName) return 'none'
    const filter = FILTERS.find(f => f.id === filterName)
    return filter ? filter.filter : 'none'
}

export function getCropById(crops: Crop[], cropId: string | number): Crop | undefined {
    return crops.find(c => String(c.id) === String(cropId))
}
