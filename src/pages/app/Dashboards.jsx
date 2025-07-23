import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importar Link
import { Plus, FolderPlus, Trash, Loader2, Search, MoreHorizontal, ChevronDown, ExternalLink } from 'lucide-react'; // Importar iconos necesarios
import { Button } from '@/components/ui/button';
// Eliminamos la importación de DashboardList ya que lo reemplazaremos
// import { DashboardList } from '@/components/dashboards/dashboard-list'; 
import { DashboardForm } from '@/forms/dashboard/form';
import { FolderForm } from '@/forms/folder/form';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Page from '@/components/basic-page.jsx';
import { foldersService } from '@/services/grafana/folders';
import { dashboardsService } from '@/services/grafana/dashboards';
import { searchService } from '@/services/grafana/search';
import { useAuth } from '@/hooks/use-auth';
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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow // Importar componentes de tabla
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox'; // Importar Checkbox para la tabla
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'; // Importar hooks y utilidades de react-table
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const columnHelper = createColumnHelper();

export function Dashboards() {
  const navigate = useNavigate();
  const [isDashboardFormOpen, setIsDashboardFormOpen] = useState(false);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Eliminamos dashboardListRef ya que no usaremos el componente DashboardList
  // const dashboardListRef = useRef(null); 
  const [selectedItemsCount, setSelectedItemsCount] = useState(0);
  const { userData } = useAuth();
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Estados para la paginación
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10; // Número de elementos por página, igual que en Catalogs.jsx

  // Eliminamos el estado draggedItem ya que el drag and drop se manejaría de otra forma en la tabla
  // const [draggedItem, setDraggedItem] = useState(null);

  // Nuevos estados para react-table
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({}); // Controlar visibilidad de columnas

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await searchService.search({});
        setItems(response.data || response);
        setError(null);
      } catch (err) {
        console.error('Error loading Grafana items:', err);
        setError('Error loading dashboards and folders. Please try again later.');
        toast.error('Failed to load dashboards and folders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset pageIndex when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [filter, filterBy]);

  // Filtrar y buscar elementos
  const filteredAndSearchedItems = useMemo(() => {
    let filtered = items;

    // Aplicar filterBy
    if (filterBy === 'dashboards') {
      filtered = filtered.filter(item => item.type === 'dash-db');
    } else if (filterBy === 'folders') {
      filtered = filtered.filter(item => item.type === 'dash-folder');
    }

    // Aplicar filtro global (búsqueda)
    if (filter) {
      const lowerCaseFilter = filter.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(lowerCaseFilter) ||
        (item.folderTitle && item.folderTitle.toLowerCase().includes(lowerCaseFilter))
      );
    }
    return filtered;
  }, [items, filter, filterBy]);

  // Obtener los elementos para la página actual
  const paginatedItems = useMemo(() => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return filteredAndSearchedItems.slice(start, end);
  }, [filteredAndSearchedItems, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredAndSearchedItems.length / pageSize);
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < totalPages - 1;

  const goToPreviousPage = () => {
    setPageIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setPageIndex(prev => Math.min(totalPages - 1, prev + 1));
  };


  const handleAddDashboard = () => {
    setIsDashboardFormOpen(true);
  };

  const handleAddFolder = () => {
    setIsFolderFormOpen(true);
  };

  const handleDashboardFormClose = () => {
    setIsDashboardFormOpen(false);
  };

  const handleFolderFormClose = () => {
    setIsFolderFormOpen(false);
  };

  const handleDashboardFormSubmit = async (data) => {
    try {
      setLoading(true);
      await dashboardsService.createTemplate(data);

      const searchResponse = await searchService.search({});
      setItems(searchResponse.data || searchResponse);

      toast.success('Your new dashboard has been successfully created.');
      setIsDashboardFormOpen(false);
    } catch (err) {
      console.error('Error creating dashboard:', err);
      toast.error('Failed to create dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderFormSubmit = async (data) => {
    try {
      setLoading(true);
      await foldersService.create(data);

      const searchResponse = await searchService.search({});
      setItems(searchResponse.data || searchResponse);

      toast.success('Your new folder has been successfully created.');
      setIsFolderFormOpen(false);
    } catch (err) {
      console.error('Error creating folder:', err);
      toast.error('Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  // La función handleDeleteSelected ahora se llamará desde handleConfirmBulkDelete
  const handleDeleteSelected = async (selectedItemsToDelete) => {
    try {
      setLoading(true);
      let allSuccess = true;

      for (const item of selectedItemsToDelete) {
        try {
          if (item.type === 'dash-folder') {
            await foldersService.delete(item.uid);
          } else if (item.type === 'dash-db') {
            await dashboardsService.delete(item.uid);
          }
        } catch (err) {
          allSuccess = false;
          toast.error(`Error deleting item: ${item.title}`);
          console.error(`Error deleting item ${item.uid}:`, err);
        }
      }

      if (allSuccess) {
        toast.success(`${selectedItemsToDelete.length} item${selectedItemsToDelete.length > 1 ? 's' : ''} deleted successfully`);
        // Actualizar el estado de items filtrando los eliminados
        setItems(prev => prev.filter(i => !selectedItemsToDelete.some(sel => sel.uid === i.uid)));
      }
      setLoading(false);
      setRowSelection({}); // Limpiar selección después de la operación
    } catch (err) {
      toast.error('Failed to delete selected items');
      console.error('Error deleting items:', err);
      setLoading(false);
    }
  };

  // Implementación simulada de dashboardsService.update para drag-and-drop
  // En un entorno real, esto interactuaría con tu API de Grafana
  useEffect(() => {
    if (!dashboardsService.update) {
      dashboardsService.update = async (uid, newFolderUid) => {
        console.log(`Simulating update for dashboard ${uid} to folder ${newFolderUid}`);
        // Simular un retraso de red
        await new Promise(resolve => setTimeout(resolve, 500));
        // Actualizar el estado localmente para reflejar el cambio
        setItems(prevItems => prevItems.map(item => {
          if (item.uid === uid && item.type === 'dash-db') {
            // Aseguramos que 'items' sea un array antes de usar .find()
            const currentFolders = prevItems.filter(i => i.type === 'dash-folder') || [];
            const newFolder = currentFolders.find(f => f.uid === newFolderUid);
            return {
              ...item,
              folderUid: newFolderUid,
              folderTitle: newFolder ? newFolder.title : 'General', // Asignar 'General' si la carpeta es null
            };
          }
          return item;
        }));
        return { success: true };
      };
    }
    // Asegurarse de que foldersService.delete también esté definido si se usa
    if (!foldersService.delete) {
      foldersService.delete = async (uid) => {
        console.log(`Simulating deletion of folder: ${uid}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        setItems(prevItems => prevItems.filter(item => item.uid !== uid && item.folderUid !== uid));
        return { success: true };
      };
    }
  }, [items]); // Depende de 'items' para que el mock de update tenga acceso a los títulos de las carpetas

  const getFoldersForForm = () => {
    const folders = items.filter(item => item.type === 'dash-folder');
    return folders.sort((a, b) => a.title.localeCompare(b.title));
  };

  const handleItemClick = (item) => {
    if (item.type === 'dash-folder') {
      navigate(`/app/dashboards/folders/${item.uid}`);
    } else if (item.type === 'dash-db') {
      navigate(`/app/dashboards/${item.uid}`);
    }
  };

  // Actualizar selectedItemsCount basado en rowSelection de react-table
  useEffect(() => {
    setSelectedItemsCount(Object.keys(rowSelection).length);
  }, [rowSelection]);


  const handleOpenBulkDeleteConfirm = () => {
    if (selectedItemsCount === 0) {
      toast.error('No items selected');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  const handleConfirmBulkDelete = async () => {
    // Obtener los elementos seleccionados directamente de la tabla
    const itemsToDelete = table.getSelectedRowModel().rows.map(row => row.original);
    await handleDeleteSelected(itemsToDelete);
    setShowBulkDeleteConfirm(false);
  };

  // Eliminamos handleDashboardDrop y sus props relacionadas ya que el drag and drop
  // en una tabla requiere una implementación más específica a nivel de celda/fila.
  // Si se desea, se puede reintroducir con un enfoque diferente.

  // Definición de columnas para react-table
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
      columnHelper.accessor('title', {
        header: 'Name',
        cell: (info) => (
          <span
            className="cursor-pointer text-blue-600 hover:underline"
            onClick={() => handleItemClick(info.row.original)}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => info.getValue() === 'dash-db' ? 'Dashboard' : 'Folder',
      }),
      columnHelper.accessor('folderTitle', {
        header: 'Folder',
        cell: (info) => info.getValue() || '-',
      }),
      {
        id: 'actions',
        cell: ({ row }) => {
          const item = row.original;
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
                <DropdownMenuItem onClick={() => handleItemClick(item)}>
                  {item.type === 'dash-db' ? 'View Dashboard' : 'Open Folder'}
                </DropdownMenuItem>
                {/* Si es un dashboard, se podría añadir una opción para abrir en Grafana */}
                {item.type === 'dash-db' && (
                  <DropdownMenuItem onClick={() => window.open(`/grafana/d/${item.uid}`, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Open in Grafana
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => { /* Lógica para eliminar un solo elemento */
                    // Por simplicidad, se puede reutilizar handleDeleteSelected con un array de un solo elemento
                    handleDeleteSelected([item]);
                  }}
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
    [handleItemClick, handleDeleteSelected, userData.authority]
  );

  // Inicialización de react-table
  const table = useReactTable({
    data: paginatedItems, // Usamos los items paginados
    columns,
    state: {
      globalFilter: filter, // Usamos 'filter' como globalFilter
      rowSelection,
      columnVisibility,
    },
    onGlobalFilterChange: setFilter, // Actualizar 'filter'
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // No usamos getPaginationRowModel aquí, ya que la paginación es manual
    onColumnVisibilityChange: setColumnVisibility,
    // No necesitamos initialState.pagination si la paginación es manual
  });

  return (
    <Page>
      <div className="mb-4 flex items-center justify-between gap-x-4">
        <div className='flex items-center space-x-2'>
          {/* Barra de búsqueda unificada */}
          <div className="relative">
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dashboards and folders..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 max-w-sm min-w-[350px]"
            />
          </div>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="dashboards">Dashboards Only</SelectItem>
              <SelectItem value="folders">Folders Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleAddFolder}
            disabled={loading}
            userRole={userData.authority}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button
            className="border-2 border-sidebar-accent bg-sidebar-accent text-white hover:bg-secondary hover:text-sidebar-accent"
            variant="outline"
            onClick={handleAddDashboard}
            disabled={loading}
            userRole={userData.authority}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Dashboard
          </Button>
        </div>
      </div>
      {error && <div className="mb-4 text-red-500">{error}</div>}

      {/* Tabla de Dashboards y Carpetas */}
      <div className="mt-4 border rounded-md max-h-[600px] overflow-y-auto">
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
                    Loading dashboards and folders...
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
                  No dashboards or folders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Botón de borrado masivo y controles de paginación */}
      <div className="flex items-center justify-between py-4 space-x-2">
        {userData.authority !== 'USER' && (
          <Button
            size="lg"
            className={`flex items-center gap-2 shadow-lg ${selectedItemsCount > 0
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-200 text-black cursor-not-allowed'
              }`}
            onClick={handleOpenBulkDeleteConfirm}
            disabled={loading || selectedItemsCount === 0}
          >
            <Trash className="h-5 w-5" />
            Delete Selected ({selectedItemsCount})
          </Button>
        )}
        <div className="flex items-center space-x-2 ml-auto">
          <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!canPreviousPage}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!canNextPage}>
            Next
          </Button>
        </div>
      </div>

      {isDashboardFormOpen && (
        <DashboardForm
          onClose={handleDashboardFormClose}
          onSubmit={handleDashboardFormSubmit}
          folders={getFoldersForForm()}
        />
      )}
      {isFolderFormOpen && (
        <FolderForm
          onClose={handleFolderFormClose}
          onSubmit={handleFolderFormSubmit}
          folders={getFoldersForForm()}
        />
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete {selectedItemsCount} selected item{selectedItemsCount > 1 ? 's' : ''}. This action cannot be undone.
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
