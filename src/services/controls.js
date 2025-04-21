import { apiClient } from '@/api/apiClient';

/**
 * Gets all controls
 * * @param {string} status - Optional status filter ('finalized' or 'draft')
 * @returns {Promise} - Promise with the list of controls
 */
export function getAllControls(status = null) {
  let url = '/controls';
  if (status) {
    url += `?status=${encodeURIComponent(status)}`;
  }
  return apiClient.get(url);
}

/**
 * Creates a new control
 * @param {object} controlData - Control data
 * @returns {Promise} - Promise with the created control
 */
export function createControl(controlData) {
  return apiClient.post('/controls', controlData);
}

/**
 * Gets a control by ID
 * @param {string} id - Control ID
 * @returns {Promise} - Promise with the control
 */
export function getControlById(id) {
  return apiClient.get(`/controls/${id}`);
}

/**
 * Updates an existing control
 * @param {string} id - Control ID
 * @param {object} controlData - Updated control data
 * @returns {Promise} - Promise with the updated control
 */
export function updateControl(id, controlData) {
  return apiClient.patch(`/controls/${id}`, controlData);
}

/**
 * Deletes a control
 * @param {string} id - Control ID
 * @returns {Promise} - Promise with the response
 */
export function deleteControl(id) {
  return apiClient.delete(`/controls/${id}`);
}

/**
 * Gets all controls for a catalog
 * @param {string} catalogId - Catalog ID
 * @param {string} status - Optional status filter ('finalized' or 'draft')
 * @returns {Promise} - Promise with the list of controls
 */
export function getControlsByCatalogId(catalogId, status = null) {
  let url = `/catalogs/${catalogId}/controls`;
  if (status) {
    url += `?status=${encodeURIComponent(status)}`;
  }
  return apiClient.get(url);
}

/**
 * Gets computations by control ID
 * @param {string} controlId - Control ID
 * @returns {Promise} - Promise with the computations
 */
export function getComputationsByControlId(controlId) {
  return apiClient.get(`/controls/${controlId}/computations`);
}

/**
 * Sets the calculation interval for a computation by control ID and creation date
 * @param {string} controlId - Control ID
 * @param {object} data - Interval configuration data
 * @returns {Promise} - Promise with the response
 */
export function setComputeInterval(controlId, data) {
  return apiClient.put(`/controls/${controlId}/computations`, data);
}

/**
 * Deletes computations for a control
 * @param {string} controlId - Control ID
 * @returns {Promise} - Promise with the response
 */
export function deleteComputationsByControlId(controlId) {
  return apiClient.delete(`/controls/${controlId}/computations`);
}

/**
 * Gets computations by control ID and creation date
 * @param {string} controlId - Control ID
 * @param {string} createdAt - Creation date of the computation
 * @returns {Promise} - Promise with the computations
 */
export function getComputationsByControlIdAndDate(controlId, createdAt) {
  return apiClient.get(`/controls/${controlId}/computations/${createdAt}`);
}

/**
 * Gets panels for a control
 * @param {string} controlId - Control ID
 * @returns {Promise} - Promise with the panels
 */
export function getPanelsByControlId(controlId) {
  return apiClient.get(`/controls/${controlId}/panels`);
}

/**
 * Adds a panel to a control
 * @param {string} controlId - Control ID
 * @param {string} panelId - Panel ID
 * @param {object} data - Panel data (dashboardUid)
 * @returns {Promise} - Promise with the response
 */
export function addPanelToControl(controlId, panelId, data) {
  return apiClient.post(`/controls/${controlId}/panel/${panelId}`, data);
}

/**
 * Removes a panel from a control
 * @param {string} controlId - Control ID
 * @param {string} panelId - Panel ID
 * @returns {Promise} - Promise with the response
 */
export function deletePanelFromControl(controlId, panelId) {
  return apiClient.delete(`/controls/${controlId}/panels/${panelId}`);
}

/**
 * Creates a new draft control
 * @param {object} controlData - Control data
 * @returns {Promise} - Promise with the created draft control
 */
export function createDraftControl(controlData) {
  return apiClient.post('/controls/drafts', controlData);
}

/**
 * Finalizes a draft control
 * @param {string} id - Control ID
 * @returns {Promise} - Promise with the finalized control
 */
export function finalizeControl(id) {
  return apiClient.patch(`/controls/${id}/finalize`);
}
