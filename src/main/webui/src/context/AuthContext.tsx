import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AuthSession } from '../types';
import { getStoredSession, saveSession as saveSessionToStorage, clearSession as clearSessionFromStorage } from '../services/api';

interface AuthContextType {
    session: AuthSession | null;
    isAuthenticated: boolean;
    login: (session: AuthSession) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Tenta carregar a sessão do localStorage na inicialização
        const storedSession = getStoredSession();
        if (storedSession) {
            setSession(storedSession);
        }
        setIsLoading(false);
    }, []);

    const login = (newSession: AuthSession) => {
        setSession(newSession);
        saveSessionToStorage(newSession);
    };

    const logout = () => {
        setSession(null);
        clearSessionFromStorage();
    };

    // Não renderiza nada até que a sessão inicial seja carregada
    if (isLoading) {
        return null;
    }

    return (
        <AuthContext.Provider value={{ session, isAuthenticated: !!session, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
