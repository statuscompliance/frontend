import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, ExternalLink } from 'lucide-react';

function HierarchicalTestResults({ testResults }) {

  const renderComputationSummary = (computations) => {
    if (!computations || !Array.isArray(computations)) return null;

    const totalComputations = computations.length;
    const computationsWithEvidences = computations.reduce((acc, comp) => {
      return acc + (comp.evidences ? comp.evidences.length : 0);
    }, 0);

    return (
      <div className="mb-4 rounded-lg bg-blue-50 p-4">
        <h4 className="mb-2 text-blue-900 font-semibold">Summary</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Total Computations:</span> {totalComputations}
          </div>
          <div>
            <span className="font-medium">Total Evidences:</span> {computationsWithEvidences}
          </div>
        </div>
      </div>
    );
  };

  const renderEvidenceTable = (evidences) => {
    if (!evidences || !Array.isArray(evidences)) return null;

    return (
      <div className="mt-4">
        <h5 className="mb-2 font-medium">Evidences ({evidences.length})</h5>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Scope</TableHead>
              <TableHead className="text-left">Value</TableHead>
              <TableHead className="text-left">Document</TableHead>
              <TableHead className="text-left">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {evidences.map((evidence, index) => (
              <TableRow key={evidence.id || index}>
                <TableCell className="text-left">
                  {evidence.scope ? (
                    <div className="text-xs">
                      {evidence.scope.member && <div><strong>Member:</strong> {evidence.scope.member}</div>}
                      {evidence.scope.project && <div><strong>Project:</strong> {evidence.scope.project}</div>}
                      {evidence.scope.class && <div><strong>Class:</strong> {evidence.scope.class}</div>}
                    </div>
                  ) : 'N/A'}
                </TableCell>
                <TableCell className="text-left">
                  {evidence.value !== null && evidence.value !== undefined ? (
                    <Badge className={evidence.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {String(evidence.value)}
                    </Badge>
                  ) : (
                    <span className="text-gray-500">null</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate text-left text-xs">
                  {evidence.evidences?.[0]?.document || 'No document'}
                </TableCell>
                <TableCell className="text-left text-xs">
                  {evidence.createdAt ? new Date(evidence.createdAt).toLocaleString() : 'N/A'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Computation Results Section */}
      {testResults.computationResults && (
        <div>
          <div className="space-y-4">
            {/* Computations Summary */}
            {testResults.computationResults.computations && 
              renderComputationSummary(testResults.computationResults.computations)}

            {/* Detailed Computations */}
            {testResults.computationResults.computations && 
              testResults.computationResults.computations.map((computation, index) => (
                <div key={computation.id || index} className="border rounded p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <h4 className="font-semibold">
                      Compliance Result:
                    </h4>
                    <div className="flex items-center gap-2">
                      {computation.value !== null && computation.value !== undefined && (
                        <Badge className={computation.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {String(computation.value)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Computation Scope */}
                  {computation.scope && (
                    <div className="mb-4 rounded bg-gray-50 p-3">
                      <h5 className="mb-2 font-medium">Scope</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {computation.scope.project && (
                          <div><strong>Project:</strong> {computation.scope.project}</div>
                        )}
                        {computation.scope.class && (
                          <div><strong>Class:</strong> {computation.scope.class}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Evidences Table */}
                  {computation.evidences && renderEvidenceTable(computation.evidences)}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Error Section */}
      {testResults.error && (
        <div className="border-red-200 rounded-lg bg-red-50 p-4">
          <h3 className="text-red-800 font-semibold">Error</h3>
          <pre className="mt-2 text-sm text-red-700">{testResults.error}</pre>
        </div>
      )}
    </div>
  );
}

export function TestResults({ 
  testResults, 
  loadingTestExecution, 
  mashupDetails, 
  onReset, 
  onClose 
}) {
  if (loadingTestExecution) {
    return (
      <Card className="h-fit w-full">
        <CardHeader>
          <CardTitle>Running Test...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Running mashup test...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (testResults) {
    return (
      <Card className="h-fit w-full">
        <CardContent className="w-full overflow-hidden pt-8 space-y-4">
          <HierarchicalTestResults testResults={testResults} />
          
          {mashupDetails?.id && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => window.open(`/red#flow/${mashupDetails.id}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Mashup in Node-RED
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit w-full">
      <CardHeader>
        <CardTitle>Mashup Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          The test will run automatically after creating the control.
        </p>
      </CardContent>
    </Card>
  );
}
