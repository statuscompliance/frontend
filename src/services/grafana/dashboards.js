import { apiClient } from '@/api/apiClient';

/**
 * Services for managing Grafana dashboards
 */
export const dashboardsService = {
  /**
   * Gets a specific dashboard by UID
   * @param {string} uid - Dashboard UID
   * @returns {Promise} - Promise with the dashboard
   */
  getById: (uid) => {
    return apiClient.get(`/grafana/dashboard/${uid}`);
  },

  /**
   * Deletes a specific dashboard by UID
   * @param {string} uid - Dashboard UID
   * @returns {Promise} - Promise with the response
   */
  delete: (uid) => {
    return apiClient.delete(`/grafana/dashboard/${uid}`);
  },

  /**
   * Creates a new dashboard in Grafana
   * @param {object} data - Dashboard data
   * @returns {Promise} - Promise with the created dashboard
   */
  create: (data) => {
    return apiClient.post('/grafana/dashboard', data);
  },

  /**
   * Imports a new dashboard to Grafana
   * @param {object} data - Dashboard data to import
   * @returns {Promise} - Promise with the imported dashboard
   */
  import: (data) => {
    return apiClient.post('/grafana/dashboard/import', data);
  },

  /**
   * Gets all panels in a specific dashboard
   * @param {string} uid - Dashboard UID
   * @returns {Promise} - Promise with the list of panels
   */
  getPanels: (uid) => {
    return apiClient.get(`/grafana/dashboard/${uid}/panel`);
  },

  /**
   * Adds a new panel to the specified dashboard
   * @param {string} uid - Dashboard UID
   * @param {object} data - Panel data
   * @returns {Promise} - Promise with the added panel
   */
  addPanel: (uid, data) => {
    return apiClient.post(`/grafana/dashboard/${uid}/panel`, data);
  },

  /**
   * Updates a specific panel in a dashboard
   * @param {string} uid - Dashboard UID
   * @param {string|number} id - Panel ID
   * @param {object} data - Updated panel data
   * @returns {Promise} - Promise with the response
   */
  updatePanel: (uid, id, data) => {
    return apiClient.patch(`/grafana/dashboard/${uid}/panel/${id}`, data);
  },

  /**
   * Deletes a specific panel from a dashboard
   * @param {string} uid - Dashboard UID
   * @param {string|number} id - Panel ID
   * @returns {Promise} - Promise with the response
   */
  deletePanel: (uid, id) => {
    return apiClient.delete(`/grafana/dashboard/${uid}/panel/${id}`);
  },

  /**
   * Gets queries and metadata for all panels in a dashboard
   * @param {string} uid - Dashboard UID
   * @returns {Promise} - Promise with the list of queries and metadata
   */
  getPanelQueries: (uid) => {
    return apiClient.get(`/grafana/dashboard/${uid}/panel/query`);
  },

  /**
   * Gets the raw SQL query of a specific panel in a dashboard
   * @param {string} uid - Dashboard UID
   * @param {string|number} id - Panel ID
   * @returns {Promise} - Promise with the SQL query
   */
  getPanelQuery: (uid, id) => {
    return apiClient.get(`/grafana/dashboard/${uid}/panel/${id}/query`);
  },

  /**
   * Creates a new template for a dashboard
   * @param {object} data - Template data
   * @returns {Promise} - Promise with the created template
   */
  createTemplate: (data) => {
    return apiClient.post('/grafana/dashboard/template', data);
  },

  /**
   * Creates a temporary dashboard for panel previewing
   * @param {object} panelConfig - Configuration for the panel to preview
   * @param {string} [baseDashboardUid] - Optional UID of a dashboard to clone from
   * @param {object} [options] - Additional options
   * @returns {Promise} - Promise with the created temporary dashboard
   */
  createTemporaryDashboard: (panelConfig, baseDashboardUid = null, options = {}) => {
    const data = {
      panelConfig,
      isTemporary: true,
      title: `tmp-${baseDashboardUid}`,
      baseDashboardUid,
      timeRange: options.timeRange || { from: 'now-6h', to: 'now' },
      autoCleanup: options.autoCleanup !== false // Enable automatic cleanup by default
    };
    return apiClient.post('/grafana/dashboard/temp', data);
  },
};

export default dashboardsService;
