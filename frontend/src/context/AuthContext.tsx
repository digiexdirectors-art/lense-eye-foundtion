import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Define TS Interfaces
interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'doctor' | 'receptionist' | 'accountant';
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  loading: boolean;
}

// Create Context
const AuthContext = createContext<AuthContextType | null>(null);

// Context Provider Component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for saved token on initial load
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      
      if (savedToken) {
        try {
          // If we have a token, we should fetch the user's latest profile to ensure it's still valid
          const config = {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          };
          
          const { data } = await axios.get('/api/users/profile', config);
          
          setUser(data.data);
          setToken(savedToken);
        } catch (error) {
          // If token fetch fails (e.g., expired), clear it out
          console.error("Token verification failed", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
