import { apiClient } from '@/api/apiClient';

/**
 * Services for managing Grafana service accounts
 */
export const authService = {
  /**
   * Creates a new service account in Grafana
   * @param {object} data - Service account data
   * @param {string} data.name - Service account name
   * @param {string} data.role - Role assigned to the service account
   * @returns {Promise} - Promise with the created service account
   */
  createServiceAccount: (data) => {
    return apiClient.post('/grafana/serviceaccount', data);
  },

  /**
   * Gets a service account by Grafana ID
   * @param {string} id - Service account ID
   * @returns {Promise} - Promise with the service account
   */
  getServiceAccountById: (id) => {
    return apiClient.get(`/grafana/serviceaccount/${id}`);
  },

  /**
   * Creates a new token for the specified service account
   * @param {string} id - Service account ID
   * @param {object} data - Token data
   * @param {string} data.name - Token name
   * @param {number} data.secondsToLive - Duration in seconds before the token expires
   * @returns {Promise} - Promise with the created token
   */
  createServiceAccountToken: (id, data) => {
    return apiClient.post(`/grafana/serviceaccount/${id}/token`, data);
  }
};

export default authService;
