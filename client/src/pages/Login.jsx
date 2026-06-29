import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../../util/Auth.js";
import InputField from "../components/InputField";
import Button from "../components/Button";

export default function Login() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    
    const [isLightMode, setIsLightMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved === 'light' : true;
    });

    const { login } = useAuth();
    const navigate = useNavigate();

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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: ""}));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.password) newErrors.password = "Password is required";
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        setErrors(newErrors);
        
        if (Object.keys(newErrors).length === 0) {
            setLoading(true);
            try {
                const user = await loginUser(formData.email, formData.password);
                const displayName = user.displayName || user.email.split('@')[0];
                login({ uuid: user.uid, email: user.email, firstName: displayName, lastName: "" });
                navigate("/");
            } catch (error) {
                setErrors({ form: error.message });
            } finally {
                setLoading(false);
            }
        }
    };

    const styles = getStyles(isLightMode);

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.formCard}>
                <h1 style={styles.headerTitle}>Login</h1>
                
                {errors.form && <div style={styles.errorBanner}>{errors.form}</div>}
                
                <InputField type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} error={errors.email} isLightMode={isLightMode} />
                <InputField type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} error={errors.password} isLightMode={isLightMode} />

                <Button type="submit" disabled={loading} isLightMode={isLightMode}>
                    {loading ? "Logging in..." : "Login"}
                </Button>

                <p style={styles.switchText}>
                    Don't have an account? <span style={styles.switchLink} onClick={() => navigate('/signup')}>Sign up</span>
                </p>
            </form>
        </div>
    );
}

const getStyles = (isLight) => ({
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 57px)', padding: '0 16px', backgroundColor: isLight ? '#fdf6e3' : '#0a0a0a', color: isLight ? '#3b3228' : '#fff', transition: 'all 0.3s ease', fontFamily: 'Inter, system-ui, sans-serif' },
    formCard: { display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '448px', gap: '20px', backgroundColor: isLight ? '#f4ecd8' : '#141416', border: `1px solid ${isLight ? '#e3d8c3' : '#232326'}`, borderRadius: '14px', padding: '32px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
    headerTitle: { fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', margin: '0 0 8px 0' },
    errorBanner: { padding: '12px', backgroundColor: '#451a1a', border: '1px solid #7f1d1d', color: '#fca5a5', fontSize: '14px', borderRadius: '8px' },
    switchText: { textAlign: 'center', fontSize: '14px', color: isLight ? '#827568' : '#a3a3a3', margin: 0 },
    switchLink: { color: '#6366f1', cursor: 'pointer', fontWeight: '600' }
});