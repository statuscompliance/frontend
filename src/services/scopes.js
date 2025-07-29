import { apiClient } from '@/api/apiClient';

/**
 * Gets all scopes
 * @returns {Promise} - Promise with the list of scopes
 */
export function getAllScopes() {
  return apiClient.get('/scopes');
}

/**
 * Creates a new scope
 * @param {object} scopeData - Scope data
 * @returns {Promise} - Promise with the created scope
 */
export function createScope(scopeData) {
  return apiClient.post('/scopes', scopeData);
}

/**
 * Gets a scope by ID
 * @param {string} id - Scope ID
 * @returns {Promise} - Promise with the scope
 */
export function getScopeById(id) {
  return apiClient.get(`/scopes/${id}`);
}

/**
 * Updates an existing scope
 * @param {string} id - Scope ID
 * @param {object} scopeData - Updated scope data
 * @returns {Promise} - Promise with the updated scope
 */
export function updateScope(id, scopeData) {
  return apiClient.put(`/scopes/${id}`, scopeData);
}

/**
 * Deletes a scope
 * @param {string} id - Scope ID
 * @returns {Promise} - Promise with the response
 */
export function deleteScope(id) {
  return apiClient.delete(`/scopes/${id}`);
}

/**
 * Gets all scope sets
 * @returns {Promise} - Promise with the list of scope sets
 */
export function getAllScopeSets() {
  return apiClient.get('/scopes/sets');
}

/**
 * Creates a new scope set
 * @param {object} scopeSetData - Scope set data
 * @returns {Promise} - Promise with the created scope set
 */
export function createScopeSet(scopeSetData) {
  return apiClient.post('/scopes/sets', scopeSetData);
}

/**
 * Gets a scope set by ID
 * @param {string} id - Scope set ID
 * @returns {Promise} - Promise with the scope set
 */
export function getScopeSetById(id) {
  return apiClient.get(`/scopes/sets/${id}`);
}

/**
 * Updates an existing scope set
 * @param {string} id - Scope set ID
 * @param {object} scopeSetData - Updated scope set data
 * @returns {Promise} - Promise with the updated scope set
 */
export function updateScopeSet(id, scopeSetData) {
  return apiClient.put(`/scopes/sets/${id}`, scopeSetData);
}

/**
 * Gets scope sets by control ID
 * @param {string} controlId - Control ID
 * @returns {Promise} - Promise with the list of scope sets
 */
export function getScopeSetsByControlId(controlId) {
  return apiClient.get(`/scopes/sets/control/${controlId}`);
}