import { apiClient } from '@/api/apiClient'; // Tu cliente de API existente
import { nodeRedClient } from '@/api/nodeRedClient';
export { getAllCatalogs } from './catalogs';

/**
 * Crea un control de prueba en el backend.
 * Ajustado para devolver directamente el objeto de respuesta del API,
 * asumiendo que el control ya está en la raíz de la respuesta HTTP.
 *
 * @param {string} mashupName - El nombre del mashup para el que se está creando el control de prueba.
 * @param {string} selectedCatalogId - El ID del catálogo seleccionado por el usuario en el modal.
 * @returns {Promise<object>} - Promesa que resuelve con los datos del control creado.
 */
export async function createTestControl(mashupName, selectedCatalogId) {
  try {
    const initialControlData = {
      name: `Test for Mashup: ${mashupName || 'Untitled'} - ${new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}`,
      description: `Auto-generated control for testing API mashup: ${mashupName || 'Untitled Flow'}`,
      period: 'DAILY',
      startDate: `${new Date().toISOString()}`,
      params: {
        endpoint: "/draft-endpoint",
        threshold: 0
      },
      status: 'draft',
      catalogId: Number(selectedCatalogId),
    };

    const response = await apiClient.post('/controls', initialControlData);

    if (response) {
      console.info("Created Draft Control:", JSON.stringify(response, null, 2));
      return response;
    } else {
      console.warn('API returned a successful response for creating a test control, but the response object was empty or null:', response);
      throw new Error('Failed to create test control: No valid response received from API.');
    }
  } catch (error) {
    console.error('Error creating test control:', error);
    throw error;
  }
}

/**
 * Ejecuta un flujo de Node-RED enviando un payload tipo msg al endpoint.
 *
 * @param {string} endpoint - El path del endpoint del flujo de Node-RED (ej. '/my-flow').
 * @param {object} payload - El objeto 'msg' a enviar al flujo (ej. { payload: 'Hello' }).
 * @returns {Promise<any>} - La respuesta directa del flujo de Node-RED.
 */
export async function executeNodeRedMashup(endpoint, payload) {
  try {
    const response = await nodeRedClient.post(endpoint, payload);

    return response.data; // Devuelve la data de la respuesta del mashup
  } catch (error) {
    console.error(`Error executing Node-RED mashup at ${endpoint} with payload:`, payload, error);
    // Propaga el error para que el componente lo capture
    throw error;
  }
}
