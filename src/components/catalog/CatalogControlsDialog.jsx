import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Trash, Loader2, MoreHorizontal, Search, Plus } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Importar el nuevo formulario de control con la ruta actualizada
import { NewControlForm } from '@/forms/control/new/form';

// Importar los servicios de control reales
import { getControlsByCatalogId, createControl, deleteControl } from '@/services/controls';


const columnHelper = createColumnHelper();

export function CatalogControlsDialog({ open, onClose, catalog, userRole }) {
  const [controls, setControls] = useState([]);
  const [loadingControls, setLoadingControls] = useState(true);
  const [controlToDelete, setControlToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showNewControlForm, setShowNewControlForm] = useState(false); // Nuevo estado para controlar la visibilidad del formulario

  useEffect(() => {
    if (open && catalog) {
      fetchControls();
    }
  }, [open, catalog]);

  const fetchControls = async () => {
    try {
      setLoadingControls(true);
      // Usar el servicio real getControlsByCatalogId
      const response = await getControlsByCatalogId(catalog.id);
      setControls(response.data || response); // Asume que la respuesta puede ser data o el array directamente
    } catch (error) {
      console.error('Error fetching controls:', error);
      toast.error('Failed to load controls.');
    } finally {
      setLoadingControls(false);
    }
  };

  // Callback para cuando se añade un control exitosamente desde NewControlForm
  const handleControlAdded = useCallback((newControl) => {
    setControls(prev => [...prev, newControl]);
    toast.success('Control added successfully!');
    setShowNewControlForm(false); // Cerrar el formulario después de añadir el control
  }, []);

  const handleDeleteConfirm = useCallback((control) => {
    setControlToDelete(control);
  }, []);

  const handleDeleteControl = useCallback(async () => {
    if (!controlToDelete) return;
    try {
      setLoadingControls(true);
      // Usar el servicio real deleteControl
      await deleteControl(controlToDelete.id);
      setControls(prev => prev.filter(ctrl => ctrl.id !== controlToDelete.id));
      toast.success('Control deleted successfully!');
    } catch (error) {
      console.error('Error deleting control:', error);
      toast.error('Failed to delete control.');
    } finally {
      setLoadingControls(false);
      setControlToDelete(null);
    }
  }, [controlToDelete]);


  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Control Name',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue() || 'No description',
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => info.getValue(),
      }),
      {
        id: 'actions',
        cell: ({ row }) => {
          const control = row.original;
          return userRole === 'USER' ? null : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {/* Opcional: Añadir una opción de edición para controles */}
                {/* <DropdownMenuItem onClick={() => handleEditControl(control)}>
                  <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem> */}
                <DropdownMenuItem
                  onClick={() => handleDeleteConfirm(control)}
                  className="text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleDeleteConfirm, userRole]
  );

  const table = useReactTable({
    data: controls,
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
        pageSize: 5, // Pequeño tamaño de página para el diálogo
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Controls for "{catalog?.name}"</DialogTitle>
          <DialogDescription>
            Manage controls associated with this catalog.
          </DialogDescription>
        </DialogHeader>

        {userRole !== 'USER' && (
          <div className="flex justify-end mb-4">
            <Button className="border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white" onClick={() => setShowNewControlForm(true)}> {/* Botón para abrir el formulario */}
              <Plus className="mr-2 h-4 w-4" /> Add New Control
            </Button>
          </div>
        )}

        {/* El formulario de control se renderiza condicionalmente */}
        {showNewControlForm && (
          <div className="flex flex-col space-y-2 mb-4 p-4 border rounded-md">
            <h3 className="text-lg font-semibold">Add New Control</h3>
            <NewControlForm 
              catalogId={catalog?.id} 
              onClose={() => setShowNewControlForm(false)} // Cierra el formulario
              onSuccess={handleControlAdded}
              customSubmit={async (data) => {
                // Usar el servicio real createControl
                const response = await createControl(data);
                return response.data || response; // Retorna el control creado
              }}
            />
          </div>
        )}

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search controls..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 max-w-sm"
          />
        </div>

        <div className="flex-1 overflow-y-auto border rounded-md">
          <Table>
            <TableHeader className="bg-gray-50 sticky top-0 z-10">
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
              {loadingControls ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                      Loading controls...
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No controls found for this catalog.
                    </TableCell>
                  </TableRow>
                )
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

        {/* AlertDialog for deleting a single control */}
        <AlertDialog open={!!controlToDelete} onOpenChange={(isOpen) => !isOpen && setControlToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the control &quot;{controlToDelete?.name}&quot;? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loadingControls}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteControl} className="bg-red-600 hover:bg-red-700" disabled={loadingControls}>
                {loadingControls ? (
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
      </DialogContent>
    </Dialog>
  );
}
