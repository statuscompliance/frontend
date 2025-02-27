import { apiClient } from '@/api/apiClient';

/**
 * Gets all computations
 * @returns {Promise} - Promise with the list of computations
 */
export function getAllComputations() {
  return apiClient.get('/computations');
}

/**
 * Starts a new Node-RED computation
 * @param {object} computationData - Computation data
 * @returns {Promise} - Promise with the created computation
 */
export function startComputation(computationData) {
  return apiClient.post('/computations', computationData);
}

/**
 * Deletes all computations
 * @returns {Promise} - Promise with the response
 */
export function deleteAllComputations() {
  return apiClient.delete('/computations');
}

/**
 * Gets a computation by computationGroup
 * @param {string} id - Computation ID (UUID)
 * @returns {Promise} - Promise with the computation
 */
export function getComputationById(id) {
  return apiClient.get(`/computations/${id}`);
}

/**
 * Creates multiple computations
 * @param {object} data - Data of the computations to create
 * @param {Array} data.computations - List of computations
 * @param {boolean} data.done - Indicates if the process has been completed
 * @returns {Promise} - Promise with the created computations
 */
export function createBulkComputations(data) {
  return apiClient.post('/computations/bulk', data);
}

/**
 * Gets calculations by control ID
 * @param {string|number} controlId - Control ID
 * @returns {Promise} - Promise with the list of calculations
 */
export function getComputationsByControlId(controlId) {
  return apiClient.get(`/controls/${controlId}/computations`);
}

/**
 * Sets the calculation interval for a calculation by control ID and creation date
 * @param {string|number} controlId - Control ID
 * @param {string} createdAt - Creation date of the calculation
 * @param {object} data - Interval data
 * @returns {Promise} - Promise with the response
 */
export function setComputationInterval(controlId, createdAt, data) {
  return apiClient.put(`/controls/${controlId}/computations`, data);
}

/**
 * Deletes calculations by control ID
 * @param {string|number} controlId - Control ID
 * @returns {Promise} - Promise with the response
 */
export function deleteComputationsByControlId(controlId) {
  return apiClient.delete(`/controls/${controlId}/computations`);
}

/**
 * Gets calculations by control ID and creation date
 * @param {string|number} controlId - Control ID
 * @param {string} createdAt - Creation date
 * @returns {Promise} - Promise with the list of calculations
 */
export function getComputationsByControlIdAndDate(controlId, createdAt) {
  return apiClient.get(`/controls/${controlId}/computations/${createdAt}`);
}
