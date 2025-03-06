import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, ExternalLink, CircleCheck, CircleX, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import Page from '@/components/basic-page.jsx';
import { ScopeSetForm } from '@/forms/scopeSet/form';
import { ControlForm } from '@/forms/control/form';
import { useAuth } from '@/hooks/use-auth';

const columnHelper = createColumnHelper();

const mockEvidences = [
  { 
    id: 'fbc4c50a-c21a-45f3-87af-27116ac8d56c', 
    key: 'AND operation', 
    value: [true, true], 
    result: true,
    from: '2023-06-01T08:00:00',
    to: '2023-06-01T17:30:00'
  },
  {
    id: '2cfd4036-22c7-4533-babf-b339f2237acb',
    key: 'url',
    value: 'https://github.com/statuscompliance/infrastructure/blob/examples/files/receipts/payment81001.pdf',
    result: true,
    from: '2023-06-02T09:15:00',
    to: '2023-06-02T19:45:00'
  },
  { 
    id: '3', 
    key: 'password_length', 
    value: 10, 
    result: true,
    from: '2023-06-03T07:30:00',
    to: '2023-06-03T16:00:00'
  },
  { 
    id: '4', 
    key: 'special_char_present', 
    value: false, 
    result: false,
    from: '2023-06-04T10:00:00',
    to: '2023-06-04T18:30:00'
  },
];

// Mock scopes data
const mockAvailableScopes = [
  { id: 'env-1', name: 'environment' },
  { id: 'crit-1', name: 'criticality' },
  { id: 'region-1', name: 'region' },
  { id: 'cloud-1', name: 'cloud-provider' },
];

export function ControlDetails() {
  const params = useParams();
  const location = useLocation();
  const { userData } = useAuth();
  
  // Use control data from the state if available
  const controlData = location.state?.control;
  const catalogData = location.state?.catalogData;
  
  const [control, setControl] = useState(null);
  const [evidences, setEvidences] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [editingControl, setEditingControl] = useState(false);
  const [editingScopes, setEditingScopes] = useState(false);

  // Temporal scopes for editing
  const [tempScopes, setTempScopes] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load control data from the state if available
    if (controlData) {
      setControl(controlData);
      setEvidences(mockEvidences);
      setLoading(false);
    } else if (params.controlId) {
      // Fallback to loading control data by ID
      setControl({
        id: params.controlId,
        name: 'Control cargado por ID',
        description: 'Este control se cargó usando el ID de la URL',
        period: 'DAILY',
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        mashupId: 'abc123',
        params: { minLength: 8, requireSpecialChar: true },
        scopes: { environment: 'production', criticality: 'high' },
      });
      setEvidences(mockEvidences);
      setLoading(false);
    }
  }, [params.controlId, controlData]);

  // Initialize temp scopes when starting to edit
  useEffect(() => {
    if (editingScopes && control) {
      setTempScopes({ ...control.scopes });
    }
  }, [editingScopes, control]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('result', {
        header: 'Result',
        cell: (info) => (info.getValue() ? <CircleCheck className="size-4 text-green-500" /> : <CircleX className="size-4 text-red-500" />),
        size: 80, // Smaller width for the result column
      }),
      columnHelper.accessor('key', {
        header: 'Key',
        cell: (info) => info.getValue(),
        size: 150, // Fixed width for key column
      }),
      columnHelper.accessor('value', {
        header: 'Value',
        cell: (info) => {
          const value = info.getValue();
          if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
          } else if (Array.isArray(value)) {
            return JSON.stringify(value);
          } else if (typeof value === 'string' && value.startsWith('http')) {
            return (
              <Link 
                to={value} 
                className="text-blue-600 hover:underline flex items-center"
              >
                Evidence link <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            );
          }
          return (
            <div className="max-w-[300px] break-words">
              {JSON.stringify(value)}
            </div>
          );
        },
        size: 300, // Allow more space for value contents
      }),
      columnHelper.accessor('from', {
        header: 'From',
        cell: (info) => format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm'),
        size: 120, // Fixed width for date columns
      }),
      columnHelper.accessor('to', {
        header: 'To',
        cell: (info) => format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm'),
        size: 120, // Fixed width for date columns
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: evidences,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handleEditControl = () => {
    setEditingControl(true);
  };

  const handleEditScopes = () => {
    setEditingScopes(true);
  };

  const handleControlSubmit = (data) => {
    // In a real application, you would update the control data here
    setControl({
      ...control,
      ...data,
    });
    toast.success('Control updated successfully');
    setEditingControl(false);
  };

  const handleScopeSetSubmit = (data) => {
    // In a real application, you would update the control's scopes here
    
    // Convert the scope array to an object for the control
    const updatedScopes = {};
    data.scopes.forEach(scope => {
      updatedScopes[scope.name] = scope.value;
    });
    
    setControl({
      ...control,
      scopes: updatedScopes,
    });
    
    // Clear temp scopes
    setTempScopes({});
    
    toast.success('Scopes updated successfully');
    setEditingScopes(false);
  };

  const _handleRemoveScope = (scopeName) => {
    if (editingScopes) {
      // In editing mode, update temp scopes
      const updatedTempScopes = { ...tempScopes };
      delete updatedTempScopes[scopeName];
      setTempScopes(updatedTempScopes);
    } else {
      // Not in editing mode, update control directly
      const updatedScopes = { ...control.scopes };
      delete updatedScopes[scopeName];
      setControl({
        ...control,
        scopes: updatedScopes,
      });
      toast.success(`Scope "${scopeName}" removed`);
    }
  };

  if (loading) {
    return (
      <Page 
        className="container mx-auto p-4 space-y-6" 
        catalogData={catalogData}
      >
        <div className="flex justify-center items-center h-64">
          <p>Loading control details...</p>
        </div>
      </Page>
    );
  }

  if (!control) {
    return (
      <Page 
        className="container mx-auto p-4 space-y-6" 
        catalogData={catalogData}
      >
        <div className="flex justify-center items-center h-64">
          <p>No control data found.</p>
        </div>
      </Page>
    );
  }

  return (
    <Page 
      className="container mx-auto p-4 space-y-6" 
      catalogData={catalogData} // Pasamos los datos de catálogo al componente Page
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-start space-y-0 space-x-2 pb-2">
          <CardTitle>{control.name}</CardTitle>
          <Button variant="outline" size="sm" onClick={editingControl ? () => setEditingControl(false) : handleEditControl} userRole={userData.authority}>
            {editingControl ? (
              <X className="h-4 w-4" />
            ) : (
              <Edit className="h-4 w-4" />
            )}
          </Button>
        </CardHeader>
        <CardContent className="text-left">
          {editingControl ? (
            <ControlForm 
              onSubmit={handleControlSubmit} 
              onCancel={() => setEditingControl(false)} 
              defaultValues={{
                ...control,
                // Formatear fechas si es necesario
                startDate: control.startDate,
                endDate: control.endDate,
              }}
            />
          ) : (
            <>
              <p className="text-gray-600 mb-2">{control.description}</p>
              <p className="text-sm">Period: {control.period}</p>
              <p className="text-sm">
                Duration: {format(new Date(control.startDate), 'yyyy-MM-dd')} to{' '}
                {format(new Date(control.endDate), 'yyyy-MM-dd')}
              </p>
              <Link to={`${import.meta.env.VITE_NODE_RED_URL}#/flow/${control.mashupId}`} className="text-blue-600 hover:underline flex items-center">
                View Node-RED Flow <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            </>
          )}

          <div className="mt-4">
            <div className="flex items-center justify-start space-x-2">
              <h3 className="text-lg font-semibold">Scopes</h3>
              <Button variant="outline" size="sm" onClick={editingScopes ? () => setEditingScopes(false) : handleEditScopes} userRole={userData.authority}>
                {editingScopes ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {editingScopes ? (
              <ScopeSetForm 
                onSubmit={handleScopeSetSubmit}
                onCancel={() => setEditingScopes(false)}
                controls={[control]}
                scopes={mockAvailableScopes}
                defaultValues={{
                  controlId: control.id,
                  scopes: Object.entries(control.scopes).map(([name, value]) => ({
                    id: mockAvailableScopes.find(s => s.name === name)?.id || name,
                    name,
                    value,
                  }))
                }}
              />
            ) : (
              <div className="flex flex-wrap gap-2 py-4">
                {Object.entries(control.scopes).map(([key, value]) => (
                  <Badge key={key} variant="outline" className={`px-2 py-1 ${editingScopes? 'bg-secondary' : ''}`}>
                    <span>{key}: {value}</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Evidences</h2>
          <div className="flex space-x-2">
            <Input
              placeholder="Search evidences..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {table.getAllLeafColumns().map((column) => {
                  return (
                    <DropdownMenuItem key={column.id} className="capitalize">
                      <Checkbox
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      />
                      <span className="ml-2">{column.id}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table className="w-full table-auto">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id}
                      className="whitespace-nowrap"
                      style={{ width: header.column.columnDef.size ? `${header.column.columnDef.size}px` : 'auto' }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="text-left">
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell 
                        key={cell.id}
                        className="align-top"
                        style={{ 
                          width: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : 'auto',
                          maxWidth: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : 'auto',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </Page>
  );
}

