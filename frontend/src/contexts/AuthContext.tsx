import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
    const storedToken = localStorage.getItem('token');
        const storedUserStr = localStorage.getItem('user');
    
        if (!storedToken || !storedUserStr) {
          return;
        }

        try {
          const parsedUser = JSON.parse(storedUserStr);
          if (!parsedUser || typeof parsedUser !== 'object') {
            throw new Error('Invalid user data format');
          }

          // Type guard for User interface
          const isUser = (obj: any): obj is User => {
            return (
              obj &&
              typeof obj.id === 'number' &&
              typeof obj.email === 'string' &&
              typeof obj.name === 'string'
            );
          };

          if (!isUser(parsedUser)) {
            throw new Error('Invalid user data structure');
          }

      setToken(storedToken);
          setUser(parsedUser);
        } catch (parseError) {
          console.error('Failed to parse stored user data:', parseError);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Invalid stored data');
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError('Failed to restore session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
    }
    };

    initializeAuth();
  }, []);

  const getErrorMessage = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      // Try to get error message from response data
      const responseData = error.response?.data;
      if (responseData && typeof responseData === 'object' && 'message' in responseData) {
        return responseData.message as string;
      }
      // Fallback to status text
      if (error.response?.statusText) {
        return error.response.statusText;
      }
    }
    // Default error message
    return error instanceof Error ? error.message : 'An unexpected error occurred';
  };

  const login = async (email: string, password: string) => {
    try {
    setIsLoading(true);
    setError(null);
      const response = await authApi.login(email, password);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
    setIsLoading(true);
    setError(null);
      const response = await authApi.register(name, email, password);
      setToken(response.token);
      setUser(response.user);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        register, 
        logout, 
        isAuthenticated: !!token,
        isLoading, 
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
