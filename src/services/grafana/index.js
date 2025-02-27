import authService from './auth';
import dashboardsService from './dashboards';
import datasourcesService from './datasources';
import foldersService from './folders';
import queriesService from './queries';

/**
 * Grafana services organized by categories
 */
export const grafanaService = {
  auth: authService,
  dashboards: dashboardsService,
  datasources: datasourcesService,
  folders: foldersService,
  queries: queriesService
};

export {
  authService,
  dashboardsService,
  datasourcesService,
  foldersService,
  queriesService
};

export default grafanaService;
