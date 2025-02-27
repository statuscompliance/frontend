import { client } from '@/api/axiosClient';

/**
 * Generic API client to make requests
 */
export const apiClient = {
  /**
   * Performs a GET request
   * @param {string} url - Endpoint URL
   * @param {object} params - Query parameters
   * @returns {Promise} - Promise with the response
   */
  get: (url, params = {}) => {
    return client.get(url, { params }).then(response => response.data);
  },
  
  /**
   * Performs a POST request
   * @param {string} url - Endpoint URL
   * @param {object} data - Data to send in the request body
   * @returns {Promise} - Promise with the response
   */
  post: (url, data = {}) => {
    return client.post(url, data).then(response => response.data);
  },
  
  /**
   * Performs a PUT request
   * @param {string} url - Endpoint URL
   * @param {object} data - Data to send in the request body
   * @returns {Promise} - Promise with the response
   */
  put: (url, data = {}) => {
    return client.put(url, data).then(response => response.data);
  },
  
  /**
   * Performs a PATCH request
   * @param {string} url - Endpoint URL
   * @param {object} data - Data to send in the request body
   * @returns {Promise} - Promise with the response
   */
  patch: (url, data = {}) => {
    return client.patch(url, data).then(response => response.data);
  },
  
  /**
   * Performs a DELETE request
   * @param {string} url - Endpoint URL
   * @param {object} data - Data to send in the request body (optional)
   * @returns {Promise} - Promise with the response
   */
  delete: (url, data = {}) => {
    return client.delete(url, { data }).then(response => response.data);
  }
};
