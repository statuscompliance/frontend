import { apiClient } from '@/api/apiClient';

/**
 * Services for managing Grafana SQL queries
 */
export const queriesService = {
  /**
   * Creates an SQL query based on provided parameters
   * @param {object} data - Query parameters
   * @returns {Promise} - Promise with the created SQL query
   */
  buildSql: (data) => {
    return apiClient.post('/grafana/sql/build', data);
  },

  /**
   * Parses an SQL query into JSON parameters
   * @param {object} data - Query data
   * @param {string} data.rawSql - Raw SQL query
   * @returns {Promise} - Promise with the parsed query
   */
  parseSql: (data) => {
    return apiClient.post('/grafana/sql/parse', data);
  }
};

export default queriesService;
