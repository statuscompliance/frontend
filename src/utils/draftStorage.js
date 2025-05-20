/**
 * Utility functions for managing catalog draft data in localStorage
 */

const CATALOG_DRAFT_KEY = 'catalog_draft_id';
const CONTROLS_DRAFT_KEY = 'control_draft_ids';
const DASHBOARD_UID_KEY = 'dashboard_draft_uid';

/**
 * Saves a catalog draft ID to localStorage
 * @param {string} catalogId - ID of the draft catalog
 */
export function saveDraftCatalogId(catalogId) {
  if (catalogId) {
    localStorage.setItem(CATALOG_DRAFT_KEY, catalogId);
  }
}

/**
 * Retrieves the draft catalog ID from localStorage
 * @returns {string|null} - The catalog ID or null if not found
 */
export function getDraftCatalogId() {
  return localStorage.getItem(CATALOG_DRAFT_KEY);
}

/**
 * Saves a control draft ID to localStorage
 * @param {string} controlId - ID of the draft control
 */
export function saveDraftControlId(controlId) {
  if (!controlId) return;
  
  const existingControls = getDraftControlIds();
  if (!existingControls.includes(controlId)) {
    const updatedControls = [...existingControls, controlId];
    localStorage.setItem(CONTROLS_DRAFT_KEY, JSON.stringify(updatedControls));
  }
}

/**
 * Retrieves all draft control IDs from localStorage
 * @returns {Array<string>} - Array of control IDs
 */
export function getDraftControlIds() {
  const controlsJson = localStorage.getItem(CONTROLS_DRAFT_KEY);
  return controlsJson ? JSON.parse(controlsJson) : [];
}

/**
 * Clears all draft data from localStorage
 */
export function clearDraftData() {
  localStorage.removeItem(CATALOG_DRAFT_KEY);
  localStorage.removeItem(CONTROLS_DRAFT_KEY);
  localStorage.removeItem(DASHBOARD_UID_KEY);
}

/**
 * Checks if there is any draft data in localStorage
 * @returns {boolean} - True if draft data exists
 */
export function hasDraftData() {
  const hasCatalog = !!getDraftCatalogId();
  const hasControls = getDraftControlIds().length > 0;
  return hasCatalog || hasControls;
}

/**
 * Saves multiple control IDs at once
 * @param {Array<string>} controlIds - Array of control IDs
 */
export function saveDraftControlIds(controlIds) {
  if (!controlIds || !controlIds.length) return;
  
  const uniqueIds = [...new Set(controlIds)];
  localStorage.setItem(CONTROLS_DRAFT_KEY, JSON.stringify(uniqueIds));
}

/**
 * Initializes control IDs storage with an empty array if it doesn't exist
 */
export function initializeControlIdsStorage() {
  if (!localStorage.getItem(CONTROLS_DRAFT_KEY)) {
    localStorage.setItem(CONTROLS_DRAFT_KEY, JSON.stringify([]));
  }
}

// Save the temporary dashboard UID
export const saveDraftDashboardUid = (uid) => {
  if (uid) {
    localStorage.setItem(DASHBOARD_UID_KEY, uid);
  }
};

// Get the temporary dashboard UID
export const getDraftDashboardUid = () => {
  return localStorage.getItem(DASHBOARD_UID_KEY);
};

// Clear the temporary dashboard UID
export const clearDraftDashboardUid = () => {
  localStorage.removeItem(DASHBOARD_UID_KEY);
};
