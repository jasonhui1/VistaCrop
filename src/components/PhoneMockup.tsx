import { ReactNode, CSSProperties } from 'react'
import { memo } from 'react'

export interface PhoneMockupProps {
    children?: ReactNode
    color?: string
    style?: 'modern' | 'classic'
    landscape?: boolean
}

function getElementStyle(type: 'notch' | 'speaker' | 'homeIndicator' | 'homeButton' | 'power' | 'volUp' | 'volDown', landscape: boolean, color: string): CSSProperties {
    switch (type) {
        case 'notch':
            return landscape ? {
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
            }
        case 'speaker':
            return landscape ? {
                position: 'absolute',
                left: '4%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1%',
                height: '15%',
                backgroundColor: '#333',
                borderRadius: '4px'
            } : {
                position: 'absolute',
                top: '4%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '15%',
                height: '1%',
                backgroundColor: '#333',
                borderRadius: '4px'
            }
        case 'homeIndicator':
            return landscape ? {
                position: 'absolute',
                right: '1.5%',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1%',
                height: '35%',
                backgroundColor: '#555',
                borderRadius: '4px'
            } : {
                position: 'absolute',
                bottom: '1.5%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '35%',
                height: '1%',
                backgroundColor: '#555',
                borderRadius: '4px'
            }
        case 'homeButton':
            return landscape ? {
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
            }
        case 'power':
            return landscape ? {
                position: 'absolute',
                top: '-2px',
                left: '20%',
                height: '3px',
                width: '8%',
                backgroundColor: color,
                borderRadius: '2px 2px 0 0',
                boxShadow: '0 -1px 3px rgba(0,0,0,0.3)'
            } : {
                position: 'absolute',
                right: '-2px',
                top: '20%',
                width: '3px',
                height: '8%',
                backgroundColor: color,
                borderRadius: '0 2px 2px 0',
                boxShadow: '1px 0 3px rgba(0,0,0,0.3)'
            }
        case 'volUp':
            return landscape ? {
                position: 'absolute',
                bottom: '-2px',
                left: '15%',
                height: '3px',
                width: '5%',
                backgroundColor: color,
                borderRadius: '0 0 2px 2px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            } : {
                position: 'absolute',
                left: '-2px',
                top: '15%',
                width: '3px',
                height: '5%',
                backgroundColor: color,
                borderRadius: '2px 0 0 2px',
                boxShadow: '-1px 0 3px rgba(0,0,0,0.3)'
            }
        case 'volDown':
            return landscape ? {
                position: 'absolute',
                bottom: '-2px',
                left: '25%',
                height: '3px',
                width: '10%',
                backgroundColor: color,
                borderRadius: '0 0 2px 2px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
            } : {
                position: 'absolute',
                left: '-2px',
                top: '25%',
                width: '3px',
                height: '10%',
                backgroundColor: color,
                borderRadius: '2px 0 0 2px',
                boxShadow: '-1px 0 3px rgba(0,0,0,0.3)'
            }
    }
}

const PhoneMockup = memo(function PhoneMockup({ children, color = '#1a1a1a', style = 'modern', landscape = false }: PhoneMockupProps) {
    const bezelWidth = style === 'modern' ? 3 : 6
    const topBezel = style === 'modern' ? 6 : 12
    const bottomBezel = style === 'modern' ? 6 : 12
    const cornerRadius = style === 'modern' ? 12 : 8

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
            {}
            {style === 'modern' && (
                <div style={getElementStyle('notch', landscape, color)}>
                    {}
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

            {}
            {style === 'classic' && (
                <div style={getElementStyle('speaker', landscape, color)} />
            )}

            {}
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

            {}
            {style === 'modern' && (
                <div style={getElementStyle('homeIndicator', landscape, color)} />
            )}

            {}
            {style === 'classic' && (
                <div style={getElementStyle('homeButton', landscape, color)} />
            )}

            {}
            <div style={getElementStyle('power', landscape, color)} />
            <div style={getElementStyle('volUp', landscape, color)} />
            <div style={getElementStyle('volDown', landscape, color)} />
        </div>
    )
})

export default PhoneMockup
