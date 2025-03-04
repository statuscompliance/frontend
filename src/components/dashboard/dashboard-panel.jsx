import { useState, useEffect } from 'react';
import { dashboardsService } from '@/services/grafana/dashboards';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Obtenemos la URL base de Grafana desde las variables de entorno
const GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3100';

/**
 * Renders a Grafana panel inside our application using iframe
 * @param {Object} props Component props
 * @param {string} props.dashboardUid UID of the dashboard containing the panel
 * @param {Object} props.panel Panel data object
 * @param {number} props.height Height of the panel in pixels
 * @param {boolean} props.showTitle Whether to display the panel title
 */
export function DashboardPanel({ dashboardUid, panel, height = 300, showTitle = false }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPanelData = async () => {
      if (!dashboardUid || !panel || !panel.id) return;

      try {
        setLoading(true);
      
        if (panel.rawSql) {
          setError(null);
          setLoading(false);
          return;
        }
        
        // Attempt to get the panel query, though it is not used further
        try {
          await dashboardsService.getPanelQuery(dashboardUid, panel.id);
        } catch (queryErr) {
          console.warn('Could not load panel query:', queryErr);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading panel data:', err);
        setError('Failed to load panel data');
      } finally {
        setLoading(false);
      }
    };

    fetchPanelData();
  }, [dashboardUid, panel]);

  // Construir la URL del iframe para el panel de Grafana
  const buildGrafanaIframeUrl = () => {
    if (!dashboardUid || !panel || !panel.id) return '';
    
    // Usar el tiempo actual para from/to si no está definido
    const now = Date.now();
    const timeRange = {
      from: now - 6 * 60 * 60 * 1000, // 6 horas atrás por defecto
      to: now
    };
    
    // URL para el panel en modo solo (d-solo)
    return `${GRAFANA_URL}/d-solo/${dashboardUid}/${panel.slug || 'dashboard'}?orgId=1&from=${timeRange.from}&to=${timeRange.to}&timezone=browser&theme=light&panelId=${panel.id}`;
  };

  if (loading) {
    return <Skeleton className="w-full" style={{ height: `${height}px` }} />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  const iframeUrl = buildGrafanaIframeUrl();

  return (
    <div style={{ height: `${height}px`, overflow: 'hidden' }}>
      {showTitle && panel.title && (
        <div className="panel-header p-2 bg-card">
          <h3 className="text-base font-medium">{panel.title}</h3>
          {panel.description && (
            <p className="text-xs text-muted-foreground">{panel.description}</p>
          )}
        </div>
      )}
      
      <iframe 
        src={iframeUrl} 
        width="100%" 
        height={showTitle ? `${height - 40}px` : `${height}px`} 
        title={`Panel: ${panel.title || panel.id}`}
        className="w-full"
        loading="lazy"
        style={{ border: 'none' }}
      />
    </div>
  );
}

export default DashboardPanel;
