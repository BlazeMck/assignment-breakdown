import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { registerUser } from '../../util/Auth.js';
import { useNavigate } from "react-router-dom";
import InputField from '../components/InputField.jsx';
import Button from '../components/Button.jsx';

export default function Signup() {
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    
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

    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) errors.push("8 characters");
        if (!/[A-Z]/.test(password)) errors.push("1 uppercase");
        if (!/[a-z]/.test(password)) errors.push("1 lowercase");
        if (!/[0-9]/.test(password)) errors.push("1 number");
        if (!/[!@#$%^&*]/.test(password)) errors.push("1 special (!@#$%^&*)");
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: ""}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First name required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name required";
        if (!formData.email.trim()) newErrors.email = "Email required";

        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) newErrors.password = `Needs: ${passwordErrors.join(", ")}`;
        
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setLoading(true);
            try {
                const newUser = await registerUser(formData.email, formData.password);
                if (newUser) {
                    login({firstName: formData.firstName, lastName: formData.lastName, email: newUser.email, uuid: newUser.uid});
                    navigate("/");
                }
            } catch (err) {
                 setErrors({ form: err.message });
            } finally {
                setLoading(false);
            }
        }
    };

    const styles = getStyles(isLightMode);

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit} style={styles.formCard}>
                <h1 style={styles.headerTitle}>Sign Up</h1>

                {errors.form && <div style={styles.errorBanner}>{errors.form}</div>}
                
                <InputField type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} error={errors.firstName} isLightMode={isLightMode} />
                <InputField type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} error={errors.lastName} isLightMode={isLightMode} />
                <InputField type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} error={errors.email} isLightMode={isLightMode} />
                <InputField type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} error={errors.password} isLightMode={isLightMode} />
                <InputField type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} error={errors.confirmPassword} isLightMode={isLightMode} />

                <Button type="submit" disabled={loading} isLightMode={isLightMode}>
                    {loading ? "Signing up..." : "Sign Up"}
                </Button>

                <p style={styles.switchText}>
                    Already have an account? <span style={styles.switchLink} onClick={() => navigate('/login')}>Login</span>
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