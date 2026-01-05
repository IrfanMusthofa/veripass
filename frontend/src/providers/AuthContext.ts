import { createContext } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { address: string } | null;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
