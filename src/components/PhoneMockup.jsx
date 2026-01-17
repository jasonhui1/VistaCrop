import { memo } from 'react'

/**
 * PhoneMockup Component - Renders a phone frame around content
 * Creates a realistic phone bezel effect with the image as the screen
 * When landscape=true, buttons are repositioned to sides (phone held sideways)
 */
const PhoneMockup = memo(function PhoneMockup({ children, color = '#1a1a1a', style = 'modern', landscape = false }) {
    // Phone frame proportions (relative to container)
    const bezelWidth = style === 'modern' ? 3 : 6 // percentage
    const topBezel = style === 'modern' ? 6 : 12 // percentage  
    const bottomBezel = style === 'modern' ? 6 : 12 // percentage
    const cornerRadius = style === 'modern' ? 12 : 8 // percentage

    // Swap padding for landscape mode
    const padding = landscape
        ? `${bezelWidth}% ${bottomBezel}% ${bezelWidth}% ${topBezel}%`
        : `${topBezel}% ${bezelWidth}% ${bottomBezel}% ${bezelWidth}%`

    return (
        <div
            className="phone-mockup"
            style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: landscape ? 'row' : 'column',
                backgroundColor: color,
                borderRadius: `${cornerRadius}%`,
                padding: padding,
                boxShadow: `
                    0 0 0 2px rgba(255,255,255,0.1),
                    0 4px 20px rgba(0,0,0,0.5),
                    inset 0 2px 10px rgba(255,255,255,0.05)
                `,
                boxSizing: 'border-box'
            }}
        >
            {/* Modern notch - top for portrait, left for landscape */}
            {style === 'modern' && (
                <div
                    style={landscape ? {
                        // Landscape: notch on left side
                        position: 'absolute',
                        left: '2%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '2.5%',
                        height: '30%',
                        backgroundColor: '#000',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    } : {
                        // Portrait: notch on top
                        position: 'absolute',
                        top: '2%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '30%',
                        height: '2.5%',
                        backgroundColor: '#000',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {/* Camera dot */}
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#1a1a2e',
                            borderRadius: '50%',
                            boxShadow: 'inset 0 0 3px rgba(0,100,255,0.5)'
                        }}
                    />
                </div>
            )}

            {/* Classic phone speaker */}
            {style === 'classic' && (
                <div
                    style={landscape ? {
                        // Landscape: speaker on left
                        position: 'absolute',
                        left: '4%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '1%',
                        height: '15%',
                        backgroundColor: '#333',
                        borderRadius: '4px'
                    } : {
                        // Portrait: speaker on top
                        position: 'absolute',
                        top: '4%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '15%',
                        height: '1%',
                        backgroundColor: '#333',
                        borderRadius: '4px'
                    }}
                />
            )}

            {/* Screen area */}
            <div
                style={{
                    flex: 1,
                    backgroundColor: '#000',
                    borderRadius: style === 'modern' ? '4%' : '2%',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {children}
            </div>

            {/* Modern home indicator - bottom for portrait, right for landscape */}
            {style === 'modern' && (
                <div
                    style={landscape ? {
                        // Landscape: indicator on right
                        position: 'absolute',
                        right: '1.5%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '1%',
                        height: '35%',
                        backgroundColor: '#555',
                        borderRadius: '4px'
                    } : {
                        // Portrait: indicator on bottom
                        position: 'absolute',
                        bottom: '1.5%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '35%',
                        height: '1%',
                        backgroundColor: '#555',
                        borderRadius: '4px'
                    }}
                />
            )}

            {/* Classic home button */}
            {style === 'classic' && (
                <div
                    style={landscape ? {
                        // Landscape: button on right
                        position: 'absolute',
                        right: '3%',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: '12%',
                        aspectRatio: '1',
                        backgroundColor: '#222',
                        borderRadius: '50%',
                        border: '2px solid #333',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                    } : {
                        // Portrait: button on bottom
                        position: 'absolute',
                        bottom: '3%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '12%',
                        aspectRatio: '1',
                        backgroundColor: '#222',
                        borderRadius: '50%',
                        border: '2px solid #333',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                    }}
                />
            )}

            {/* Side buttons - move to top/bottom in landscape */}
            {/* Power button */}
            <div
                style={landscape ? {
                    // Landscape: power on top
                    position: 'absolute',
                    top: '-2px',
                    left: '20%',
                    height: '3px',
                    width: '8%',
                    backgroundColor: color,
                    borderRadius: '2px 2px 0 0',
                    boxShadow: '0 -1px 3px rgba(0,0,0,0.3)'
                } : {
                    // Portrait: power on right
                    position: 'absolute',
                    right: '-2px',
                    top: '20%',
                    width: '3px',
                    height: '8%',
                    backgroundColor: color,
                    borderRadius: '0 2px 2px 0',
                    boxShadow: '1px 0 3px rgba(0,0,0,0.3)'
                }}
            />
            {/* Volume up */}
            <div
                style={landscape ? {
                    // Landscape: vol on bottom
                    position: 'absolute',
                    bottom: '-2px',
                    left: '15%',
                    height: '3px',
                    width: '5%',
                    backgroundColor: color,
                    borderRadius: '0 0 2px 2px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                } : {
                    // Portrait: vol on left
                    position: 'absolute',
                    left: '-2px',
                    top: '15%',
                    width: '3px',
                    height: '5%',
                    backgroundColor: color,
                    borderRadius: '2px 0 0 2px',
                    boxShadow: '-1px 0 3px rgba(0,0,0,0.3)'
                }}
            />
            {/* Volume down */}
            <div
                style={landscape ? {
                    // Landscape: vol on bottom
                    position: 'absolute',
                    bottom: '-2px',
                    left: '25%',
                    height: '3px',
                    width: '10%',
                    backgroundColor: color,
                    borderRadius: '0 0 2px 2px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                } : {
                    // Portrait: vol on left
                    position: 'absolute',
                    left: '-2px',
                    top: '25%',
                    width: '3px',
                    height: '10%',
                    backgroundColor: color,
                    borderRadius: '2px 0 0 2px',
                    boxShadow: '-1px 0 3px rgba(0,0,0,0.3)'
                }}
            />
        </div>
    )
})

export default PhoneMockup
