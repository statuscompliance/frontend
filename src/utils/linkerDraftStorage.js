// Linker draft storage utilities for localStorage
// These work independently from catalog draft storage

const LINKER_DRAFT_PREFIX = 'linker_draft_';
const LINKER_INFO_KEY = `${LINKER_DRAFT_PREFIX}info`;
const LINKER_DATASOURCES_KEY = `${LINKER_DRAFT_PREFIX}datasources`;
const LINKER_MAPPING_KEY = `${LINKER_DRAFT_PREFIX}mapping`;

// ============= Linker Info Storage =============

/**
 * Save linker info to localStorage
 * @param {Object} info - Linker information (name, description, environment)
 */
export function saveLinkerInfo(info) {
  try {
    localStorage.setItem(LINKER_INFO_KEY, JSON.stringify(info));
  } catch (error) {
    console.error('Error saving linker info to localStorage:', error);
  }
}

/**
 * Get linker info from localStorage
 * @returns {Object|null} Linker info or null if not found
 */
export function getLinkerInfo() {
  try {
    const data = localStorage.getItem(LINKER_INFO_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading linker info from localStorage:', error);
    return null;
  }
}

/**
 * Clear linker info from localStorage
 */
export function clearLinkerInfo() {
  try {
    localStorage.removeItem(LINKER_INFO_KEY);
  } catch (error) {
    console.error('Error clearing linker info from localStorage:', error);
  }
}

// ============= Datasources Storage =============

/**
 * Save datasources configuration to localStorage
 * @param {Array} datasources - Array of datasource configurations
 */
export function saveLinkerDatasources(datasources) {
  try {
    localStorage.setItem(LINKER_DATASOURCES_KEY, JSON.stringify(datasources));
  } catch (error) {
    console.error('Error saving linker datasources to localStorage:', error);
  }
}

/**
 * Get datasources configuration from localStorage
 * @returns {Array} Array of datasource configurations
 */
export function getLinkerDatasources() {
  try {
    const data = localStorage.getItem(LINKER_DATASOURCES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading linker datasources from localStorage:', error);
    return [];
  }
}

/**
 * Add a datasource to the linker draft
 * @param {Object} datasource - Datasource configuration
 */
export function addLinkerDatasource(datasource) {
  try {
    const datasources = getLinkerDatasources();
    datasources.push(datasource);
    saveLinkerDatasources(datasources);
  } catch (error) {
    console.error('Error adding datasource to linker draft:', error);
  }
}

/**
 * Remove a datasource from the linker draft
 * @param {number} index - Index of datasource to remove
 */
export function removeLinkerDatasource(index) {
  try {
    const datasources = getLinkerDatasources();
    datasources.splice(index, 1);
    saveLinkerDatasources(datasources);
  } catch (error) {
    console.error('Error removing datasource from linker draft:', error);
  }
}

/**
 * Clear all datasources from localStorage
 */
export function clearLinkerDatasources() {
  try {
    localStorage.removeItem(LINKER_DATASOURCES_KEY);
  } catch (error) {
    console.error('Error clearing linker datasources from localStorage:', error);
  }
}

// ============= Mapping Storage =============

/**
 * Save mapping configuration to localStorage
 * @param {Object} mapping - Mapping configuration
 */
export function saveLinkerMapping(mapping) {
  try {
    localStorage.setItem(LINKER_MAPPING_KEY, JSON.stringify(mapping));
  } catch (error) {
    console.error('Error saving linker mapping to localStorage:', error);
  }
}

/**
 * Get mapping configuration from localStorage
 * @returns {Object|null} Mapping configuration or null
 */
export function getLinkerMapping() {
  try {
    const data = localStorage.getItem(LINKER_MAPPING_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading linker mapping from localStorage:', error);
    return null;
  }
}

/**
 * Clear mapping from localStorage
 */
export function clearLinkerMapping() {
  try {
    localStorage.removeItem(LINKER_MAPPING_KEY);
  } catch (error) {
    console.error('Error clearing linker mapping from localStorage:', error);
  }
}

// ============= General Functions =============

/**
 * Check if there's any linker draft data
 * @returns {boolean} True if draft data exists
 */
export function hasLinkerDraft() {
  const info = getLinkerInfo();
  const datasources = getLinkerDatasources();
  return (info !== null) || (datasources.length > 0);
}

/**
 * Clear all linker draft data
 */
export function clearLinkerDraft() {
  clearLinkerInfo();
  clearLinkerDatasources();
  clearLinkerMapping();
}

/**
 * Get complete linker draft data
 * @returns {Object} Complete draft data
 */
export function getLinkerDraft() {
  return {
    info: getLinkerInfo(),
    datasources: getLinkerDatasources(),
    mapping: getLinkerMapping(),
  };
}
