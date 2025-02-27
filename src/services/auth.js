import { apiClient } from '@/api/apiClient';

/**
 * Registers a new user
 * @param {object} userData - User data
 * @param {string} userData.username - Username
 * @param {string} userData.password - Password
 * @param {string} userData.email - Email
 * @returns {Promise} - Promise with the response
 */
export function signUp({ username, password, email }) {
  return apiClient.post('/users/signUp', { username, password, email });
}

/**
 * Logs in with a registered user
 * @param {object} credentials - User credentials
 * @param {string} credentials.username - Username
 * @param {string} credentials.password - Password
 * @returns {Promise} - Promise with the response
 */
export function signIn({ username, password }) {
  return apiClient.post('/users/signIn', { username, password });
}

/**
 * Logs out the user
 * @returns {Promise} - Promise with the response
 */
export function signOut() {
  return apiClient.get('/users/signOut');
}

/**
 * Gets the authenticated user's authority
 * @returns {Promise} - Promise with the response
 */
export function getUserAuthority() {
  return apiClient.get('/users/auth/');
}

/**
 * Refreshes the access token
 * @returns {Promise} - Promise with the response
 */
export function refreshToken() {
  return apiClient.get('/api/refresh');
}
