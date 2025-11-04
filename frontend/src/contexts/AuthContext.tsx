import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { User } from '@types';
import * as tokenService from '@services/tokenService';
import apiClient from '@services/apiClient';

interface AuthContextType {
  currentUser: User | null;
  isLoadingAuth: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setCurrentUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    console.log('[AuthContext] Iniciando login...', { email });
    setIsLoadingAuth(true);
    try {
      console.log('[AuthContext] Chamando API...');
      const response = await apiClient.post<{ user: User; token: string }>(
        '/auth/login',
        { email, password }
      );
      console.log('[AuthContext] Resposta recebida:', response);
      const { user, token } = response;
      tokenService.saveToken(token);
      setCurrentUser(user);
      console.log('[AuthContext] Login bem-sucedido!', user);
      return user;
    } catch (error) {
      console.error('[AuthContext] Erro no login:', error);
      setIsLoadingAuth(false);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const logout = useCallback(() => {
    tokenService.removeToken();
    setCurrentUser(null);
  }, []);

  const value: AuthContextType = {
    currentUser,
    isLoadingAuth,
    login,
    logout,
    setCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
