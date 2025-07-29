import { useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Page from '@/components/basic-page.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleAlert } from 'lucide-react';

export function Editor() {
  const { id } = useParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, _setError] = useState(null);
  const flowName = location.state?.flowName || 'Flow';
  
  // URL del editor de Node-RED, obtenida de variables de entorno
  const nodeRedUrl = `${import.meta.env.VITE_NODE_RED_URL || 'http://localhost:1880'}/#flow/${id}`;
  
  // Manejo de carga del iframe
  const handleIframeLoad = () => {
    setLoading(false);
  };

  // Abrir en nueva pestaña
  const handleOpenInNewTab = () => {
    window.open(nodeRedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Page flowName={flowName}>
      <div className="container mx-auto px-4">
        <Card className="w-full overflow-hidden bg-muted">
          {error ? (
            <Alert variant="destructive" className="m-4">
              <CircleAlert className="h-4 w-4" />
              <AlertTitle>Conexion Error</AlertTitle>
              <AlertDescription>
                {error}
                <div className="mt-4">
                  <Button onClick={handleOpenInNewTab} variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in new tab
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <CardContent className="relative min-h-[calc(100vh-240px)] p-0">
              {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="ml-2">Loading Node-RED editor...</span>
                </div>
              )}
              <div className="flex justify-between bg-muted p-2">
                <div className='flex items-center'>
                  <p className="mt-1 text-xs">
                    Server: {import.meta.env.VITE_NODE_RED_URL}
                  </p>
                  <Badge 
                    variant={loading ? 'outline' : error ? 'destructive' : 'success'} 
                    className="ml-2 flex items-center bg-white"
                  >
                    <div
                      className={`mr-2 h-2 w-2 rounded-full ${
                        error ? 'bg-red-500' : loading ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                    />
                    {loading ? 'Loading...' : error ? 'Error' : 'Connected'}
                  </Badge>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleOpenInNewTab}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in new tab
                </Button>
              </div>
              <iframe 
                src={nodeRedUrl}
                className="h-[calc(100vh-290px)] w-full"
                title="Node-RED Editor"
                onLoad={handleIframeLoad}
                allow="clipboard-read; clipboard-write"
              />
            </CardContent>
          )}
        </Card>
      </div>
    </Page>
  );
}

export default Editor;
