import { apiClient } from '@/api/apiClient';

/**
 * Registers a new user
 * @param {object} userData - User data
 * @param {string} userData.username - Username
 * @param {string} userData.password - Password
 * @param {string} userData.email - Email
 * @returns {Promise} - Promise with the response
 */
/*
export function signUp({ username, password, email }) {
  return apiClient.post('/users/signUp', { username, password, email });
}
*/
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
  return apiClient.get('/users/auth/refresh');
}

// 2FA: Get current status (enabled/disabled)
export function get2FAStatus() {
  return apiClient.get('/users/2fa/status');
}

// 2FA: Generate secret and QR code
export function setup2FA() {
  return apiClient.post('/users/2fa/setup');
}

// 2FA: Verify OTP token to activate 2FA
export function verify2FA({ totpToken }) {
  return apiClient.post('/users/2fa/verify', { totpToken });
}

// 2FA: Disable 2FA with OTP and password
export function disable2FA({ totpToken, password }) {
  return apiClient.post('/users/2fa/disable', { totpToken, password });
}
