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
import { Edit, Trash, MoreHorizontal, ChevronDown, Loader2, ExternalLink, Play, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Page from '@/components/basic-page.jsx';
import {
  getAllNodeRedFlows,
  // Assuming deleteFlow exists in mashups service for actual deletion
  // deleteFlow, 
} from '@/services/mashups'; // Import deleteFlow if it exists
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
import { Link, useNavigate } from 'react-router-dom';


const columnHelper = createColumnHelper();

export function Mashups() {
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flowToDelete, setFlowToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({
    id: false,
    url: false,
    numNodes: false,
  });
  const { userData } = useAuth();
  const navigate = useNavigate();
  const nodeRedUrl = import.meta.env.VITE_NODE_RED_URL || 'http://localhost:1880';

  // Nuevo estado para el diálogo de confirmación de borrado masivo
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  // Estados para la paginación
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10; // Número de elementos por página, igual que en Catalogs.jsx


  // Fetch flows on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchFlows = async () => {
      try {
        setLoading(true);
        const response = await getAllNodeRedFlows();
        if (isMounted) {
          setFlows(response.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load API flows. Please try again later.');
          toast.error('Error loading API flows');
          console.error('Error fetching API flows:', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFlows();

    return () => {
      isMounted = false;
    };
  }, []);

  // Reset pageIndex when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [globalFilter]); // Only globalFilter affects the full dataset for now

  // Filtrar y paginar los datos
  const filteredFlows = useMemo(() => {
    if (!globalFilter) {
      return flows;
    }
    const lowerCaseFilter = globalFilter.toLowerCase();
    return flows.filter(flow =>
      flow.name?.toLowerCase().includes(lowerCaseFilter) ||
      flow.description?.toLowerCase().includes(lowerCaseFilter) ||
      flow.endpoint?.toLowerCase().includes(lowerCaseFilter)
    );
  }, [flows, globalFilter]);

  const paginatedFlows = useMemo(() => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return filteredFlows.slice(start, end);
  }, [filteredFlows, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredFlows.length / pageSize);
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < totalPages - 1;

  const goToPreviousPage = () => {
    setPageIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setPageIndex(prev => Math.min(totalPages - 1, prev + 1));
  };


  const handleDeleteConfirm = useCallback((flow) => {
    setFlowToDelete(flow);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!flowToDelete) return;

    try {
      setLoading(true);
      // Placeholder for actual deleteFlow service call
      // await deleteFlow(flowToDelete.id); 
      console.log(`Simulating deletion of flow with ID: ${flowToDelete.id}`); // Simulate deletion
      setFlows(flows.filter((flow) => flow.id !== flowToDelete.id));
      toast.success('Flow deleted successfully');
    } catch (err) {
      toast.error('Failed to delete flow');
      console.error('Error deleting flow:', err);
    } finally {
      setLoading(false);
      setFlowToDelete(null);
    }
  }, [flows, flowToDelete]);

  // Handler to navigate to the test page for a specific mashup
  const handleOpenTestView = useCallback((mashup) => {
    navigate('/app/mashups/control-test', { state: { mashup } });
  }, [navigate]);


  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            userRole={userData.authority}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            userRole={userData.authority}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      columnHelper.accessor('name', { // Using 'name' from the new flow data structure
        header: 'Mashup Name',
        cell: (info) => (
          <Link
            to={`/app/editor/${info.row.original.id}`}
            className="text-blue-600 hover:underline"
            state={{ flowName: info.row.original.name }} // Using 'name'
          >
            {info.getValue() || 'Untitled Flow'}
          </Link>
        ),
      }),
      columnHelper.accessor('description', { // Using 'description' from the new flow data structure
        header: 'Description',
        cell: (info) => info.getValue() || 'No description',
      }),
      columnHelper.accessor('id', {
        header: 'Mashup ID',
        cell: (info) => info.getValue() || 'No ID',
        meta: { hideByDefault: true },
      }),
      columnHelper.accessor('endpoint', { // Using 'endpoint' from the new flow data structure
        header: 'Mashup Endpoint',
        cell: (info) => info.getValue() || 'No Endpoint',
      }),
      columnHelper.accessor('numNodes', {
        header: 'Total Pipes',
        cell: (info) => info.getValue() || 0,
      }),
      {
        id: 'actions',
        cell: ({ row }) => {
          const flow = row.original;
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
                <DropdownMenuItem onClick={() => window.open(`/red#flow/${flow.id}`, '_blank')}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit in Node-RED
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenTestView(flow)}
                  disabled={!(flow.endpoint && flow.mainInputType === 'http in')}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Test
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteConfirm(flow)}
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
    [handleDeleteConfirm, userData.authority, handleOpenTestView]
  );

  const table = useReactTable({
    // Usar paginatedFlows para la tabla
    data: paginatedFlows,
    columns,
    state: {
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // Deshabilitar getPaginationRowModel si manejamos la paginación manualmente
    // getPaginationRowModel: getPaginationRowModel(), 
    onColumnVisibilityChange: setColumnVisibility,
    // No necesitamos initialState.pagination si lo manejamos manualmente
    // initialState: {
    //   pagination: {
    //     pageSize: 10,
    //   },
    // },
  });

  // Calculate selected rows (similar to Catalogs.jsx)
  // MOVED: This useMemo now correctly accesses 'table' after its declaration.
  const selectedFlows = useMemo(() => {
    return table.getSelectedRowModel().rows.map(row => row.original);
  }, [table.getSelectedRowModel().rows]);

  // Función para abrir el diálogo de confirmación de borrado masivo
  const handleOpenBulkDeleteConfirm = () => {
    if (!selectedFlows.length) {
      toast.error('No mashups selected');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  // Función para manejar el borrado masivo una vez confirmado
  const handleConfirmBulkDelete = async () => {
    setLoading(true);
    let allSuccess = true;
    for (const flow of selectedFlows) {
      try {
        // Placeholder for actual deleteFlow service call
        // await deleteFlow(flow.id); 
        console.log(`Simulating bulk deletion of flow with ID: ${flow.id}`); // Simulate deletion
      } catch (err) {
        allSuccess = false;
        toast.error(`Error deleting mashup: ${flow.name || flow.id}`);
        console.error(`Error deleting mashup ${flow.id}:`, err);
      }
    }
    if (allSuccess) {
      toast.success(`${selectedFlows.length} mashup${selectedFlows.length > 1 ? 's' : ''} deleted successfully`);
      // Update state by filtering out deleted flows
      setFlows(prev => prev.filter(f => !selectedFlows.some(sel => sel.id === f.id)));
    }
    setLoading(false);
    setRowSelection({}); // Clear selection after deletion attempt
    setShowBulkDeleteConfirm(false); // Cerrar el diálogo después de la operación
  };


  return (
    <Page name="API Mashups" className="h-full w-full">
      <div className="flex items-center justify-between gap-x-4">
        <div className="relative">
          <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search flows..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2"> {/* Added wrapper div for consistency */}
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
                      <span className="ml-2">
                        {column.id === 'description'
                          ? 'Description'
                          : column.id === 'numNodes'
                            ? 'Total pipes'
                            : column.id === 'name'
                              ? 'Mashup Name'
                              : column.id === 'endpoint'
                                ? 'Mashup Endpoint'
                                : column.id}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white"
            onClick={() => window.open(nodeRedUrl, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Open Node-RED
          </Button>
        </div>
      </div>

      {error && (
        <div className="my-4 border border-red-400 rounded bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 border rounded-md max-h-[600px] overflow-y-auto"> {/* Added max-h and overflow for table scrolling */}
        <Table>
          <TableHeader className="bg-gray-400">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead className="text-white text-left" key={header.id}>
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
                    Loading API flows...
                  </div>
                </TableCell>
              </TableRow>
            )}

            {!loading && table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow className="text-left" key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : !loading && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No API flows found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination and Bulk Delete Button */}
      <div className="flex items-center justify-between py-4 space-x-2">
        {userData.authority !== 'USER' && ( // Apply user role check here
          <Button
            size="lg"
            className={`flex items-center gap-2 shadow-lg ${selectedFlows.length > 0
              ? 'border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white'
              : 'bg-gray-200 text-black cursor-not-allowed'
              }`}
            onClick={handleOpenBulkDeleteConfirm} // Llama a la nueva función para abrir el diálogo
            disabled={selectedFlows.length === 0 || loading} // Disable during loading
          >
            <Trash className="h-5 w-5" />
            Delete Selected ({selectedFlows.length})
          </Button>
        )}
        <div className="flex items-center space-x-2 ml-auto"> {/* Use ml-auto to push pagination to the right */}
          <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!canPreviousPage}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!canNextPage}>
            Next
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog (for single delete) */}
      <AlertDialog open={!!flowToDelete} onOpenChange={(isOpen) => !isOpen && setFlowToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the flow &quot;{flowToDelete?.name || 'Untitled Flow'}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-sidebar-accent">
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

      {/* Bulk Delete Confirmation Dialog - Nuevo */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete {selectedFlows.length} selected mashup{selectedFlows.length > 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All Selected'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
