import React from 'react';

export default function Button({ type, children, disabled, name, isLightMode = true, onClick }) {
    return (
        <button
            type={type}
            disabled={disabled}
            name={name}
            onClick={onClick}
            style={{
                width: '100%',
                padding: '14px',
                backgroundColor: disabled ? '#4b5563' : '#6366f1',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: '600',
                fontFamily: 'Inter, system-ui, sans-serif',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: !disabled ? '0 4px 6px -1px rgba(99, 102, 241, 0.3)' : 'none',
                marginTop: '8px'
            }}
        >
            {children}
        </button>
    );
}