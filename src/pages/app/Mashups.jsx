// src/pages/app/Mashups.jsx
import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
import { Edit, Trash, MoreHorizontal, ChevronDown, Loader2, ExternalLink, Play } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Page from '@/components/basic-page.jsx';
import {
  getAllNodeRedFlows // Asegúrate de usar la nueva función
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
import { TestMashupWorkflowModal } from '@/components/mashups/testMashupWorkflowModal';

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
    mainInputType: false, // Asegúrate de que esta columna también esté en tu estado
  });

  // NEW: Estado para el modal de test y el mashup seleccionado para testear
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedMashupForTest, setSelectedMashupForTest] = useState(null);

  const { userData } = useAuth();
  const nodeRedUrl = import.meta.env.VITE_NODE_RED_URL || 'http://localhost:1880';

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      setLoading(true);
      const response = await getAllNodeRedFlows(); // Usamos la nueva función
      setFlows(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load Node-RED flows. Please try again later.'); // Mensaje actualizado
      toast.error('Error loading Node-RED flows'); // Mensaje actualizado
      console.error('Error fetching Node-RED flows:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = useCallback((flow) => {
    setFlowToDelete(flow);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!flowToDelete) return;

    try {
      setLoading(true);
      // await deleteFlow(flowToDelete.id); // Lógica de eliminación real
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

  // NEW: Función para abrir el modal de test con el mashup específico
  const handleOpenTestModal = useCallback((mashup) => {
    setSelectedMashupForTest(mashup);
    setIsTestModalOpen(true);
  }, []);

  const handleCloseTestModal = useCallback(() => {
    setIsTestModalOpen(false);
    setSelectedMashupForTest(null); // Limpiar la selección al cerrar
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
      columnHelper.accessor('label', {
        header: 'Mashup Name',
        cell: (info) => (
          <Link
            to={`/app/editor/${info.row.original.id}`}
            className="text-blue-600 hover:underline"
            state={{ flowName: info.row.original.label }}
          >
            {info.getValue() || 'Untitled Flow'}
          </Link>
        ),
      }),
      columnHelper.accessor('info', {
        header: 'Description',
        cell: (info) => info.getValue() || 'No description',
      }),
      columnHelper.accessor('id', {
        header: 'Mashup ID',
        cell: (info) => info.getValue() || 'No ID',
        meta: { hideByDefault: true },
      }),
      // NEW: Columna de tipo de entrada principal
      columnHelper.accessor('mainInputType', {
        header: 'Main Input Type',
        cell: (info) => {
          const type = info.getValue();
          switch (type) {
            case 'http in': return 'HTTP API';
            case 'inject': return 'Manual Trigger';
            case 'mqtt in': return 'MQTT Subscriber';
            case 'websocket in': return 'WebSocket Listener';
            case 'cron': return 'Scheduled Task';
            default: return type;
          }
        },
      }),
      // NEW: Columna de URL modificada para ser condicional y mostrar link
      columnHelper.accessor('url', {
        header: 'Mashup Endpoint',
        cell: (info) => {
          const flow = info.row.original;
          return flow.mainInputType === 'http in' && flow.url
            ? <a href={`${nodeRedUrl}${flow.url}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {flow.url} <ExternalLink className="inline-block ml-1 h-3 w-3" />
            </a>
            : 'N/A';
        },
      }),
      columnHelper.accessor('numNodes', {
        header: 'Total Pipes',
        cell: (info) => info.getValue() || 0,
        meta: { hideByDefault: true }, // Opcional: Ocultar por defecto si no es una prioridad
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
                {/* NEW: Botón Test Mashup dentro del DropdownMenu */}
                <DropdownMenuItem onClick={() => handleOpenTestModal(flow)}>
                  <Play className="mr-2 h-4 w-4 text-green-600" />
                  Test Mashup
                </DropdownMenuItem>
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
    ],
    [handleDeleteConfirm, handleOpenTestModal, userData.authority, nodeRedUrl] // Añadir nodeRedUrl a las dependencias
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
                      {column.id === 'info'
                        ? 'Description'
                        : column.id === 'numNodes'
                          ? 'Total pipes'
                          : column.id === 'label'
                            ? 'Mashup Name'
                            : column.id === 'mainInputType' // Nuevo caso
                              ? 'Main Input Type'
                              : column.id}
                    </span>
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* OLD: Eliminar este botón global de Test Mashup */}
        {/* <Button
            className="border-2 border-green-600 bg-green-500 hover:bg-green-700 text-white"
            onClick={() => setIsTestModalOpen(true)}
        >
            <Play className="mr-2 h-4 w-4" /> Test Mashup
        </Button> */}

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
                    Loading Node-RED flows...
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
                  No Node-RED flows found.
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
              This will permanently delete the flow &quot;{flowToDelete?.label || 'Untitled Flow'}&quot;. This action cannot be undone.
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

      {/* NEW: Test Mashup Workflow Modal */}
      <TestMashupWorkflowModal
        isOpen={isTestModalOpen}
        onClose={handleCloseTestModal} // Usamos el nuevo handler para cerrar
        allMashups={flows}
        selectedMashup={selectedMashupForTest} // Pasamos el mashup seleccionado
      />
    </Page>
  );
}