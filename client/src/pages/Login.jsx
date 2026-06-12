import { useState } from "react";
import { useNavigate } from "react-router"
import { useAuth } from "../context/AuthContext"
import { loginUser } from "../../util/Auth.js";
import InputField from "../components/InputField";
import Button from "../components/Button";

export default function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));

        // Clear error for the field on change
        setErrors((prev) => ({ ...prev, [name]: ""}));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
            
        }
        if (!formData.password) {
            newErrors.password = "Password is required";
        }
        return newErrors;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            try {
                const user = await loginUser(formData.email, formData.password);

                login({
                    uuid: user.uid,
                    email: user.email,
                    firstName: "User", // Placeholder until supabase can be accessed to retrieve
                    lastName: ""
                })

                navigate("/")
            } catch (error) {
                setErrors({ form: error.message });
            } finally {
                setLoading(false)
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-white dark:bg-gray-800 px-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Login</h1>
                <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-md rounded-xl bg-white p-8 shadow-md border border-slate-100 space-y-8">
    
                    {errors.form && (
                        <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md border border-red-200">
                            {errors.form}
                        </div>
                    )}
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
    
                    <Button 
                        type="submit"
                        name="login" 
                        children={loading ? "Logging in..." : "Login"}
                    />
                </form>
        </div>
    )
}