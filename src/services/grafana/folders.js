import { apiClient } from '@/api/apiClient';

/**
 * Services for managing Grafana folders
 */
export const foldersService = {
  /**
   * Gets all folders from Grafana
   * @returns {Promise} - Promise with the folders
   */
  getAll: () => {
    return apiClient.get('/grafana/folder');
  },

  /**
   * Gets a specific folder by UID
   * @param {string} uid - Folder UID
   * @returns {Promise} - Promise with the folder
   */
  getById: (uid) => {
    return apiClient.get('/grafana/search', { dashboardUIDs: [uid] });
  },

  /**
   * Gets all items from a specific folder
   * @param {string} uid - Folder UID
   * @returns {Promise} - Promise with the folder
   */
  getItems: (uid) => {
    return apiClient.get('/grafana/search', { folderUIDs: [uid] });
  },

  /**
   * Creates a new folder in Grafana
   * @param {object} data - Folder data
   * @returns {Promise} - Promise with the created folder
   */
  create: (data) => {
    return apiClient.post('/grafana/folder', data);
  },

  /**
   * Updates a specific folder in Grafana
   * @param {string} uid - Folder UID
   * @param {object} data - Updated folder data
   * @returns {Promise} - Promise with the updated folder
   */
  update: (uid, data) => {
    return apiClient.put(`/grafana/folder/${uid}`, data);
  },

  /**
   * Deletes a specific folder in Grafana
   * @param {string} uid - Folder UID
   * @returns {Promise} - Promise with the response
   */
  delete: (uid) => {
    return apiClient.delete(`/grafana/folder/${uid}`);
  }
};

export default foldersService;
