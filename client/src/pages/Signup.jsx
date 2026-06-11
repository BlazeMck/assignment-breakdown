import React, { useState } from 'react';
import InputField from '../components/InputField.jsx';
import Button from '../components/Button.jsx';


function Signup() {

    // Data and state management
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Validation logic
    const validatePassword = (password) => {
        const errors = [];
        if (password.length < 8) errors.push("At least 8 characters");
        if (!/[A-Z]/.test(password)) errors.push("One uppercase letter");
        if (!/[a-z]/.test(password)) errors.push("One lowercase letter");
        if (!/[0-9]/.test(password)) errors.push("One number");
        if (!/[!@#$%^&*]/.test(password)) errors.push("One special character (!@#$%^&*)");
        return errors;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = "First name required";
        if (!formData.lastName.trim()) newErrors.lastName = "Last name required";
        if (!formData.email.trim()) newErrors.email = "Email required";

        const passwordErrors = validatePassword(formData.password);
        if (passwordErrors.length > 0) {
            newErrors.password = `Password must have: ${passwordErrors.join(", ")}`;
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);

        // If no errors, proceed with signup logic
        if (Object.keys(newErrors).length === 0) {
            setLoading(true);
            // TODO: Handle signup API call
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-white dark:bg-gray-800 px-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Sign Up</h1>
            <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-md rounded-xl bg-white p-8 shadow-md border border-slate-100 space-y-8">
                
                <InputField 
                    type="text" 
                    name="firstName" 
                    placeholder="First Name" 
                    value={formData.firstName} 
                    onChange={handleChange} 
                    error={errors.firstName} 
                />

                <InputField 
                    type="text" 
                    name="lastName" 
                    placeholder="Last Name" 
                    value={formData.lastName} 
                    onChange={handleChange} 
                    error={errors.lastName} 
                />

                <InputField 
                    type="email" 
                    name="email" 
                    placeholder="Email Address" 
                    value={formData.email} 
                    onChange={handleChange} 
                    error={errors.email} 
                />

                <InputField 
                    type="password" 
                    name="password" 
                    placeholder="Password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    error={errors.password} 
                />

                <InputField 
                    type="password" 
                    name="confirmPassword" 
                    placeholder="Confirm Password" 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                    error={errors.confirmPassword} 
                />

                <Button 
                    type="submit" 
                    disabled={loading}
                    children={loading ? "Signing up..." : "Sign Up"}
                    className = "w-full"
                />
            </form>
        </div>
    );
}

export default Signup;