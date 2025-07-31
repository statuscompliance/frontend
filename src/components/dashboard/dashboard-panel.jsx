import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3100';

export function DashboardPanel({ dashboardUid, panel, height = 300, preview = false, timeRange = null }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    if (!panel) {
      setError('Panel data is missing');
      setLoading(false);
      return;
    }

    try {
      // Construye la URL para la visualización de Grafana
      let baseUrl;
      
      if (preview) {
        // En modo preview usamos una vista previa local en lugar de un iframe
        setLoading(false);
        return;
      } else {
        // URL normal para paneles existentes
        baseUrl = `${GRAFANA_URL}/d-solo/${dashboardUid}`;
      }

      // Preparar parámetros de tiempo para Grafana
      let fromTime = 'now-6h';
      let toTime = 'now';
      
      // Si se proporciona un rango de tiempo, úsalo
      if (timeRange && timeRange.from && timeRange.to) {
        // Si es un timestamp o fecha, conviértelo al formato ISO
        if (typeof timeRange.from === 'object' && timeRange.from instanceof Date) {
          fromTime = timeRange.from.toISOString();
        } else {
          fromTime = timeRange.from;
        }
        
        if (typeof timeRange.to === 'object' && timeRange.to instanceof Date) {
          toTime = timeRange.to.toISOString();
        } else {
          toTime = timeRange.to;
        }
      }

      // Parámetros para la URL de Grafana
      const params = new URLSearchParams({
        orgId: 1,
        panelId: panel.id,
        from: fromTime,
        to: toTime,
        theme: 'light',
      });

      setIframeUrl(`${baseUrl}?${params.toString()}`);
    } catch (err) {
      console.error('Error creating panel URL:', err);
      setError('Failed to load panel visualization');
    } finally {
      setLoading(false);
    }
  }, [dashboardUid, panel, preview, timeRange]);

  // Manejador para cuando el iframe termina de cargar
  const handleIframeLoad = () => {
    setLoading(false);
  };

  // Manejador para errores del iframe
  const handleIframeError = () => {
    setError('Failed to load panel visualization');
    setLoading(false);
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {typeof error === 'object' ? JSON.stringify(error) : error}
        </AlertDescription>
      </Alert>
    );
  }

  // Vista previa local para paneles en modo preview
  if (preview) {
    return (
      <div style={{ height: `${height}px` }} className="flex flex-col items-center justify-center border rounded-md bg-muted/10 p-4">
        <div className="mb-4 text-center">
          <h3 className="font-medium">{panel.title || 'Panel Preview'}</h3>
          {panel.description && <p className="mt-1 text-sm text-muted-foreground">{panel.description}</p>}
        </div>
        <div className="h-[70%] w-full flex items-center justify-center">
          <div className="max-w-md text-center text-sm text-muted-foreground">
            <p className="mb-2">Vista previa del panel tipo: <strong>{panel.type}</strong></p>
            {panel.rawSql && (
              <div className="mt-4 text-left">
                <p className="mb-1 font-medium">SQL Query:</p>
                <pre className="max-h-[100px] overflow-auto rounded-md bg-muted p-2 text-xs">
                  {panel.rawSql}
                </pre>
              </div>
            )}
            <p className="mt-4 text-xs">
              Esta es una vista previa. El panel se visualizará correctamente cuando se añada al dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay panel o URL, mostrar un mensaje adecuado
  if (!panel || !iframeUrl) {
    return (
      <div style={{ height: `${height}px` }} className="flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">No panel data available</p>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height: `${height}px` }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="h-full w-full" />
        </div>
      )}
      {console.log('Rendering panel:', panel.id, 'with URL:', iframeUrl)}
      
      <iframe
        title={panel.title || `Panel ${panel.id}`}
        src={iframeUrl}
        width="100%"
        height={height}
        frameBorder="0"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        className={loading ? 'opacity-0' : 'opacity-100'}
        style={{ transition: 'opacity 0.3s' }}
      />
    </div>
  );
}

export default DashboardPanel;
