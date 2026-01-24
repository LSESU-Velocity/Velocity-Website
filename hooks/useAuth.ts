import { useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout, checkAuth, LoginResponse } from '../lib/api';

interface UseAuthReturn {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (key: string) => Promise<LoginResponse>;
    logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check auth status on mount (via /api/me)
    useEffect(() => {
        checkAuth()
            .then((authenticated) => {
                setIsAuthenticated(authenticated);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    const login = useCallback(async (key: string): Promise<LoginResponse> => {
        const response = await apiLogin(key);

        if (response.valid) {
            setIsAuthenticated(true);
        }

        return response;
    }, []);

    const logout = useCallback(async () => {
        await apiLogout();
        setIsAuthenticated(false);
    }, []);

    return {
        isAuthenticated,
        isLoading,
        login,
        logout,
    };
}
