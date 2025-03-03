import { nodeRedClient } from '@/api/nodeRedClient';

/**
 * Gets all Node-RED flows that contain API URLs
 * @returns {Promise} - Promise with the list of flows that contain API URLs
 */
export function getAllApiFlows() {
  return nodeRedClient.get('/flows')
    .then(response => {
      const apiTabIds = new Set();
      const nodeCounts = {};
      const tabIdToUrl = {};

      for (const flow of response.data) {
        if (flow.type !== 'tab' && flow.z) {
          nodeCounts[flow.z] = (nodeCounts[flow.z] || 0) + 1;
          if (flow.type === 'http in') {
            apiTabIds.add(flow.z);
            tabIdToUrl[flow.z] = flow.url;
          }
        }
      }

      const mashupsInfo = response.data.reduce((tabs, flow) => {
        if (flow.type === 'tab') {
          flow.numNodes = nodeCounts[flow.id] || 0;
          if (apiTabIds.has(flow.id)) {
            flow.url = tabIdToUrl[flow.id];
            tabs.push(flow);
          }
        }
        return tabs;
      }, []);
      return { data: mashupsInfo };
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
