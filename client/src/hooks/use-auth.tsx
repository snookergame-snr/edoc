import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode
} from "react";
import { useToast } from "@/hooks/use-toast";
import { create } from "zustand";

// Define the user type
interface User {
  id: number;
  username: string;
  displayName: string;
  department: string;
  role: string;
  email?: string;
  profileImage?: string;
}

// Define the auth store type
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the auth store
export const useAuth = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async (username: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await response.json();
      
      // Store the token in localStorage
      localStorage.setItem('authToken', data.token);
      
      set({ 
        user: data.user, 
        isAuthenticated: true,
        isLoading: false,
      });
      
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  logout: () => {
    // Remove the token from localStorage
    localStorage.removeItem('authToken');
    
    set({ 
      user: null, 
      isAuthenticated: false,
      isLoading: false,
    });
  }
}));

// Create an Auth Provider component that wraps the app
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { isLoading, login, logout } = useAuth();
  
  // On component mount, check if the user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        useAuth.setState({ isLoading: false });
        return;
      }
      
      // For the purpose of this demo, we'll just login as a hardcoded user
      // In a real app, you would verify the token with the server
      try {
        await login('somchai', 'somchai123');
      } catch (error) {
        toast({
          title: "เข้าสู่ระบบไม่สำเร็จ",
          description: (error as Error).message || "กรุณาเข้าสู่ระบบอีกครั้ง",
          variant: "destructive",
        });
        useAuth.setState({ isLoading: false });
      }
    };
    
    checkAuth();
  }, []);
  
  return children;
}
