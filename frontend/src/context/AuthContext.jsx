import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService, setAccessToken } from '../services';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  /**
   * Session restoration on application launch.
   * Leverages the backend's HttpOnly refresh-cookie contract.
   * Access tokens remain in memory; long-lived secrets are never written to localStorage.
   */
  const restoreSession = useCallback(async () => {
    try {
      setIsLoading(true);
      // Attempt silent refresh via HttpOnly cookie
      const refreshResponse = await authService.refresh();
      const newAccessToken = refreshResponse?.data?.accessToken;

      if (newAccessToken) {
        setAccessToken(newAccessToken);
        // Fetch current user and profile
        const meResponse = await authService.getMe();
        const currentUser = meResponse?.data?.user;
        const currentProfile = meResponse?.data?.profile;

        setUser(currentUser);
        setProfile(currentProfile);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setProfile(null);
        setIsAuthenticated(false);
      }
    } catch {
      // 401 or network failure on silent refresh means unauthenticated guest session
      setAccessToken(null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Listen to session expired event from central axios interceptor
    const handleSessionExpired = () => {
      setAccessToken(null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    };

    window.addEventListener('pitch:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('pitch:session-expired', handleSessionExpired);
    };
  }, [restoreSession]);

  /**
   * Log in user with email and password
   */
  const login = async ({ email, password }) => {
    try {
      setAuthError(null);
      const res = await authService.login({ email, password });
      const { user: loggedInUser, accessToken } = res.data;

      setAccessToken(accessToken);
      setUser(loggedInUser);
      setIsAuthenticated(true);

      // Fetch linked role profile
      try {
        const meRes = await authService.getMe();
        if (meRes.data?.profile) {
          setProfile(meRes.data.profile);
        }
      } catch {
        // Non-blocking if profile not yet loaded
      }

      return { success: true, user: loggedInUser };
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Failed to log in. Please check your credentials.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  /**
   * Register a new user
   */
  const register = async (registrationData) => {
    try {
      setAuthError(null);
      const res = await authService.register(registrationData);
      const { user: registeredUser, accessToken } = res.data;

      setAccessToken(accessToken);
      setUser(registeredUser);
      setIsAuthenticated(true);

      return { success: true, user: registeredUser };
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Registration failed. Please check the provided information.';
      setAuthError(message);
      throw new Error(message);
    }
  };

  /**
   * Log out user and clear session
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Continue client cleanup even if backend network call fails
    } finally {
      setAccessToken(null);
      setUser(null);
      setProfile(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Refresh current user and profile data
   */
  const refreshUser = async () => {
    try {
      const res = await authService.getMe();
      if (res.data?.user) {
        setUser(res.data.user);
      }
      if (res.data?.profile) {
        setProfile(res.data.profile);
      }
    } catch {
      // Ignore
    }
  };

  const value = {
    user,
    profile,
    role: user?.role || null,
    isAuthenticated,
    isLoading,
    authError,
    login,
    register,
    logout,
    refreshUser,
    restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
