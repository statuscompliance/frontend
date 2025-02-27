import { apiClient } from '@/api/apiClient';

/**
 * Services for managing Grafana folders
 */
export const foldersService = {
  /**
   * Gets all Grafana folders
   * @returns {Promise} - Promise with the list of folders
   */
  getAll: () => {
    return apiClient.get('/grafana/folder');
  },

  /**
   * Creates a new folder in Grafana
   * @param {object} data - Folder data
   * @param {string} data.title - Folder title
   * @param {string} data.parentUid - UID of the parent folder (optional)
   * @param {string} data.description - Folder description (optional)
   * @returns {Promise} - Promise with the created folder
   */
  create: (data) => {
    return apiClient.post('/grafana/folder', data);
  },

  /**
   * Gets a folder by Grafana UID
   * @param {string} uid - Folder UID
   * @returns {Promise} - Promise with the folder
   */
  getById: (uid) => {
    return apiClient.get(`/grafana/folder/${uid}`);
  },

  /**
   * Gets dashboards for a specific folder by UID
   * @param {string} uid - Folder UID
   * @returns {Promise} - Promise with the list of dashboards
   */
  getDashboards: (uid) => {
    return apiClient.get(`/grafana/folder/${uid}/dashboard`);
  }
};

export default foldersService;
