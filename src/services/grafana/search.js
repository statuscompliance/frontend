import { apiClient } from '@/api/apiClient';

/**
 * Services for searching Grafana dashboards and folders
 */
export const searchService = {
  /**
   * Search for dashboards and folders
     * @param {string} [query] Search Query
     * @param {Array<string>} [tag] List of tags to search for
     * @param {SearchTypeEnum} [type] Type to search for, dash-folder or dash-db
     * @param {Array<string>} [dashboardUIDs] List of dashboard uid’s to search for
     * @param {Array<string>} [folderUIDs] List of folder UID’s to search in for dashboards If it\&#39;s an empty string then it will query for the top level folders
     * @param {boolean} [starred] Flag indicating if only starred Dashboards should be returned
     * @param {number} [limit] Limit the number of returned results (max 5000)
     * @param {number} [page] Use this parameter to access hits beyond limit. Numbering starts at 1. limit param acts as page size. Only available in Grafana v6.2+.
     * @param {SearchPermissionEnum} [permission] Set to &#x60;Edit&#x60; to return dashboards/folders that the user can edit
     * @param {SearchSortEnum} [sort] Sort method; for listing all the possible sort methods use the search sorting endpoint.
     * @param {boolean} [deleted] Flag indicating if only soft deleted Dashboards should be returned
     * @param {*} [options] Override http request option.
   * @returns {Promise} - Promise with the search results
   */
  search: (options = {}) => {
    return apiClient.get('/grafana/search', { params: options });
  }
};

export default searchService;

