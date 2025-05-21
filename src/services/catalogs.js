import { apiClient } from '@/api/apiClient';

/**
 * Gets all catalogs
 * @param {string} [status] - Optional status filter: 'draft' or 'finalized'
 * @returns {Promise} - Promise with the list of catalogs
 */
export function getAllCatalogs(statusValue = 'finalized') {
  const url = `/catalogs${statusValue !== null ? `?status=${encodeURIComponent(statusValue)}` : ''}`;
  return apiClient.get(url);
}

/**
 * Creates a new catalog
 * @param {object} catalogData - Catalog data
 * @returns {Promise} - Promise with the created catalog
 */
export function createCatalog(catalogData) {
  return apiClient.post('/catalogs', catalogData);
}

/**
 * Gets a catalog by ID
 * @param {string} id - Catalog ID
 * @returns {Promise} - Promise with the catalog
 */
export function getCatalogById(id) {
  return apiClient.get(`/catalogs/${id}`);
}

/**
 * Updates an existing catalog
 * @param {string} id - Catalog ID
 * @param {object} catalogData - Updated catalog data
 * @returns {Promise} - Promise with the updated catalog
 */
export function updateCatalog(id, catalogData) {
  return apiClient.patch(`/catalogs/${id}`, catalogData);
}

/**
 * Deletes a catalog
 * @param {string} id - Catalog ID
 * @returns {Promise} - Promise with the response
 */
export function deleteCatalog(id) {
  return apiClient.delete(`/catalogs/${id}`);
}

/**
 * Calculates and gets points for a computation by tpaId
 * @param {string} tpaId - Bluejay agreement ID (tpaId)
 * @param {string} from - Initial date for calculation (optional)
 * @param {string} to - End date for calculation (optional)
 * @returns {Promise} - Promise with the list of calculated points
 */
export function getPointsByTpaId(tpaId, from = null, to = null) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  
  return apiClient.get(`/catalogs/${tpaId}/points`, params);
}

/**
 * Creates a new draft catalog
 * @param {object} catalogData - Catalog data
 * @returns {Promise} - Promise with the created draft catalog
 */
export function createDraftCatalog(catalogData) {
  return apiClient.post('/catalogs/drafts', catalogData);
}

/**
 * Finalizes a draft catalog
 * @param {string} id - Catalog ID
 * @returns {Promise} - Promise with the finalized catalog
 */
export function finalizeCatalog(id) {
  return apiClient.patch(`/catalogs/${id}/finalize`);
}
