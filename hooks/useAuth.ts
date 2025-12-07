import { useState, useEffect, useCallback } from 'react';
import { login as apiLogin, LoginResponse } from '../lib/api';

const AUTH_KEY = 'velocity_auth_key';

interface UseAuthReturn {
    isAuthenticated: boolean;
    isLoading: boolean;
    authKey: string | null;
    login: (key: string) => Promise<LoginResponse>;
    logout: () => void;
}

export function useAuth(): UseAuthReturn {
    const [authKey, setAuthKey] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load key from localStorage on mount
    useEffect(() => {
        const storedKey = localStorage.getItem(AUTH_KEY);
        if (storedKey) {
            setAuthKey(storedKey);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (key: string): Promise<LoginResponse> => {
        const response = await apiLogin(key);

        if (response.valid) {
            localStorage.setItem(AUTH_KEY, key);
            setAuthKey(key);
        }

        return response;
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(AUTH_KEY);
        setAuthKey(null);
    }, []);

    return {
        isAuthenticated: !!authKey,
        isLoading,
        authKey,
        login,
        logout,
    };
}
