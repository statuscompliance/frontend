import axios from 'axios';

export const client = axios.create({
  withCredentials: true,
  baseURL: '/api/v1',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  }
});
