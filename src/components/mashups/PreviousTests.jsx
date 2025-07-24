import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export function PreviousTests({ 
  tests, 
  onDeleteTest, 
  onViewTest, 
  mashupName 
}) {
  if (!tests || tests.length === 0) {
    return (
      <Card className="h-fit w-full">
        <CardHeader>
          <CardTitle>Previous Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-4 text-center text-muted-foreground">
            No previous tests found for this mashup.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTestStatus = (test) => {
    if (test.results?.error) return 'error';
    if (test.results?.computationResults?.code === 200) return 'success';
    if (test.results?.mashupResponse) return 'partial';
    return 'unknown';
  };

  const getStatusBadge = (status) => {
    switch (status) {
    case 'success':
      return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    case 'partial':
      return <Badge className="bg-yellow-100 text-yellow-800">Partial</Badge>;
    case 'error':
      return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <Card className="h-fit w-full">
      <CardHeader>
        <CardTitle className="text-xl">Previous Tests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tests.map((test) => {
          const status = getTestStatus(test);
          const computationsCount = test.results?.computationResults?.computations?.length || 0;
          
          return (
            <div
              key={test.id}
              className="flex items-center justify-between border rounded-lg p-3 hover:bg-gray-50"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusBadge(status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(test.timestamp), 'MMM dd, yyyy HH:mm')}
                  </div>
                  {computationsCount > 0 && (
                    <span>{computationsCount} computations</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewTest(test)}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteTest(test.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
