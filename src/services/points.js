import { apiClient } from '@/api/apiClient';

/**
 * Services for points management
 */
export const pointsService = {
  /**
   * Gets all points
   * @returns {Promise} - Promise with the list of points
   */
  getAll: () => {
    return apiClient.get('/point');
  },

  /**
   * Gets a point by ID
   * @param {string} id - Point ID
   * @returns {Promise} - Promise with the point
   */
  getById: (id) => {
    return apiClient.get(`/point/${id}`);
  },

  /**
   * Deletes a point by ID
   * @param {string} id - Point ID
   * @returns {Promise} - Promise with the response
   */
  delete: (id) => {
    return apiClient.delete(`/point/${id}`);
  },

  /**
   * Gets a point by TPA ID
   * @param {string} tpaId - TPA agreement ID
   * @returns {Promise} - Promise with the point
   */
  getByTpaId: (tpaId) => {
    return apiClient.get(`/point/catalog/${tpaId}`);
  },

  /**
   * Gets points for a computation by TPA ID
   * @param {string} tpaId - TPA agreement ID
   * @param {object} params - Optional parameters (start and end dates)
   * @param {string} params.from - Start date for the calculation
   * @param {string} params.to - End date for the calculation
   * @returns {Promise} - Promise with the list of calculated points
   */
  getPointsByTpaId: (tpaId, params = {}) => {
    return apiClient.get(`/catalogs/${tpaId}/points`, params);
  }
};

export default pointsService;
