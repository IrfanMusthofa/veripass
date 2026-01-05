import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { api, getToken, setToken, clearToken, ApiError } from '@/lib/api';
import { AuthContext } from './AuthContext';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { address: string } | null;
  error: string | null;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  // Check existing token on mount and when address/connection changes
  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      // Handle disconnection
      if (!isConnected) {
        clearToken();
        if (isMounted) {
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
          });
        }
        return;
      }

      const token = getToken();
      if (!token || !address) {
        if (isMounted) {
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
          });
        }
        return;
      }

      try {
        const response = await api.getCurrentUser();
        if (!isMounted) return;

        // Verify token is for current wallet
        if (response.data.address.toLowerCase() === address.toLowerCase()) {
          setState({
            isAuthenticated: true,
            isLoading: false,
            user: { address: response.data.address },
            error: null,
          });
        } else {
          // Token is for different address, clear it
          clearToken();
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
          });
        }
      } catch {
        if (!isMounted) return;
        // Token invalid or expired
        clearToken();
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
        });
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [address, isConnected]);

  const signIn = useCallback(async () => {
    if (!address) {
      setState(s => ({ ...s, error: 'Please connect your wallet first' }));
      return;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      // Step 1: Get nonce from backend
      const nonceResponse = await api.getNonce(address);
      const nonce = nonceResponse.data.nonce;

      // Step 2: Create message to sign
      const timestamp = new Date().toISOString();
      const message = `Sign this message to authenticate with VeriPass\n\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

      // Step 3: Sign message with wallet
      const signature = await signMessageAsync({ message });

      // Step 4: Verify signature with backend
      const verifyResponse = await api.verify({
        address,
        message,
        signature,
      });

      // Step 5: Store token and update state
      setToken(verifyResponse.data.token);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: { address: verifyResponse.data.address },
        error: null,
      });
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Authentication failed';

      setState(s => ({
        ...s,
        isLoading: false,
        error: message,
      }));
    }
  }, [address, signMessageAsync]);

  const signOut = useCallback(() => {
    clearToken();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
