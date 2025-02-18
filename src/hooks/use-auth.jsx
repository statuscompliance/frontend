import { createContext, useContext } from 'react';

const initialState = localStorage.getItem('userData');

// Create the Auth Context
export const AuthContext = createContext(initialState);

// Custom hook for accessing the context
export const useAuth = () => useContext(AuthContext);
