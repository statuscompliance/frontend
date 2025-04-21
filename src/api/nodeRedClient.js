import axios from 'axios';

const BASE_URL = import.meta.env.VITE_NODE_RED_URL || 'http://localhost:1880';

export const nodeRedClient = axios.create({
  baseURL: BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
});
