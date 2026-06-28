import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext";
import { getUserBreakdowns } from "../api/assignments";

export default function Navbar() {
    const { user, logout } = useAuth();

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
        
        syncTheme(); // Sync on initial mount
        window.addEventListener('themeChanged', syncTheme); // Listen for Navbar toggles
        
        return () => window.removeEventListener('themeChanged', syncTheme);
    }, []);

    useEffect(() => {
        if (!user?.uuid) return;
        getUserBreakdowns(user.uuid)
            .then((breakdowns) => {
                console.log(`Assignments for user ${user.uuid}:`, breakdowns);
                breakdowns.forEach((a) => {
                    console.log(`  Assignment: "${a.title}" (due ${a.due_date})`);
                    if (a.tasks) {
                        a.tasks.forEach((t) =>
                            console.log(`    ${t.priority}. ${t.description} [effort ${t.time_estimate}, ${t.status}]`),
                        );
                    }
                });
            })
            .catch((err) => console.error("Failed to load user breakdowns:", err));
    }, [user?.uuid]);

    const styles = getStyles(isLightMode);

    return (
        <nav style={styles.nav}>
            <div style={styles.brand}>
                <Link to={user ? "/" : "/login"} style={styles.logo}>Tracker</Link>
            </div>
            
            <div style={styles.linkContainer}>
                <Link to={user ? "/" : "/welcome"} style={styles.link}>Home</Link>
                
                {user ? (
                    <>
                        <Link to="/submit" style={styles.link}>Submit Assignment</Link>
                        <Link to="/view" style={styles.link}>View Assignments</Link>
                        <button onClick={logout} style={styles.dangerButton}>Sign Out</button>
                    </>
                ) : (
                    <>
                        <Link to="/login" style={styles.link}>Login</Link>
                        <Link to="/signup" style={styles.primaryButton}>Sign Up</Link>
                    </>
                )}

                <button 
                    onClick={() => {
                        const newMode = !isLightMode;
                        localStorage.setItem('theme', newMode ? 'light' : 'dark');
                        window.dispatchEvent(new Event('themeChanged')); // Tell all components to update
                    }} 
                    style={styles.themeToggleBtn} 
                    type="button"
                >
                    {isLightMode ? '☾ Dark' : '☀ Light'}
                </button>
            </div>
        </nav>
    );
}

const getStyles = (isLight) => ({
  nav: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '16px 40px', 
    backgroundColor: isLight ? '#f4ecd8' : '#141416', 
    borderBottom: `1px solid ${isLight ? '#e3d8c3' : '#232326'}` 
  },
  brand: { 
    fontWeight: '700', 
    fontSize: '18px', 
    letterSpacing: '-0.02em' 
  },
  logo: { 
    color: isLight ? '#3b3228' : '#ffffff', 
    textDecoration: 'none' 
  },
  linkContainer: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '28px' 
  },
  link: { 
    color: isLight ? '#5a4d3f' : '#a3a3a3', 
    textDecoration: 'none', 
    fontSize: '14px', 
    fontWeight: '500' 
  },
  primaryButton: { 
    backgroundColor: '#6366f1', 
    color: '#ffffff', 
    textDecoration: 'none', 
    padding: '8px 16px', 
    borderRadius: '8px', 
    fontSize: '14px', 
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer'
  },
  dangerButton: { 
    backgroundColor: isLight ? '#fee2e2' : '#272533', 
    color: isLight ? '#991b1b' : '#fca5a5', 
    textDecoration: 'none', 
    padding: '8px 16px', 
    borderRadius: '8px', 
    fontSize: '14px', 
    fontWeight: '600',
    border: `1px solid ${isLight ? '#f87171' : '#3f2c2c'}`,
    cursor: 'pointer'
  },
  themeToggleBtn: { 
    backgroundColor: 'transparent', 
    color: isLight ? '#5a4d3f' : '#a3a3a3', 
    border: `1px solid ${isLight ? '#d6c8b3' : '#232326'}`, 
    padding: '6px 12px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontSize: '14px', 
    transition: 'all 0.2s',
    marginLeft: '12px'
  }
});