import { apiClient } from '@/api/apiClient'; // Tu cliente de API existente
import { nodeRedClient } from '@/api/nodeRedClient';
import { createCatalog } from './catalogs';


/**
 * Gets all Node-RED flows (tabs), including their main input type and HTTP endpoint.
 * @returns {Promise<{data: Array<Object>}>} An object containing an array of custom flow objects.
 * Each flow object includes: id, name, description, numNodes, mainInputType, and endpoint.
 */
export async function getAllNodeRedFlows() {
  try {
    const response = await nodeRedClient.get('/flows');
    const flowsData = response.data || []; // Array of all Node-RED nodes and tabs

    const tabDetails = {}; // We'll use this object to build the info for each tab

    // First pass: Process all nodes to gather info by tab (id 'z')
    for (const node of flowsData) {
      if (node.type === 'tab') {
        // Initialize the entry for this tab
        tabDetails[node.id] = {
          id: node.id,
          name: node.label || node.name || 'Untitled Flow', // Prefer label, otherwise name
          description: node.info || 'No description',
          numNodes: 0, // Will be counted in the second pass
          mainInputType: 'None/Other',
          endpoint: null,
          nodes: [], // To store child nodes and count them later
        };
      } else if (node.z && tabDetails[node.z]) {
        // If it's a node and belongs to an already identified tab
        tabDetails[node.z].nodes.push(node);

        // Identify the main input type
        const inputNodeTypes = new Set([
          'http in', 'mqtt in', 'websocket in', 'inject',
          'cron', 'file in', 'tcp in', 'udp in'
        ]);

        if (inputNodeTypes.has(node.type)) {
          // If the current input type is 'http in', it becomes the main one.
          // Otherwise, only if a main type hasn't been assigned yet.
          if (node.type === 'http in') {
            tabDetails[node.z].mainInputType = node.type;
            // Capture the endpoint if it's an 'http in' node
            if (node.url) {
              tabDetails[node.z].endpoint = node.url;
            }
          } else if (tabDetails[node.z].mainInputType === 'None/Other') {
            tabDetails[node.z].mainInputType = node.type;
          }
        }
      }
    }

    // Second pass: Finalize the construction of flow objects
    const allFlowsInfo = Object.values(tabDetails).map(tab => {
      // Count the number of nodes for the tab
      tab.numNodes = tab.nodes.length;
      delete tab.nodes; // Clean up the temporary 'nodes' property

      return tab;
    });

    return { data: allFlowsInfo };

  } catch (error) {
    console.error('Error fetching all Node-RED flows:', error);
    // Rethrow the error so it can be caught by the calling code
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
      // Ensure we're iterating over the response correctly
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
 * Creates a new 'draft' catalog with today's startDate and endDate.
 *
 * @param {string} name - The name of the catalog.
 * @returns {Promise<object>} - Promise that resolves with the created catalog data.
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
    
    // Returns the catalogue by default, no response.data required
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
 * Creates a test control in the backend.
 * Adjusted to directly return the API response object,
 * assuming the control is already at the root of the HTTP response.
 *
 * @param {string} mashupName - The name of the mashup for which the test control is being created.
 * @param {string} selectedCatalogId - The ID of the catalog selected by the user in the modal.
 * @returns {Promise<object>} - Promise that resolves with the created control data.
 */
export async function createTestControl(mashupName, selectedCatalogId) {
  try {
    const initialControlData = {
      name: `Test for Mashup: ${mashupName || 'Untitled'} - ${new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}`,
      description: `Auto-generated control for testing API mashup: ${mashupName || 'Untitled Flow'}`,
      period: 'DAILY',
      startDate: `${new Date().toISOString()}`,
      params: {
        endpoint: '/draft-endpoint',
        threshold: 0
      },
      status: 'draft',
      catalogId: Number(selectedCatalogId),
    };

    const response = await apiClient.post('/controls', initialControlData);

    if (response) {
      console.info('Created Draft Control:', JSON.stringify(response, null, 2));
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
 * Executes a Node-RED flow by sending a msg-type payload to the endpoint.
 *
 * @param {string} endpoint - The path of the Node-RED flow endpoint (e.g., '/my-flow').
 * @param {object} payload - The 'msg' object to send to the flow (e.g., { payload: 'Hello' }).
 * @returns {Promise<any>} - The direct response from the Node-RED flow.
 */
export async function executeNodeRedMashup(endpoint, body, credentials, accessToken) {

  if (!credentials) {
    console.warn('Warning: Node-RED credentials are not properly configured.');
  }

  if(!accessToken){
    console.warn('Warning: Node-RED accessToken is not properly configured.');
  }

  try {
    const response = await nodeRedClient.post(`/api/v1${endpoint}`, body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'x-access-token': accessToken
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error executing Node-RED mashup:', error);
    throw error;
  }
}
