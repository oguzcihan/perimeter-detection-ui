import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import axios from "axios";

// Define the shape of User and AuthContext
interface User {
    username: string;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    login: () => { },
    logout: () => { },
    isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem("access_token"));

    useEffect(() => {
        // Check if token exists and set configured axios headers
        if (token) {
            localStorage.setItem("access_token", token);
            axios.defaults.headers.common["Authorization"] = "Bearer " + token;

            const storedUser = localStorage.getItem("user_data");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } else {
            localStorage.removeItem("access_token");
            localStorage.removeItem("user_data");
            delete axios.defaults.headers.common["Authorization"];
        }
    }, [token]);

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem("user_data", JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_data");
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};
