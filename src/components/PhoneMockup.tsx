import { ReactNode, CSSProperties } from 'react'
import { memo } from 'react'

export interface PhoneMockupProps {
    children?: ReactNode
    color?: string
    style?: 'modern' | 'classic'
    landscape?: boolean
}

const PhoneMockup = memo(function PhoneMockup({ children, color = '#1a1a1a', style = 'modern', landscape = false }: PhoneMockupProps) {
    // Phone frame proportions (relative to container)
    const bezelWidth = style === 'modern' ? 3 : 6 // percentage
    const topBezel = style === 'modern' ? 6 : 12 // percentage
    const bottomBezel = style === 'modern' ? 6 : 14 // percentage
    const sideBezel = bezelWidth

    // Corner radius
    const outerRadius = style === 'modern' ? 44 : 36
    const screenRadius = style === 'modern' ? 32 : 16

    return (
        <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Main Phone Container */}
            <div
                className="relative shadow-2xl transition-all duration-300 flex flex-col"
                style={{
                    backgroundColor: color,
                    borderRadius: `${outerRadius}px`,
                    padding: `${topBezel}% ${sideBezel}% ${bottomBezel}% ${sideBezel}%`,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 2px rgba(255, 255, 255, 0.1)',
                    aspectRatio: landscape ? '19.5/9' : '9/19.5',
                    maxHeight: '100%',
                    maxWidth: '100%'
                }}
            >
                {/* Dynamic Island / Notch */}
                {style === 'modern' && !landscape && (
                    <div className="absolute top-[2.5%] left-1/2 -translate-x-1/2 w-[30%] h-[3.5%] bg-black rounded-full z-20 flex items-center justify-end px-2">
                        {/* Camera lens indicator */}
                        <div className="w-2.5 h-2.5 rounded-full bg-[#111] border border-[#222] flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-[#091526]" />
                        </div>
                    </div>
                )}

                {/* Speaker Grille (Classic style) */}
                {style === 'classic' && !landscape && (
                    <div className="absolute top-[4%] left-1/2 -translate-x-1/2 w-[20%] h-[1%] bg-[#333] rounded-full z-20" />
                )}

                {/* Side Buttons - Power/Volume */}
                {!landscape ? (
                    <>
                        {/* Power button (Right) */}
                        <div
                            className="absolute -right-[3px] top-[20%] w-[3px] h-[10%] rounded-r-sm"
                            style={{ backgroundColor: color, filter: 'brightness(0.8)' }}
                        />
                        {/* Volume Up (Left) */}
                        <div
                            className="absolute -left-[3px] top-[18%] w-[3px] h-[7%] rounded-l-sm"
                            style={{ backgroundColor: color, filter: 'brightness(0.8)' }}
                        />
                        {/* Volume Down (Left) */}
                        <div
                            className="absolute -left-[3px] top-[27%] w-[3px] h-[7%] rounded-l-sm"
                            style={{ backgroundColor: color, filter: 'brightness(0.8)' }}
                        />
                    </>
                ) : (
                    <>
                        {/* Power button (Top right in landscape) */}
                        <div
                            className="absolute top-[-3px] right-[20%] h-[3px] w-[10%] rounded-t-sm"
                            style={{ backgroundColor: color, filter: 'brightness(0.8)' }}
                        />
                        {/* Volume buttons (Bottom in landscape) */}
                        <div
                            className="absolute bottom-[-3px] left-[18%] h-[3px] w-[7%] rounded-b-sm"
                            style={{ backgroundColor: color, filter: 'brightness(0.8)' }}
                        />
                        <div
                            className="absolute bottom-[-3px] left-[27%] h-[3px] w-[7%] rounded-b-sm"
                            style={{ backgroundColor: color, filter: 'brightness(0.8)' }}
                        />
                    </>
                )}

                {/* Home Indicator (Modern style) */}
                {style === 'modern' && (
                    <div
                        className={`absolute ${landscape ? 'right-[1.5%] top-1/2 -translate-y-1/2 w-[0.8%] h-[25%]' : 'bottom-[1.5%] left-1/2 -translate-x-1/2 w-[35%] h-[0.8%]'
                            } bg-white/40 rounded-full z-20`}
                    />
                )}

                {/* Home Button (Classic style) */}
                {style === 'classic' && !landscape && (
                    <div className="absolute bottom-[2.5%] left-1/2 -translate-x-1/2 w-[10%] aspectRatio-1 rounded-full border-2 border-[#444] z-20" />
                )}

                {/* Screen Area (Children rendered here) */}
                <div
                    className="relative w-full h-full overflow-hidden bg-black flex items-center justify-center"
                    style={{
                        borderRadius: `${screenRadius}px`,
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    )
})

export default PhoneMockup
