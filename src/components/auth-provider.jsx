import { useState } from 'react';
import { AuthContext } from '@/hooks/use-auth';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(localStorage.getItem('userData') !== null);
  const [userData, setUserData] = useState(JSON.parse(localStorage.getItem('userData')));

  const authenticate = async (user) => {
    setIsAuthenticated(true);
    user.userId = user._id;
    setUserData(user);
    localStorage.setItem('userData', JSON.stringify(user)); // Save user data
  };

  const unauthenticate = () => {
    try {
      setIsAuthenticated(false);
      setUserData(null);
      localStorage.removeItem('userData'); // Remove user data
    } catch (error) {
      console.error(error);
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const hasAccess = allowedRoles == undefined || allowedRoles.some((role) => userData.roles.includes(role));
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
