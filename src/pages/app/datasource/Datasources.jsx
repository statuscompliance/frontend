import { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, MoreHorizontal, ChevronDown, Plus, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Page from '@/components/basic-page.jsx';
import { 
  getAllDatasources,
  deleteDatasource,
  testDatasourceConnection
} from '@/services/datasources';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { useStorage } from '@/hooks/use-storage';

const columnHelper = createColumnHelper();

export function Datasources() {
  const [datasources, setDatasources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datasourceToDelete, setDatasourceToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useStorage('datasources-column-visibility', {
    defaultValue: {
      description: false,
      environment: false,
      testStatus: false,
      version: false,
      updatedAt: false,
    },
  });
  const [testingConnection, setTestingConnection] = useState(null);
  const navigate = useNavigate();
  const { userData } = useAuth();

  // Fetch datasources on component mount
  useEffect(() => {
    fetchDatasources();
  }, []);

  const fetchDatasources = async () => {
    try {
      setLoading(true);
      const response = await getAllDatasources();
      setDatasources(response);
      setError(null);
    } catch (err) {
      setError('Failed to load datasources. Please try again later.');
      toast.error('Error loading datasources');
      console.error('Error fetching datasources:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = useCallback(() => {
    navigate('/app/datasources/new');
  }, [navigate]);

  const handleView = useCallback((datasource) => {
    navigate(`/app/datasources/${datasource.id}`);
  }, [navigate]);

  const handleEdit = useCallback((datasource) => {
    navigate(`/app/datasources/${datasource.id}/edit`);
  }, [navigate]);

  const handleDelete = useCallback(async () => {
    if (!datasourceToDelete) return;
    
    try {
      setLoading(true);
      await deleteDatasource(datasourceToDelete.id);
      setDatasources(datasources.filter((ds) => ds.id !== datasourceToDelete.id));
      toast.success('Datasource deleted successfully');
    } catch (err) {
      toast.error('Failed to delete datasource');
      console.error('Error deleting datasource:', err);
    } finally {
      setLoading(false);
      setDatasourceToDelete(null);
    }
  }, [datasources, datasourceToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    try {
      setLoading(true);
      
      const selectedIds = Object.keys(rowSelection).map(index => datasources[parseInt(index)].id);
      
      if (selectedIds.length === 0) {
        toast.error('No datasources selected');
        return;
      }
      
      for (const id of selectedIds) {
        await deleteDatasource(id);
      }
      
      setDatasources(datasources.filter(ds => !selectedIds.includes(ds.id)));
      
      setRowSelection({});
      
      toast.success(`${selectedIds.length} datasource${selectedIds.length > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete selected datasources');
      console.error('Error deleting datasources:', err);
    } finally {
      setLoading(false);
    }
  }, [datasources, rowSelection]);

  const handleTestConnection = useCallback(async (datasource) => {
    try {
      setTestingConnection(datasource.id);
      const result = await testDatasourceConnection(datasource.id);
      
      // Update the datasource status based on test result
      setDatasources(prevDatasources => 
        prevDatasources.map(ds => 
          ds.id === datasource.id 
            ? { ...ds, testStatus: result.testStatus, lastTestTime: result.lastTestTime } 
            : ds
        )
      );
      
      toast.success(result.message || 'Connection test successful');
    } catch (err) {
      // Update the datasource status to failure
      setDatasources(prevDatasources => 
        prevDatasources.map(ds => 
          ds.id === datasource.id 
            ? { ...ds, testStatus: 'failure' } 
            : ds
        )
      );
      
      toast.error(err.message || 'Connection test failed');
      console.error('Error testing connection:', err);
    } finally {
      setTestingConnection(null);
    }
  }, []);
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDatasourceTypeLabel = (definitionId) => {
    const typeMap = {
      'rest-api': 'REST API',
      'microsoft-graph': 'Microsoft Graph',
      'owncloud': 'OwnCloud'
    };
    
    return typeMap[definitionId] || definitionId;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
    ) : (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>
    );
  };

  const getTestStatusBadge = (testStatus) => {
    switch (testStatus) {
    case 'success':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Success</Badge>;
    case 'failure':
      return <Badge variant="destructive">Failed</Badge>;
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    case 'not_tested':
    default:
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Not Tested</Badge>;
    }
  };

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            disabled={userData.authority === 'USER'}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            disabled={userData.authority === 'USER'}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('definitionId', {
        header: 'Type',
        cell: (info) => getDatasourceTypeLabel(info.getValue()),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue() || '-',
        enableHiding: true,
      }),
      columnHelper.accessor('environment', {
        header: 'Environment',
        cell: (info) => {
          const env = info.getValue();
          if (!env) return '-';
          const envColors = {
            production: 'bg-red-100 text-red-800',
            staging: 'bg-yellow-100 text-yellow-800',
            dev: 'bg-blue-100 text-blue-800'
          };
          return <Badge className={envColors[env] || 'bg-gray-100 text-gray-800'}>{env}</Badge>;
        },
        enableHiding: true,
      }),
      columnHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => getStatusBadge(info.getValue()),
        enableHiding: true,
      }),
      columnHelper.accessor('testStatus', {
        header: 'Test Status',
        cell: (info) => getTestStatusBadge(info.getValue()),
        enableHiding: true,
      }),
      columnHelper.accessor('version', {
        header: 'Version',
        cell: (info) => `v${info.getValue()}`,
        enableHiding: true,
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Last Updated',
        cell: (info) => formatDate(info.getValue()),
        enableHiding: true,
      }),
      {
        id: 'actions',
        cell: ({ row }) => {
          const datasource = row.original;
          return userData.authority === 'USER' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleTestConnection(datasource);
              }}
              disabled={testingConnection === datasource.id}
            >
              {testingConnection === datasource.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Test</span>
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTestConnection(datasource);
                  }}
                  disabled={testingConnection === datasource.id}
                >
                  {testingConnection === datasource.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Test Connection
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(datasource)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleEdit, userData.authority, testingConnection, handleTestConnection]
  );

  const table = useReactTable({
    data: datasources,
    columns,
    state: {
      globalFilter,
      rowSelection,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  // Calcular si hay alguna fila seleccionada
  const hasSelection = Object.keys(rowSelection).length > 0;

  return (
    <Page name="Data Sources" className="h-full w-full">
      <div className="flex items-center justify-between gap-x-4">
        <Input
          placeholder="Search datasources..."
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          {userData.authority !== 'USER' && (
            <Button 
              variant="destructive" 
              onClick={handleDeleteSelected}
              disabled={!hasSelection || loading}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
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
          {userData.authority !== 'USER' && (
            <Button 
              className="border-2 border-sidebar-accent bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent"
              onClick={handleNew}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Data Source
            </Button>
          )}
        </div>
      </div>
      
      {error && (
        <div className="my-4 border border-red-400 rounded bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}
      
      <div className="mt-4 border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Loading datasources...
                  </div>
                </TableCell>
              </TableRow>
            )}
            
            {!loading && table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow className="cursor-pointer text-left hover:bg-gray-50" key={row.id} data-state={row.getIsSelected() && 'selected'} onClick={() => handleView(row.original)}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} onClick={(e) => cell.column.id === 'select' && e.stopPropagation()}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !loading && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No datasources found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-end py-4 space-x-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!datasourceToDelete} onOpenChange={(isOpen) => !isOpen && setDatasourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the datasource &quot;{datasourceToDelete?.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
