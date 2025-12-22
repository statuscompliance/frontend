import { apiClient } from '@/api/apiClient';

const BASE_PATH = '/databinder/ds';

/**
 * Get all datasources for the authenticated user
 * @returns {Promise<Array>} Array of datasources (without config field for security)
 */
export async function getAllDatasources() {
  return apiClient.get(BASE_PATH);
}

/**
 * Get a specific datasource by ID with full configuration
 * @param {string} id - Datasource ID
 * @returns {Promise<Object>} Datasource object with full config
 */
export async function getDatasourceById(id) {
  return apiClient.get(`${BASE_PATH}/${id}`);
}

/**
 * Create a new datasource
 * @param {Object} datasourceData - Datasource configuration
 * @param {string} datasourceData.name - Name of the datasource
 * @param {string} datasourceData.definitionId - Type of datasource (rest-api, microsoft-graph, owncloud)
 * @param {Object} datasourceData.config - Configuration object specific to the datasource type
 * @param {string} [datasourceData.description] - Optional description
 * @param {string} [datasourceData.environment] - Environment (dev, staging, production)
 * @returns {Promise<Object>} Created datasource object
 */
export async function createDatasource(datasourceData) {
  return apiClient.post(BASE_PATH, datasourceData);
}

/**
 * Update an existing datasource
 * @param {string} id - Datasource ID
 * @param {Object} datasourceData - Partial datasource data to update
 * @returns {Promise<Object>} Updated datasource object
 */
export async function updateDatasource(id, datasourceData) {
  return apiClient.patch(`${BASE_PATH}/${id}`, datasourceData);
}

/**
 * Delete a datasource
 * @param {string} id - Datasource ID
 * @returns {Promise<void>}
 */
export async function deleteDatasource(id) {
  return apiClient.delete(`${BASE_PATH}/${id}`);
}

/**
 * Get available datasource type definitions
 * @returns {Promise<Array>} Array of datasource type definitions
 */
export async function getDatasourceTypes() {
  return apiClient.get('/databinder/definitions/available');
}

/**
 * Test datasource connection
 * @param {string} id - Datasource ID
 * @returns {Promise<Object>} Test result with status, message, and details
 */
export async function testDatasourceConnection(id) {
  return apiClient.post(`${BASE_PATH}/${id}/test`);
}

/**
 * Get available methods for a datasource
 * @param {string} id - Datasource ID
 * @returns {Promise<Object>} Available methods for the datasource
 */
export async function getDatasourceMethods(id) {
  return apiClient.get(`${BASE_PATH}/${id}/methods`);
}

/**
 * Get details of a specific method from a datasource
 * @param {string} id - Datasource ID
 * @param {string} methodName - Method name to get details for
 * @returns {Promise<Object>} Method information including parameters and description
 */
export async function getDatasourceMethodDetails(id, methodName) {
  return apiClient.get(`${BASE_PATH}/${id}/methods/${methodName}`);
}

/**
 * Get details of all available methods for a datasource
 * @param {string} id - Datasource ID
 * @returns {Promise<Object>} All methods information with parameters and descriptions
 */
export async function getAllDatasourceMethods(id) {
  return apiClient.get(`${BASE_PATH}/${id}/methods/all`);
}

/**
 * Fetch data from a datasource using a specific method
 * @param {string} id - Datasource ID
 * @param {Object} fetchParams - Fetch parameters
 * @param {string} [fetchParams.methodName] - Optional method to execute (defaults to 'default')
 * @param {Object} [fetchParams.params] - Method parameters
 * @param {Object} [fetchParams.propertyMapping] - Optional property mapping for transformation
 * @returns {Promise<Object>} Fetched data with metadata
 */
export async function fetchDatasourceData(id, fetchParams) {
  return apiClient.post(`${BASE_PATH}/${id}/fetch`, fetchParams);
}
