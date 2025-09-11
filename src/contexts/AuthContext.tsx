import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  signIn: (credentials: any) => Promise<void>;
  signUp: (credentials: any) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start as true to check user status
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await api.get('/users/me');
        // The backend returns the user object directly in the `data` field
        if (data.status === 'success' && data.data) {
          setUser({ id: data.data.id, email: data.data.email });
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  const signIn = async (credentials: any) => {
    try {
      const { data } = await api.post('/users/signin', credentials);
      if (data.status === 'success' && data.data) {
        setUser({ id: data.data.id, email: data.data.email });
        setIsAuthenticated(true);
        toast({ title: "Success", description: "Signed in successfully." });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Sign in failed:', error);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.response?.data?.detail || "An unexpected error occurred.",
      });
      throw error;
    }
  };

  const signUp = async (credentials: any) => {
    try {
      const { data } = await api.post('/users/signup', credentials);
      if (data.status === 'success' && data.data) {
        setUser({ id: data.data.id, email: data.data.email });
        setIsAuthenticated(true);
        toast({ title: "Success", description: "Account created successfully." });
        navigate('/');
      }
    } catch (error: any) {
      console.error('Sign up failed:', error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.response?.data?.detail || "An unexpected error occurred.",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await api.post('/users/signout');
    } catch (error) {
      console.error('Sign out failed on server:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/sign-in');
      toast({ title: "Signed Out", description: "You have been successfully signed out." });
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, signIn, signUp, signOut, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
