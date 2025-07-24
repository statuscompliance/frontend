import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importar Link
import { Plus, FolderPlus, Trash, Loader2, Search, MoreHorizontal, ChevronDown, ExternalLink } from 'lucide-react'; // Importar iconos necesarios
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Import Card components

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
  const [selectedItemsCount, setSelectedItemsCount] = useState(0);
  const { userData } = useAuth();
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Estados para la paginación
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10; // Número de elementos por página, igual que en Catalogs.jsx

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

  useEffect(() => {
    if (!dashboardsService.update) {
      dashboardsService.update = async (uid, newFolderUid) => {
        console.log(`Simulating update for dashboard ${uid} to folder ${newFolderUid}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        setItems(prevItems => prevItems.map(item => {
          if (item.uid === uid && item.type === 'dash-db') {
            const currentFolders = prevItems.filter(i => i.type === 'dash-folder') || [];
            const newFolder = currentFolders.find(f => f.uid === newFolderUid);
            return {
              ...item,
              folderUid: newFolderUid,
              folderTitle: newFolder ? newFolder.title : 'General',
            };
          }
          return item;
        }));
        return { success: true };
      };
    }
    if (!foldersService.delete) {
      foldersService.delete = async (uid) => {
        console.log(`Simulating deletion of folder: ${uid}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        setItems(prevItems => prevItems.filter(item => item.uid !== uid && item.folderUid !== uid));
        return { success: true };
      };
    }
  }, [items]);

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
    const itemsToDelete = table.getSelectedRowModel().rows.map(row => row.original);
    await handleDeleteSelected(itemsToDelete);
    setShowBulkDeleteConfirm(false);
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
                {item.type === 'dash-db' && (
                  <DropdownMenuItem onClick={() => window.open(`/grafana/d/${item.uid}`, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Open in Grafana
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => {
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

  const table = useReactTable({
    data: paginatedItems,
    columns,
    state: {
      globalFilter: filter,
      rowSelection,
      columnVisibility,
    },
    onGlobalFilterChange: setFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Keep this for pagination state management
    onColumnVisibilityChange: setColumnVisibility,
  });

  return (
    <Page className="mx-auto p-4 container space-y-6"> {/* Adjusted Page className for consistent spacing */}
      <Card className="bg-white shadow-lg rounded-lg"> {/* Main Card container */}
        <CardHeader className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 text-left border-b-2 border-gray-200 pb-4">
          <div>
            <CardTitle className="text-3xl font-bold text-gray-800">Dashboards</CardTitle>
            <CardDescription className="text-lg text-gray-700">Manage your Grafana dashboards and folders here.</CardDescription>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleAddFolder}
              disabled={loading}
              userRole={userData.authority}
              className="border-1 border-gray-500 bg-white text-gray-500 hover:bg-gray-500 hover:text-white" // Consistent button style
            >
              <FolderPlus className="h-4 w-4 mr-2" /> Add Folder
            </Button>
            <Button
              className="border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white"
              onClick={handleAddDashboard}
              disabled={loading}
              userRole={userData.authority}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Dashboard
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6"> {/* Added padding to card content */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2 flex-grow"> {/* Added flex-grow to search and filter container */}
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dashboards and folders..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="pl-10 max-w-sm min-w-[350px] rounded-md border border-gray-300 focus:ring-sidebar-accent focus:border-sidebar-accent"
                />
              </div>
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-[180px] rounded-md border border-gray-300 hover:bg-gray-100">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="dashboards">Dashboards Only</SelectItem>
                  <SelectItem value="folders">Folders Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-md border border-gray-300 hover:bg-gray-100">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuItem key={column.id} className="capitalize flex items-center">
                          <Checkbox
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                            id={`column-${column.id}`}
                          />
                          <label htmlFor={`column-${column.id}`} className="ml-2 cursor-pointer">{column.id}</label>
                        </DropdownMenuItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {error && <div className="my-4 border border-red-400 rounded bg-red-100 px-4 py-3 text-red-700">{error}</div>}

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-gray-600 font-semibold">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="text-left">
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                      <div className="flex items-center justify-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Loading dashboards and folders...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                      No dashboards or folders found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between py-4">
            <div>
              <Button
                size="lg"
                className={`flex items-center gap-2 shadow-lg ${selectedItemsCount > 0
                  ? 'border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white'
                  : 'bg-gray-200 text-black cursor-not-allowed'
                  }`}
                onClick={handleOpenBulkDeleteConfirm}
                disabled={loading || selectedItemsCount === 0}
                userRole={userData.authority}
              >
                <Trash className="h-4 w-4 mr-2" /> Delete Selected ({selectedItemsCount})
              </Button>
            </div>
            <div className="flex items-center justify-end py-4 space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={!canPreviousPage}
                className="rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={!canNextPage}
                className="rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
