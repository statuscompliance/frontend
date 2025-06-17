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
import { Edit, Trash, MoreHorizontal, ChevronDown, Plus, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Page from '@/components/basic-page.jsx';
import { getAllLinkers, deleteLinker } from '@/services/linkers';
import { getAllDatasources } from '@/services/datasources';
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

export function Linkers() {
  const [linkers, setLinkers] = useState([]);
  const [datasources, setDatasources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [linkerToDelete, setLinkerToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const navigate = useNavigate();
  const { userData } = useAuth();

  // Fetch linkers and datasources on component mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [linkersResponse, datasourcesResponse] = await Promise.all([
        getAllLinkers(),
        getAllDatasources()
      ]);
      setLinkers(linkersResponse);
      setDatasources(datasourcesResponse);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      toast.error('Error loading data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = useCallback(() => {
    navigate('/app/linkers/new');
  }, [navigate]);

  const handleEdit = useCallback((linker) => {
    navigate(`/app/linkers/${linker.id}/edit`);
  }, [navigate]);

  const handleDeleteConfirm = useCallback((linker) => {
    setLinkerToDelete(linker);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!linkerToDelete) return;
    
    try {
      setLoading(true);
      await deleteLinker(linkerToDelete.id);
      setLinkers(linkers.filter((linker) => linker.id !== linkerToDelete.id));
      toast.success('Linker deleted successfully');
    } catch (err) {
      toast.error('Failed to delete linker');
      console.error('Error deleting linker:', err);
    } finally {
      setLoading(false);
      setLinkerToDelete(null);
    }
  }, [linkers, linkerToDelete]);

  const handleDeleteSelected = useCallback(async () => {
    try {
      setLoading(true);
      
      const selectedIds = Object.keys(rowSelection).map(index => linkers[parseInt(index)].id);
      
      if (selectedIds.length === 0) {
        toast.error('No linkers selected');
        return;
      }
      
      for (const id of selectedIds) {
        await deleteLinker(id);
      }
      
      setLinkers(linkers.filter(linker => !selectedIds.includes(linker.id)));
      
      setRowSelection({});
      
      toast.success(`${selectedIds.length} linker${selectedIds.length > 1 ? 's' : ''} deleted successfully`);
    } catch (err) {
      toast.error('Failed to delete selected linkers');
      console.error('Error deleting linkers:', err);
    } finally {
      setLoading(false);
    }
  }, [linkers, rowSelection]);
  
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getDatasourceName = (id) => {
    const datasource = datasources.find(ds => ds.id === id);
    return datasource ? datasource.name : 'Unknown';
  };

  const renderDatasourcesList = (datasourceIds) => {
    if (!datasourceIds || datasourceIds.length === 0) return <span className="text-gray-400">No datasources</span>;
    
    return (
      <div className="flex flex-wrap gap-1">
        {datasourceIds.slice(0, 2).map(id => (
          <Badge key={id} variant="outline" className="whitespace-nowrap">
            {getDatasourceName(id)}
          </Badge>
        ))}
        {datasourceIds.length > 2 && (
          <Badge variant="outline" className="whitespace-nowrap">
            +{datasourceIds.length - 2} more
          </Badge>
        )}
      </div>
    );
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
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue() || 'No description',
      }),
      columnHelper.accessor('datasources', {
        header: 'Datasources',
        cell: (info) => renderDatasourcesList(info.getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => getStatusBadge(info.getValue()),
      }),
      columnHelper.accessor('config.refreshInterval', {
        header: 'Refresh Interval',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Last Updated',
        cell: (info) => formatDate(info.getValue()),
      }),
      {
        id: 'actions',
        cell: ({ row }) => {
          const linker = row.original;
          return userData.authority === 'USER' ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleEdit(linker)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleDeleteConfirm(linker)}
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
    [handleDeleteConfirm, handleEdit, userData.authority, datasources]
  );

  const table = useReactTable({
    data: linkers,
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
    <Page name="Linkers" className="h-full w-full">
      <div className="flex items-center justify-between gap-x-4">
        <Input
          placeholder="Search linkers..."
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
                      <span className="ml-2">{column.id === 'config.refreshInterval' ? 'Refresh Interval' : column.id}</span>
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
              <Plus className="mr-2 h-4 w-4" /> Add Linker
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
                    Loading linkers...
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
                  No linkers found.
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
      <AlertDialog open={!!linkerToDelete} onOpenChange={(isOpen) => !isOpen && setLinkerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the linker &quot;{linkerToDelete?.name}&quot;. This action cannot be undone.
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
