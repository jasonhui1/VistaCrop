export const FILTERS = [
    {
        id: 'normal',
        name: 'Normal',
        filter: 'none',
        description: 'No filter',
        vibe: 'bg-gray-500' // tailwind color class for the badge/button
    },
    {
        id: 'vintage',
        name: 'Vintage',
        filter: 'sepia(0.4) saturate(1.5) hue-rotate(-20deg) contrast(0.9)',
        description: 'Warm, retro aesthetic',
        vibe: 'bg-amber-600'
    },
    {
        id: 'noir',
        name: 'Noir',
        filter: 'grayscale(1) brightness(1.1) contrast(1.2)',
        description: 'Classic black and white',
        vibe: 'bg-zinc-700'
    },
    {
        id: 'vivid',
        name: 'Vivid',
        filter: 'saturate(2) contrast(1.1) brightness(1.05)',
        description: 'Punchy, vibrant colors',
        vibe: 'bg-pink-500'
    },
    {
        id: 'dramatic',
        name: 'Dramatic',
        filter: 'contrast(1.4) brightness(0.9) saturate(0.8)',
        description: 'High contrast, moody',
        vibe: 'bg-purple-900'
    },
    {
        id: 'cinema',
        name: 'Cinema',
        filter: 'sepia(0.2) contrast(1.1) brightness(1.1) saturate(1.2)',
        description: 'Cinematic teal/orange hint',
        vibe: 'bg-teal-600'
    },
    {
        id: 'faded',
        name: 'Fade',
        filter: 'opacity(0.8) brightness(1.2) sepia(0.1)',
        description: 'Soft, dreamy look',
        vibe: 'bg-blue-300'
    },
    {
        id: 'ghost',
        name: 'Ghost',
        filter: 'opacity(0.5) brightness(1.1) saturate(0.8)',
        description: 'See-through, ethereal look',
        vibe: 'bg-indigo-200'
    },
    {
        id: 'glass',
        name: 'Glass',
        filter: 'opacity(0.7) brightness(1.2) contrast(0.8) saturate(1.1)',
        description: 'Clear, modern transparency',
        vibe: 'bg-cyan-200'
    }
]
