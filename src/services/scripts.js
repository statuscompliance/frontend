import { apiClient } from '@/api/apiClient';
import { client } from '@/api/axiosClient';

/**
 * Creates a new script
 * @param {object} scriptData - Script data
 * @param {string} scriptData.code - JavaScript code
 * @param {object} scriptData.metadata - Script metadata
 * @returns {Promise} - Promise with the response
 */
export function createScript(scriptData) {
  return apiClient.post('/scripts', scriptData);
}

/**
 * Gets all scripts
 * @returns {Promise} - Promise with the list of scripts
 */
export function getAllScripts() {
  return apiClient.get('/scripts');
}

/**
 * Deletes all scripts
 * @returns {Promise} - Promise with the response
 */
export function deleteAllScripts() {
  return apiClient.delete('/scripts');
}

/**
 * Parses a JavaScript code fragment
 * @param {string} code - JavaScript code to parse
 * @returns {Promise} - Promise with the parsed code
 */
export function parseScript(code) {
  // Using axios client directly because we need to send plain text
  return client.post('/scripts/parse', code, {
    headers: {
      'Content-Type': 'text/plain'
    }
  }).then(response => response.data);
}

/**
 * Gets a script by ID
 * @param {string} id - Script ID
 * @returns {Promise} - Promise with the script
 */
export function getScriptById(id) {
  return apiClient.get(`/scripts/${id}`);
}

/**
 * Updates an existing script
 * @param {string} id - Script ID
 * @param {object} scriptData - Updated script data
 * @returns {Promise} - Promise with the response
 */
export function updateScript(id, scriptData) {
  return apiClient.put(`/scripts/${id}`, scriptData);
}

/**
 * Deletes a script
 * @param {string} id - Script ID
 * @returns {Promise} - Promise with the response
 */
export function deleteScript(id) {
  return apiClient.delete(`/scripts/${id}`);
}
