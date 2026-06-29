import type React from "react";
import { createContext, useContext, useState, ReactNode } from "react";

interface User {
    firstName: string;
    lastName: string;
    email: string;
    uuid: string;
}

interface AuthContextType {
    user: User | null
    signup: () => void
    login: (userData: User) => void
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: {children: ReactNode}) {
    const [user, setUser] = useState<User | null>(null)

    const login = (userData: User) => {
        setUser(userData);
    }

    const logout = () => {
        setUser(null);
    }

    const signup = () => {
        // Add user to supabase
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, signup }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}