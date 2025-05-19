import { useState, useEffect, useRef } from 'react';
import { DashboardPanel } from './dashboard-panel';
import { dashboardsService } from '@/services/grafana/dashboards';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Component that creates a temporary dashboard and shows a real preview of the panel
 * using the provided configuration in an actual Grafana panel.
 */
export function PanelPreview({ 
  panelConfig, 
  height = 300, 
  baseDashboardUid = null,
  onClose = () => {},
  showCloseButton = false,
  customTimeRange = null
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tempDashboard, setTempDashboard] = useState(null);
  const [tempPanel, setTempPanel] = useState(null);
  
  // Get timeRange from panelConfig first, use customTimeRange as fallback, or use a default value
  const [timeRange, setTimeRange] = useState(() => {
    if (panelConfig?.time) {
      return panelConfig.time;
    } else if (customTimeRange) {
      return customTimeRange;
    } else {
      return { from: 'now-7d', to: 'now' }; // Wider time range to avoid "Zoom out of range" issues
    }
  });
  
  const [dashboardUrl, setDashboardUrl] = useState(null);
  const [dashboardCreated, setDashboardCreated] = useState(false);
  
  // References to track dashboard creation across renders
  const creationInProgressRef = useRef(false);
  const dashboardUidRef = useRef(null);

  // Create a temporary dashboard when the component mounts
  useEffect(() => {
    if (dashboardCreated || !panelConfig) {
      setLoading(false);
      return;
    }
    
    const createTempDashboard = async () => {
      if (creationInProgressRef.current || dashboardCreated) {
        return;
      }
      
      creationInProgressRef.current = true;
      setLoading(true);
      setError(null);
      
      try {
        // Ensure panelConfig has a timeRange
        const configWithTimeRange = {
          ...panelConfig,
          time: panelConfig.time || timeRange
        };
        
        const options = {
          timeRange: configWithTimeRange.time,
          autoCleanup: true
        };
        
        const response = await dashboardsService.createTemporaryDashboard(configWithTimeRange, baseDashboardUid, options);
        
        const responseData = response.data || response;
        
        if (responseData && responseData.dashboard) {
          setTempDashboard(responseData.dashboard);
          dashboardUidRef.current = responseData.dashboard.uid;
          
          setDashboardCreated(true);
          
          const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3100';
          const dashUrl = `${grafanaUrl}/d/${responseData.dashboard.uid}`;
          setDashboardUrl(dashUrl);
          
          // Create temporary panel data until we get real panel info
          const tempPanelData = {
            id: 1,
            title: panelConfig.title || 'Panel Preview',
            type: panelConfig.type || 'gauge',
            description: panelConfig.description || '',
            options: panelConfig.options || {},
            rawSql: panelConfig.sql || '',
            panelId: 1 
          };
          
          setTempPanel(tempPanelData);
          
          // Try to get panels after creating the dashboard
          setTimeout(async () => {
            try {
              const panelsResponse = await dashboardsService.getPanels(dashboardUidRef.current);
              const panels = Array.isArray(panelsResponse) 
                ? panelsResponse 
                : (panelsResponse.data || []);

              if (panels && panels.length > 0) {
                setTempPanel(panels[0]);
              }
            } catch (panelErr) {
              console.warn('Could not get panels from dashboard:', panelErr);
            }
          }, 1000); // Wait for Grafana to process the dashboard
        } else {
          throw new Error('Temporary dashboard information was not received');
        }
      } catch (err) {
        console.error('Error creating temporary dashboard:', err);
        setError(err.message || 'Error creating temporary dashboard');
        setDashboardCreated(false);
        creationInProgressRef.current = false;
      } finally {
        setLoading(false);
      }
    };

    if (!creationInProgressRef.current) {
      createTempDashboard();
    }

    // Clean up temporary dashboard when component unmounts
    return () => {
      if (dashboardUidRef.current) {
        dashboardsService.delete(dashboardUidRef.current)
          .catch(err => console.error('Error deleting temporary dashboard:', err));
        dashboardUidRef.current = null;
        creationInProgressRef.current = false;
      }
    };
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelConfig, baseDashboardUid]);

  // Update timeRange when panelConfig or customTimeRange changes
  useEffect(() => {
    const newTimeRange = panelConfig?.time || customTimeRange || { from: 'now-7d', to: 'now' };
    setTimeRange(newTimeRange);
  }, [panelConfig, customTimeRange]);

  // Loading state
  if (loading) {
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center">
        <div className="text-center">
          <Skeleton className="mb-2 h-[80%] w-full" />
          <p className="text-sm text-muted-foreground">Creating preview...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{ height: `${height}px` }} className="flex flex-col items-center justify-center">
        <Alert variant="destructive" className="max-w-xl w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Preview Error</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{typeof error === 'object' ? JSON.stringify(error) : error}</p>
            <p className="mt-2 text-sm">
              The temporary dashboard was created, but panel information could not be obtained.
              Try again or check the panel configuration.
            </p>
            {dashboardUrl && (
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(`${dashboardUrl}?from=${encodeURIComponent(timeRange.from)}&to=${encodeURIComponent(timeRange.to)}`, '_blank')}
                >
                  View dashboard in Grafana
                </Button>
              </div>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No dashboard created
  if (!tempDashboard) {
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Could not create temporary dashboard</p>
      </div>
    );
  }

  // Successful state - show panel or dashboard
  return (
    <div className="flex flex-col space-y-2">
      <div className="rounded-md bg-muted/10 p-2 text-center text-sm text-muted-foreground">
        {!tempPanel && <p className="mt-1 text-xs text-yellow-600 font-medium">Showing full dashboard due to missing panel information</p>}
      </div>
      
      {tempPanel ? (
        // Show panel with timeRange
        <DashboardPanel 
          dashboardUid={tempDashboard.uid} 
          panel={tempPanel} 
          height={height} 
          timeRange={timeRange}
        />
      ) : (
        // Show iframe with the complete dashboard
        <div className="overflow-hidden border rounded-md" style={{ height: `${height}px` }}>
          <iframe 
            src={`${dashboardUrl || `${import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3100'}/d/${tempDashboard.uid}`}?from=${encodeURIComponent(timeRange.from)}&to=${encodeURIComponent(timeRange.to)}&theme=light&kiosk`}
            width="100%"
            height="100%"
            title="Dashboard Preview"
            allow="fullscreen"
          />
        </div>
      )}

      {showCloseButton && (
        <div className="mt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close preview
          </Button>
        </div>
      )}
    </div>
  );
}
