/**
 * Data Transfer Object (DTO) for datasource responses
 * Removes sensitive and irrelevant information from datasource API responses
 */

/**
 * Transforms a datasource response to only include relevant public information
 * Removes: datasourceId, callInfo, metadata, telemetryContext, logMetadata
 * Keeps: message, datasourceName, methodUsed, result
 * 
 * @param {Object} response - The raw datasource response
 * @returns {Object} The cleaned response with only public information
 */
export function cleanDatasourceResponse(response) {
  if (!response || typeof response !== 'object') {
    return response;
  }

  // Extract only the relevant fields
  const cleanedResponse = {
    ...(response.message && { message: response.message }),
    ...(response.datasourceName && { datasourceName: response.datasourceName }),
    ...(response.methodUsed && { methodUsed: response.methodUsed }),
    ...(response.result !== undefined && { result: response.result }),
  };

  return cleanedResponse;
}

/**
 * Transforms multiple datasource responses
 * @param {Array} responses - Array of raw datasource responses
 * @returns {Array} Array of cleaned responses
 */
export function cleanDatasourceResponses(responses) {
  if (!Array.isArray(responses)) {
    return responses;
  }

  return responses.map(response => cleanDatasourceResponse(response));
}
