import { createAxiosClient } from '@/api/createAxiosClient';
import { signOut } from '@/services/auth';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001/api/v1';


export const client = createAxiosClient({
  options: {
    withCredentials: true,
    baseURL: BASE_URL,
    timeout: 300000,
    headers: {
      'Content-Type': 'application/json',
    }
  },
  logout: signOut,
});
