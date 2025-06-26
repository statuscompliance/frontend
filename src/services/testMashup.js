import { apiClient } from '@/api/apiClient'; // Tu cliente de API existente
import { getComputationsByControlId } from './controls';

export async function getAllCatalogs() {
  try {
    const response = await apiClient.get('/catalogs');
    return response;
  } catch (error) {
    console.error('Error fetching all catalogs:', error);
    throw error;
  }
}

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
      console.info("Created Draft Control:" ,JSON.stringify(response, null, 2));
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
 * Fetches the results and evidences (computations) for a given control.
 * This function reutilizes the existing getComputationsByControlId from controls.js.
 * @param {string} controlId - The ID of the control.
 * @returns {Promise<Array<object>>} - Promise resolving with a list of computations (results and evidences).
 */
export async function getControlTestResults(controlId) {
  try {
    const response = await getComputationsByControlId(controlId);
    return response.data; // Expects an array of computation objects
  } catch (error) {
    console.error(`Error fetching test results for control ${controlId}:`, error);
    throw error;
  }
}

// Si necesitas cargar los mashups dentro del modal y no se pasan por prop, puedes re-exportar getAllApiFlows
// export { getAllApiFlows };