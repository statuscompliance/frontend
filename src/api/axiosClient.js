import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001/api/v1';

export const client = axios.create({
  withCredentials: true,
  baseURL: BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  }
});
