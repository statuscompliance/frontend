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
import { Edit, Trash, MoreHorizontal, ChevronDown, Loader2, ExternalLink, Play } from 'lucide-react'; // Import 'Play'
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Page from '@/components/basic-page.jsx';
import {
  getAllNodeRedFlows,
} from '@/services/mashups';
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
import { Link } from 'react-router-dom';

// Import the test view page
import { ControlCreationAndTestView } from '@/pages/app/mashups/ControlCreationAndTestView';


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
  const nodeRedUrl = import.meta.env.VITE_NODE_RED_URL || 'http://localhost:1880';

  // States for the testing dialog
  const [isTestViewOpen, setIsTestViewOpen] = useState(false);
  const [selectedMashupForTest, setSelectedMashupForTest] = useState(null);


  // Fetch flows on component mount
  useEffect(() => {
    // Add isMounted flag for safe state updates
    let isMounted = true;

    const fetchFlows = async () => {
      try {
        setLoading(true);
        const response = await getAllNodeRedFlows();
        // Assuming getAllNodeRedFlows returns 'mainInputType' and 'endpoint' (not 'url')
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

    // Cleanup function: set isMounted to false when component unmounts
    return () => {
      isMounted = false;
    };
  }, []); // Dependencies: empty array to run only once on mount

  const handleDeleteConfirm = useCallback((flow) => {
    setFlowToDelete(flow);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!flowToDelete) return;

    try {
      setLoading(true);
      // Here would be the implementation to delete the flow
      // await deleteFlow(flowToDelete.id); // Uncomment and implement deleteFlow
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


  // Handler to open the test view for a specific mashup
  const handleOpenTestView = useCallback((mashup) => {
    console.log('[Mashups] Opening test view for mashup:', JSON.stringify(mashup, null, 2));
    setSelectedMashupForTest(mashup);
    setIsTestViewOpen(true);
  }, []);

  // Handler to close the test view
  const handleCloseTestView = useCallback(() => {
    console.log('[Mashups] Closing test view.');
    setIsTestViewOpen(false);
    setSelectedMashupForTest(null);
    // Optionally, you can reload flows here if necessary
    // fetchFlows();
  }, []);


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
      // New column for the Test button
      columnHelper.display({
        id: 'test_action',
        header: 'Test',
        cell: ({ row }) => {
          const mashup = row.original;
          // Disable if not testable (e.g., no endpoint or not an http in type)
          const isTestable = mashup.endpoint && mashup.mainInputType === 'http in';
          return (
            <Button
              variant="default" // You can choose a solid variant like "default"
              className="bg-green-600 hover:bg-green-700 text-white" // Green button
              onClick={() => handleOpenTestView(mashup)}
              disabled={!isTestable} // Disable if not testable
            >
              <Play className="mr-2 h-4 w-4" /> Test
            </Button>
          );
        },
        enableSorting: false,
        enableHiding: false,
      }),
    ],
    [handleDeleteConfirm, userData.authority, handleOpenTestView]
  );

  const table = useReactTable({
    data: flows,
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
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Page name="API Mashups" className="h-full w-full">
      <div className="flex items-center justify-between gap-x-4">
        <Input
          placeholder="Search flows..."
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
                      {/* --- KEY CHANGE HERE --- */}
                      {column.id === 'description' // Now 'description', not 'info'!
                        ? 'Description'
                        : column.id === 'numNodes'
                          ? 'Total pipes'
                          : column.id === 'name' // Now 'name', not 'label'!
                            ? 'Mashup Name'
                            : column.id === 'endpoint' // Added for 'endpoint' if not present before
                              ? 'Mashup Endpoint'
                              : column.id}
                    </span>
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          className="border-2 border-sidebar-accent bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent"
          onClick={() => window.open(nodeRedUrl, '_blank')}
        >
          <ExternalLink className="mr-2 h-4 w-4" /> Open Node-RED
        </Button>
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

      <div className="flex items-center justify-end py-4 space-x-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
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

      {/* Control Creation and Test View Dialog */}
      {selectedMashupForTest && (
        <ControlCreationAndTestView
          mashup={selectedMashupForTest}
          isOpen={isTestViewOpen}
          onClose={handleCloseTestView}
        />
      )}
    </Page>
  );
}
