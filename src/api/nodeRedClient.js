import { createAxiosClient } from '@/api/createAxiosClient';

const BASE_URL = import.meta.env.VITE_NODE_RED_URL || 'http://localhost:1880';

export const nodeRedClient = createAxiosClient({
  options: {
    baseURL: BASE_URL,
    timeout: 300000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  }
});