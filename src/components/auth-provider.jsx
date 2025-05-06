import { useEffect, useMemo } from 'react';
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
  const isAuthenticated = useMemo(() => !!userData, [userData]);
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
  // We want to run this effect exclusively on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Refreshes the user token
   */
  async function refreshUserToken() {
    if (isAuthenticated) {
      console.log('Refreshing user token...');
      const { accessToken } = await refreshToken();
      setUserData((p) => ({ ...p, accessToken }));
    }
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

      // If a 401 error is received, logout the user
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
            .then(() => axiosClient(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await refreshUserToken();
          processQueue(null);

          return axiosClient(originalRequest);
        } catch (err) {
          processQueue(err, null);
          unauthenticate();
          toast.error('You have been logged out by the server');

          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
    };
  })();  

  /**
   * Logs in with a registered user
   * @param {object} credentials - User credentials
   * @param {string} credentials.username - Username
   * @param {string} credentials.password - Password
   * @returns {Promise} - Promise with the response
   */
  async function authenticate ({ username, password }) {
    const { message: _, ...userData } = await apiClient.post('/users/signIn', { username, password });
    setUserData(userData);
    axiosClient.interceptors.response.use(
      undefined,
      axiosLogoutInterceptor
    );
    nodeRedClient.interceptors.response.use(
      undefined,
      axiosLogoutInterceptor
    );
  };

  /**
   * Logs out the current user
   */
  function unauthenticate() {
    try {
      apiClient.get('/users/signOut');
    } catch (error) {
      console.error(error);
    } finally {
      setUserData();
      axiosClient.interceptors.response.eject(axiosLogoutInterceptor);
      nodeRedClient.interceptors.response.eject(axiosLogoutInterceptor);
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
