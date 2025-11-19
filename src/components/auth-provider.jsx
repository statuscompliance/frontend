import { useEffect, useMemo, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext, useAuth } from '@/hooks/use-auth';
import { useStorage } from '@/hooks/use-storage';
import { apiClient } from '@/api/apiClient';
import { nodeRedClient } from '@/api/nodeRedClient';
import { client as axiosClient } from '@/api/axiosClient';
import { refreshToken } from '@/services/auth';
import { toast } from 'sonner';

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useStorage('userData');
  const [, setNodeToken] = useStorage('token');
  const nodeRedToken = useMemo(() => userData?.nodeRedToken, [userData]);
  const isAuthenticated = useMemo(() => !!userData && !userData.requires2FA, [userData]);
  // Ref to store the interceptor references for cleanup
  const axiosInterceptorRef = useRef(null);
  const nodeRedInterceptorRef = useRef(null);
  let isLoggingOut = false; // Flag to prevent multiple logout requests

  // Handle node token change
  useEffect(() => {
    if (nodeRedToken) {
      setNodeToken(nodeRedToken);
      nodeRedClient.defaults.headers.common['Authorization'] = `Bearer ${nodeRedToken}`;
    } else {
      setNodeToken();
      delete nodeRedClient.defaults.headers.common['Authorization'];
    }
  }, [nodeRedToken, setNodeToken]);

  // Refresh token on app boot
  useEffect(() => {
    void refreshUserToken();

    // Configure interceptors if authenticated and not requiring 2FA
    if (isAuthenticated && !userData?.requires2FA) {
      setupInterceptors();
    }

    // Cleanup interceptors on unmount
    return () => {
      cleanupInterceptors();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userData?.requires2FA]);

  /**
   * Configures the interceptors for axios and nodeRed clients
   */
  const setupInterceptors = () => {
    cleanupInterceptors();

    axiosInterceptorRef.current = axiosClient.interceptors.response.use(
      response => response,
      axiosLogoutInterceptor
    );

    nodeRedInterceptorRef.current = nodeRedClient.interceptors.response.use(
      response => response,
      axiosLogoutInterceptor
    );
  };

  /**
   * Cleans up the interceptors
   */
  const cleanupInterceptors = () => {
    if (axiosInterceptorRef.current !== null) {
      axiosClient.interceptors.response.eject(axiosInterceptorRef.current);
      axiosInterceptorRef.current = null;
    }

    if (nodeRedInterceptorRef.current !== null) {
      nodeRedClient.interceptors.response.eject(nodeRedInterceptorRef.current);
      nodeRedInterceptorRef.current = null;
    }
  };

  /**
   * Refreshes the user token
   */
  async function refreshUserToken() {
    // Don't refresh token if user data indicates 2FA is required
    if (isAuthenticated && userData?.accessToken && !userData?.requires2FA) {
      try {
        const { accessToken } = await refreshToken();
        setUserData((p) => ({ ...p, accessToken }));
        return true;
      } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Closure holding the state of the logout interceptor
   * and request retry queue
   */
  const axiosLogoutInterceptor = (() => {
    let isRefreshing = false;
    let failedQueue = [];

    const processQueue = (error) => {
      failedQueue.forEach((prom) => {
        if (error) {
          prom.reject(error);
        } else {
          prom.resolve();
        }
      });
      failedQueue = [];
    };

    return async function (error) {
      const originalRequest = error.config;

      // If the error is not a 401, reject the promise
      if (error.response?.status !== 401) {
        return Promise.reject(error);
      }

      // If the request is already retried, reject the promise
      if (!originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => axiosClient(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshed = await refreshUserToken();

          if (!refreshed) {
            throw new Error('Token refresh failed');
          }

          // Update the original request with the new access token
          if (userData?.accessToken) {
            originalRequest.headers['Authorization'] = `Bearer ${userData.accessToken}`;
          }

          processQueue(null);
          return axiosClient(originalRequest);
        } catch (err) {
          processQueue(err);
          unauthenticate();
          toast.error('Session expired. Please log in again.');
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      // If the request has already been retried, reject the promise
      return Promise.reject(error);
    };
  })();

  /**
   * Logs in with a registered user
   * @param {object} credentials - User credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Password
   * @param {string} credentials.totpToken - TOTP token for 2FA
   * @returns {Promise} - Promise with the response
   */
  async function authenticate ({ username, password, totpToken }) {
    const response = await apiClient.post('/users/signIn', { username, password, totpToken });
    
    // If 2FA is required, don't set full user data yet
    if (response.requires2FA) {
      setUserData(response); // This will store the 2FA requirement info
      return response; // Return the response so the UI can handle 2FA
    }
    
    // Extract userData, excluding the message
    const { message: _, ...userData } = response;
    setUserData(userData);
    setupInterceptors();
    return userData;
  };

  /**
   * Logs out the current user
   */
  async function unauthenticate() {
    if (isLoggingOut) return; // Evita logout doble
    isLoggingOut = true;
    try {
      await apiClient.get('/users/signOut');
    } catch (error) {
      console.error(error);
    } finally {
      cleanupInterceptors();
      setUserData(null);
      isLoggingOut = false;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userData, authenticate, unauthenticate }}>
      {children}
    </AuthContext.Provider>
  );
};

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, userData } = useAuth();
  const location = useLocation();
  const hasAccess = useMemo(
    () => allowedRoles == undefined || allowedRoles.some((role) => role === userData?.authority?.toLowerCase()),
    [userData, allowedRoles]
  );

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
