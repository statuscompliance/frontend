import { apiClient } from '@/api/apiClient';

/**
 * Services for managing Grafana data sources
 */
export const datasourcesService = {
  /**
   * Gets all Grafana data sources
   * @returns {Promise} - Promise with the list of data sources
   */
  getAll: () => {
    return apiClient.get('/grafana/datasource');
  },

  /**
   * Adds a new data source to Grafana
   * @param {object} data - Data source information
   * @returns {Promise} - Promise with the created data source
   */
  create: (data) => {
    return apiClient.post('/grafana/datasource', data);
  }
};

export default datasourcesService;
