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
import { Edit, Trash, MoreHorizontal, ChevronDown, Plus, Loader2, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
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

const columnHelper = createColumnHelper();

export function Datasources() {
  const [datasources, setDatasources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [datasourceToDelete, setDatasourceToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
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

  const handleEdit = useCallback((datasource) => {
    navigate(`/app/datasources/${datasource.id}/edit`);
  }, [navigate]);

  const handleDeleteConfirm = useCallback((datasource) => {
    setDatasourceToDelete(datasource);
  }, []);

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
      await testDatasourceConnection(datasource.configuration);
      
      // Update the datasource status in the local state
      setDatasources(prevDatasources => 
        prevDatasources.map(ds => 
          ds.id === datasource.id 
            ? { ...ds, connectionStatus: 'connected', lastSyncTime: new Date().toISOString() } 
            : ds
        )
      );
      
      toast.success('Connection test successful');
    } catch (err) {
      // Update the datasource status to error
      setDatasources(prevDatasources => 
        prevDatasources.map(ds => 
          ds.id === datasource.id 
            ? { ...ds, connectionStatus: 'error' } 
            : ds
        )
      );
      
      toast.error('Connection test failed');
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

  const getDatasourceTypeLabel = (type) => {
    const typeMap = {
      'microsoft-graph': 'Microsoft Graph',
      'github-api': 'GitHub API',
      'azure-security-center': 'Azure Security Center',
      'aws-security-hub': 'AWS Security Hub',
      'gdpr-assessment-tool': 'GDPR Assessment',
      'iso27001-tracker': 'ISO 27001 Tracker'
    };
    
    return typeMap[type] || type;
  };

  const getStatusBadge = (status) => {
    switch (status) {
    case 'active':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case 'inactive':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getConnectionStatusBadge = (status) => {
    switch (status) {
    case 'connected':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Connected</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
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
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => getDatasourceTypeLabel(info.getValue()),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue() || 'No description',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => getStatusBadge(info.getValue()),
      }),
      columnHelper.accessor('connectionStatus', {
        header: 'Connection',
        cell: (info) => getConnectionStatusBadge(info.getValue()),
      }),
      columnHelper.accessor('lastSyncTime', {
        header: 'Last Sync',
        cell: (info) => formatDate(info.getValue()),
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
                <DropdownMenuItem 
                  onClick={() => handleDeleteConfirm(datasource)}
                  className="text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleDeleteConfirm, handleEdit, userData.authority, testingConnection, handleTestConnection]
  );

  const table = useReactTable({
    data: datasources,
    columns,
    state: {
      globalFilter,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
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
      
      <div className="mt-4 border rounded-md">
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
                <TableRow className="cursor-pointer text-left hover:bg-gray-50" key={row.id} data-state={row.getIsSelected() && 'selected'} onClick={() => userData.authority !== 'USER' && handleEdit(row.original)}>
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
