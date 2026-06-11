import { useState } from "react";
import InputField from "../components/InputField";
import Button from "../components/Button";

export default function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center bg-white dark:bg-gray-800 px-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">Login</h1>
                <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-md rounded-xl bg-white p-8 shadow-md border border-slate-100 space-y-8">
    
                    <InputField 
                        type="email" 
                        name="email" 
                        placeholder="Email Address"
                        value={formData.email}
                        onChange={handleChange}
                    />
    
                    <InputField 
                        type="password" 
                        name="password" 
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange} 
                    />
    
                    <Button 
                        type="submit" 
                        children={loading ? "Logging in..." : "Login"}
                    />
                </form>
        </div>
    )
}