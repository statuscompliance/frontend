import { apiClient } from '@/api/apiClient';

const BASE_PATH = '/databinder/linker';

/**
 * Get all linkers for the authenticated user
 * @returns {Promise<Array>} Array of linkers
 */
export async function getAllLinkers() {
  return apiClient.get(BASE_PATH);
}

/**
 * Get a specific linker by ID
 * @param {string} id - Linker ID
 * @returns {Promise<Object>} Linker object with full configuration
 */
export async function getLinkerById(id) {
  return apiClient.get(`${BASE_PATH}/${id}`);
}

/**
 * Create a new linker
 * @param {Object} linkerData - Linker configuration
 * @param {string} [linkerData.name] - Optional name for the linker
 * @param {Array<string>} linkerData.datasourceIds - Array of datasource IDs to link
 * @param {Object} linkerData.datasourceConfigs - Per-datasource configurations (REQUIRED, can be empty object {})
 * @param {string} [linkerData.defaultMethodName] - Default method to use ('default', 'getAll', etc.)
 * @param {string} [linkerData.description] - Optional description
 * @param {string} [linkerData.environment] - Environment (dev, staging, production)
 * @returns {Promise<Object>} Created linker object (auto-executes and caches results)
 */
export async function createLinker(linkerData) {
  return apiClient.post(BASE_PATH, linkerData);
}

/**
 * Update an existing linker
 * @param {string} id - Linker ID
 * @param {Object} linkerData - Partial linker data to update
 * @returns {Promise<Object>} Updated linker object
 */
export async function updateLinker(id, linkerData) {
  return apiClient.patch(`${BASE_PATH}/${id}`, linkerData);
}

/**
 * Delete a linker
 * @param {string} id - Linker ID
 * @returns {Promise<void>}
 */
export async function deleteLinker(id) {
  return apiClient.delete(`${BASE_PATH}/${id}`);
}

/**
 * Execute a linker to fetch aggregated data from all linked datasources
 * Uses intelligent caching with 14-day TTL and 1-hour staleness threshold
 * @param {string} id - Linker ID
 * @param {Object} [options] - Execution options
 * @param {boolean} [options.forceRefresh] - Force cache refresh
 * @param {string} [options.methodName] - Override method name for specific datasources at runtime
 * @param {Object} [options.*] - Additional datasource-specific options
 * @returns {Promise<Object>} Aggregated data from all datasources with cache metadata
 */
export async function executeLinker(id, options = {}) {
  return apiClient.post(`${BASE_PATH}/${id}/execute`, options);
}

/**
 * Get linker cache status
 * @param {string} id - Linker ID
 * @returns {Promise<Object>} Cache status and metadata
 */
export async function getLinkerCacheStatus(id) {
  return apiClient.get(`${BASE_PATH}/${id}/cache/status`);
}

/**
 * Clear linker cache
 * @param {string} id - Linker ID
 * @returns {Promise<Object>} Cache clear confirmation
 */
export async function clearLinkerCache(id) {
  return apiClient.delete(`${BASE_PATH}/${id}/cache`);
}
