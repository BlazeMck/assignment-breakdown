import React from 'react';

export default function InputField({ type, name, placeholder, value, onChange, error, isLightMode = true }) {
    const baseStyle = {
        width: '100%',
        padding: '14px 16px',
        fontSize: '15px',
        fontFamily: 'Inter, system-ui, sans-serif',
        borderRadius: '10px',
        outline: 'none',
        border: '1.5px solid',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box',
    };

    const themeStyle = isLightMode ? {
        backgroundColor: '#fdf6e3',
        color: '#3b3228',
        borderColor: error ? '#ef4444' : '#d6c8b3',
    } : {
        backgroundColor: '#1e1e1e', // Softer than pure black, stands out against the card
        color: '#e5e7eb',
        borderColor: error ? '#ef4444' : '#333', // Visible border
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Injected CSS to control placeholder colors and the focus ring */}
            <style>{`
                input::placeholder {
                    color: ${isLightMode ? '#827568' : '#737373'} !important;
                    opacity: 1;
                }
                input:focus {
                    border-color: #6366f1 !important;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                }
            `}</style>
            <input 
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                style={{ ...baseStyle, ...themeStyle }}
            />
            {error && <span style={{ fontSize: '13px', color: '#ef4444', marginLeft: '4px' }}>{error}</span>}
        </div>
    );
}