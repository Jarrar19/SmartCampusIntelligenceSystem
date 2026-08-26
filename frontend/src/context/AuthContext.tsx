import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, PublicConfig } from '../types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  config: PublicConfig | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: any) => Promise<{ success: boolean; verificationToken?: string }>;
  logout: () => void;
  verifyEmail: (token: string) => Promise<boolean>;
  updateUser: (updatedUser: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { success, error } = useToast();

  // Load public config & restore session on initial mount
  useEffect(() => {
    async function initAuth() {
      try {
        const configRes = await api.get('/config');
        if (configRes.data.success) {
          setConfig(configRes.data.data);
        }

        const token = localStorage.getItem('token');
        if (token) {
          const meRes = await api.get('/auth/me');
          if (meRes.data.success) {
            setUser(meRes.data.data);
          }
        }
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        const { user: loggedInUser, accessToken } = res.data.data;
        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        success(`Welcome back, ${loggedInUser.fullName}!`);
        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check credentials.';
      error(msg);
      return false;
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      if (res.data.success) {
        const { user: registeredUser, accessToken, verificationToken } = res.data.data;
        if (accessToken) {
          localStorage.setItem('token', accessToken);
          localStorage.setItem('user', JSON.stringify(registeredUser));
          setUser(registeredUser);
        }
        success(res.data.message);
        return { success: true, verificationToken };
      }
      return { success: false };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Registration failed.';
      error(msg);
      return { success: false };
    }
  };

  const verifyEmail = async (token: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/verify-email', { token });
      if (res.data.success) {
        success(res.data.message);
        if (user) {
          setUser({ ...user, isVerified: true });
        }
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.response?.data?.message || 'Verification failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    success('Logged out successfully');
  };

  const updateUser = (updatedUser: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updatedUser };
      setUser(merged);
      localStorage.setItem('user', JSON.stringify(merged));
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        config,
        isLoading,
        login,
        register,
        logout,
        verifyEmail,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
