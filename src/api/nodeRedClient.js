import axios from 'axios';

export const NODERED_BASE_URL = '/node-red';

export const nodeRedClient = axios.create({
  baseURL: NODERED_BASE_URL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json'
  }
});
