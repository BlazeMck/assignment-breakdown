import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Welcome() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [isLightMode, setIsLightMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'light' : true;
    });

    useEffect(() => {
        const syncTheme = () => {
            const saved = localStorage.getItem('theme');
            const newMode = saved ? saved === 'light' : true;
            setIsLightMode(newMode);
            document.body.style.backgroundColor = newMode ? '#fdf6e3' : '#0a0a0a';
            document.body.style.transition = 'background-color 0.3s ease';
        };
        syncTheme();
        window.addEventListener('themeChanged', syncTheme);
        return () => window.removeEventListener('themeChanged', syncTheme);
    }, []);

    const styles = getStyles(isLightMode);

    return (
        <div style={styles.container}>
            <div style={styles.hero}>
                <h1 style={styles.heroTitle}>
                    {user?.uuid ? `Welcome back, ${user.firstName}!` : 'Conquer your assignments.'}
                </h1>
                <p style={styles.heroSubtitle}>
                    Stop stressing over deadlines. Paste your prompt, let AI break it into actionable tasks, and track your progress effortlessly.
                </p>
                
                <div style={styles.buttonRow}>
                    {/* If logged in, go to Dashboard. If not, go to Sign Up! */}
                    <button style={styles.primaryBtn} onClick={() => navigate(user?.uuid ? '/' : '/signup')}>
                        {user?.uuid ? 'Go to Dashboard' : 'Get Started'}
                    </button>
                    {!user?.uuid && (
                        <button style={styles.secondaryBtn} onClick={() => navigate('/login')}>
                            Login
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

const getStyles = (isLight) => ({
    container: { minHeight: 'calc(100vh - 57px)', backgroundColor: isLight ? '#fdf6e3' : '#0a0a0a', color: isLight ? '#3b3228' : '#fff', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column' },
    hero: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', textAlign: 'center', maxWidth: '700px', margin: '0 auto' },
    heroTitle: { fontSize: '48px', fontWeight: '800', lineHeight: '1.1', margin: '0 0 20px 0', letterSpacing: '-0.03em' },
    heroSubtitle: { fontSize: '18px', lineHeight: '1.6', color: isLight ? '#827568' : '#a3a3a3', margin: '0 0 40px 0' },
    buttonRow: { display: 'flex', gap: '16px' },
    primaryBtn: { backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '14px 32px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '16px', boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.3)' },
    secondaryBtn: { backgroundColor: 'transparent', color: isLight ? '#3b3228' : '#fff', border: `1px solid ${isLight ? '#d6c8b3' : '#232326'}`, padding: '14px 32px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '16px' }
});