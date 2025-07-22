import { apiClient } from '@/api/apiClient';

/**
 * Gets all secrets for the current user
 * @returns {Promise} - Promise with the list of secrets
 */
export function getAllSecrets() {
  return apiClient.get('/secrets');
}

/**
 * Gets a single secret by ID (returns masked or real value once)
 * @param {string|number} id - Secret ID
 * @returns {Promise} - Promise with the secret
 */
export function getSecretById(id) {
  return apiClient.get(`/secrets/${id}`);
}

/**
 * Creates a new secret
 * @param {object} secretData - Secret object: { name, type, environment, value }
 * @returns {Promise} - Promise with the created secret
 */
export function createSecret(secretData) {
  return apiClient.post('/secrets', secretData);
}

/**
 * Updates a secret (partial update, including optional new value)
 * @param {string|number} id - Secret ID
 * @param {object} updateData - Fields to update (name, type, environment, value)
 * @returns {Promise} - Promise with the updated secret
 */
export function updateSecret(id, updateData) {
  return apiClient.patch(`/secrets/${id}`, updateData);
}

/**
 * Deletes a secret by ID
 * @param {string|number} id - Secret ID
 * @returns {Promise} - Promise with the delete response
 */
export function deleteSecret(id) {
  return apiClient.delete(`/secrets/${id}`);
}
