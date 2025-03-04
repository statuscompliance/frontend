import authService from './auth';
import dashboardsService from './dashboards';
import datasourcesService from './datasources';
import foldersService from './folders';
import queriesService from './queries';
import searchService from './search';

/**
 * Grafana services organized by categories
 */
export const grafanaService = {
  auth: authService,
  dashboards: dashboardsService,
  datasources: datasourcesService,
  folders: foldersService,
  queries: queriesService,
  search: searchService
};

export {
  authService,
  dashboardsService,
  datasourcesService,
  foldersService,
  queriesService,
  searchService
};

export default grafanaService;
