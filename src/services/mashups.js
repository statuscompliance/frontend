import { apiClient } from '@/api/apiClient'; // Tu cliente de API existente
import { nodeRedClient } from '@/api/nodeRedClient';
import { createCatalog } from './catalogs';
export { getAllCatalogs } from './catalogs';

const encodeToBase64 = (str) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    const binaryString = String.fromCharCode.apply(null, data);

    return btoa(binaryString);
};

/**
 * Obtiene todos los flujos (tabs) de Node-RED, incluyendo su tipo de entrada principal y el endpoint HTTP.
 * @returns {Promise<{data: Array<Object>}>} Un objeto que contiene un array de objetos de flujo personalizados.
 * Cada objeto de flujo incluye: id, name, description, numNodes, mainInputType, y endpoint.
 */
export async function getAllNodeRedFlows() {
  try {
    const response = await nodeRedClient.get('/flows');
    const flowsData = response.data || []; // Array de todos los nodos y tabs de Node-RED

    const tabDetails = {}; // Usaremos este objeto para construir la información de cada tab

    // Primera pasada: Procesar todos los nodos para recopilar información por tab (id 'z')
    for (const node of flowsData) {
      if (node.type === 'tab') {
        // Inicializar la entrada para esta tab
        tabDetails[node.id] = {
          id: node.id,
          name: node.label || node.name || 'Untitled Flow', // Preferir label, sino name
          description: node.info || 'No description',
          numNodes: 0, // Se contará en la segunda pasada
          mainInputType: 'None/Other',
          endpoint: null,
          nodes: [], // Para almacenar los nodos hijos y luego contarlos
        };
      } else if (node.z && tabDetails[node.z]) {
        // Si es un nodo y pertenece a una tab ya identificada
        tabDetails[node.z].nodes.push(node);

        // Identificar el tipo de entrada principal
        const inputNodeTypes = new Set([
          'http in', 'mqtt in', 'websocket in', 'inject',
          'cron', 'file in', 'tcp in', 'udp in'
        ]);

        if (inputNodeTypes.has(node.type)) {
          // Si el tipo de entrada actual es 'http in', se convierte en el principal.
          // De lo contrario, solo si aún no se ha asignado un tipo principal.
          if (node.type === 'http in') {
            tabDetails[node.z].mainInputType = node.type;
            // Capturar el endpoint si es un nodo 'http in'
            if (node.url) {
              tabDetails[node.z].endpoint = node.url;
            }
          } else if (tabDetails[node.z].mainInputType === 'None/Other') {
            tabDetails[node.z].mainInputType = node.type;
          }
        }
      }
    }

    // Segunda pasada: Finalizar la construcción de los objetos de flujo
    const allFlowsInfo = Object.values(tabDetails).map(tab => {
      // Contar el número de nodos para la tab
      tab.numNodes = tab.nodes.length;
      delete tab.nodes; // Limpiar la propiedad temporal 'nodes'

      return tab;
    });

    console.log("Flujos de Node-RED procesados:", allFlowsInfo); // Para depuración

    return { data: allFlowsInfo };

  } catch (error) {
    console.error("Error fetching all Node-RED flows:", error);
    // Relanzar el error para que pueda ser capturado por el código que llama
    throw error;
  }
}

/**
 * Gets a Node-RED flow by ID
 * @param {string} id - Flow ID
 * @returns {Promise} - Promise with the flow
 */
export function getFlowById(id) {
  return nodeRedClient.get(`/flow/${id}`);
}

/**
 * Gets the flat params from all nodes in a flow by flowId.
 * It aggregates the "params" objects from each node into a single object.
 * @param {string} flowId - Flow ID
 * @returns {Promise} - Promise with an object containing the merged params
 */
export function getFlowParams(flowId) {
  return getFlowById(flowId)
    .then(response => {
      const params = {};
      // Aseguramos que estamos iterando sobre la respuesta correctamente
      const nodes = response.data.nodes || [];
      nodes.forEach(node => {
        if (node.params && typeof node.params === 'object') {
          Object.assign(params, node.params);
        }
      });
      return { data: params };
    });
}

/**
 * Crea un nuevo catálogo de tipo 'draft' con startDate y endDate de hoy.
 *
 * @param {string} name - El nombre del catálogo.
 * @returns {Promise<object>} - Promesa que resuelve con los datos del catálogo creado.
 */
export async function createDraftCatalog() {
  try {
    const now = new Date();
    const uniqueSuffix = now.toISOString();
    const catalogName = `Test Draft Catalog - ${uniqueSuffix}`;

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const catalogData = {
      name: catalogName,
      description: `Auto-generated draft catalog for API Mashup test: ${now.toLocaleString('es-ES')}`,
      status: 'draft',
      startDate: todayStart.toISOString(),
      endDate: todayEnd.toISOString(),
    };

    const response = await createCatalog(catalogData);
    console.log("Response: ", JSON.stringify(response, null, 2));

    //Returns the catalogue by default, no response.data required
    if (response) {
      return response;
    } else {
      console.warn('API returned an unexpected response for creating a catalog:', response);
      throw new Error('Failed to create draft catalog: No valid data received from API.');
    }
  } catch (error) {
    console.error('Error creating draft catalog:', error);
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
export async function executeNodeRedMashup(url, payload) {
  const username = 'admin';
  const password = 'admin123';

  if (!username || !password) {
    console.warn("Advertencia: Las credenciales de Node-RED no están configuradas correctamente. La autenticación podría fallar.");
    // Considera lanzar un error o manejar esto de forma más robusta en producción.
  }

  // 2. Codificar las credenciales en Base64
  const credentials = encodeToBase64(`${username}:${password}`);

  try {
    const response = await nodeRedClient.post(`/api/v1/${url}`, payload, {
      headers: {
        'Content-Type': 'application/json',
        // 3. Añadir el encabezado Authorization
        'Authorization': `Basic ${credentials}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error executing Node-RED mashup:', error.response ? error.response.data : error.message);
    throw error; // Re-lanza el error para que sea manejado por el componente de UI
  }
}
