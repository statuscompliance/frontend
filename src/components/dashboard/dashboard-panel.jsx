import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3100';

export function DashboardPanel({ dashboardUid, panel, height = 300, preview = false }) {
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
        // En modo preview usamos una URL especial si está disponible
        baseUrl = `${GRAFANA_URL}/d-solo/preview`;
      } else {
        // URL normal para paneles existentes
        baseUrl = `${GRAFANA_URL}/d-solo/${dashboardUid}`;
      }

      // Parámetros comunes para la URL de Grafana
      const params = new URLSearchParams({
        orgId: 1,
        panelId: panel.id,
        from: 'now-6h',
        to: 'now',
        theme: 'light',
      });

      // Si es una preview, podemos añadir el panel y su configuración
      if (preview) {
        // Convertimos los datos del panel a un formato que Grafana pueda leer
        // Esto dependerá de la API específica de tu backend
        params.append('panelData', JSON.stringify({
          type: panel.type,
          title: panel.title,
          description: panel.description,
          options: panel.options,
          rawSql: panel.rawSql
        }));
      }

      setIframeUrl(`${baseUrl}?${params.toString()}`);
    } catch (err) {
      console.error('Error creating panel URL:', err);
      setError('Failed to load panel visualization');
    } finally {
      setLoading(false);
    }
  }, [dashboardUid, panel, preview]);

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
