import { nodeRedClient } from '@/api/nodeRedClient';
/**
 * Gets all Node-RED flows (tabs) and identifies their primary input types.
 * @returns {Promise<Array>} - Promise with the list of Node-RED flow tabs,
 * each enriched with 'mainInputType' and 'numNodes'.
 */
export async function getAllNodeRedFlows() {
  return nodeRedClient.get('/flows')
    .then(response => {
      const flowsData = response.data;
      const nodeCounts = {};
      const tabInputTypes = {};

      const inputNodeTypes = new Set([
        'http in',
        'mqtt in',
        'websocket in',
        'inject',
        'cron',
        'file in',
        'tcp in',
        'udp in'
      ]);

      for (const node of flowsData) {
        if (node.type !== 'tab' && node.z) {
          nodeCounts[node.z] = (nodeCounts[node.z] || 0) + 1;

          if (inputNodeTypes.has(node.type)) {
            if (!tabInputTypes[node.z] || node.type === 'http in') {
              tabInputTypes[node.z] = node.type;
            }
          }
        }
      }

      const allFlowsInfo = flowsData.reduce((tabs, flow) => {
        if (flow.type === 'tab') {
          flow.numNodes = nodeCounts[flow.id] || 0; 
          flow.mainInputType = tabInputTypes[flow.id] || 'None/Other';
          tabs.push(flow);
        }
        return tabs;
      }, []);

      return { data: allFlowsInfo };
    })
    .catch(error => {
      console.error("Error fetching all Node-RED flows:", error);
      throw error;
    });
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