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
import { Edit, Trash, MoreHorizontal, ChevronDown, Plus, Loader2, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Page from '@/components/basic-page.jsx';
import {
  getAllCatalogs,
  updateCatalog,
  deleteCatalog
} from '@/services/catalogs';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CatalogForm } from '@/forms/catalog/forms';
import { useAuth } from '@/hooks/use-auth';
import {
  hasDraftData,
  getDraftCatalogId,
  getDraftControlIds,
  clearDraftData,
  getDraftDashboardUid
} from '@/utils/draftStorage';
import { deleteControl } from '@/services/controls';
import { deleteScopeSetsByControlId } from '@/services/scopes';
// Assuming dashboardsService exists and is imported if getDraftDashboardUid is used
// import * as dashboardsService from '@/services/dashboards';


const columnHelper = createColumnHelper();

export function Catalogs() {
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [catalogToDelete, setCatalogToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  // Nuevo estado para el diálogo de confirmación de borrado masivo
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const { userData } = useAuth();

  // Fetch catalogs on component mount
  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      const response = await getAllCatalogs();
      setCatalogs(response);
      setError(null);
    } catch (err) {
      setError('Failed to load catalogs. Please try again later.');
      toast.error('Error loading catalogs');
      console.error('Error fetching catalogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = useCallback((catalog) => {
    setEditingCatalog(catalog);
    setFormErrors({});
  }, []);

  const handleNew = useCallback(() => {
    // Check if there's a draft catalog (Kept from original version)
    if (hasDraftData()) {
      setShowDraftDialog(true);
    } else {
      // No draft, proceed directly to the wizard
      navigate('/app/catalogs/new');
    }
  }, [navigate]);

  const handleContinueDraft = () => {
    setShowDraftDialog(false);
    navigate('/app/catalogs/new');
  };

  const handleDiscardDraft = async () => {
    try {
      setLoading(true);

      // Delete catalog draft if it exists
      const draftCatalogId = getDraftCatalogId();
      if (draftCatalogId) {
        try {
          await deleteCatalog(draftCatalogId);
        } catch (err) {
          console.error('Error deleting draft catalog:', err);
        }
      }

      // Delete control drafts if they exist
      const controlIds = getDraftControlIds();
      for (const controlId of controlIds) {
        try {
          await deleteScopeSetsByControlId(controlId);
          await deleteControl(controlId);
        } catch (err) {
          console.error(`Error deleting draft control ${controlId}:`, err);
        }
      }

      // Delete dashboard draft if it exists
      const dashboardUid = getDraftDashboardUid();
      if (dashboardUid) {
        try {
          // Ensure dashboardsService is imported and available if this block is uncommented
          // await dashboardsService.delete(dashboardUid);
          console.warn('Dashboard draft deletion skipped: dashboardsService not imported or available.');
        } catch (err) {
          console.error(`Error deleting draft dashboard ${dashboardUid}:`, err);
        }
      }

      // Clear localStorage
      clearDraftData();

      // Reset state
      setShowDraftDialog(false);
      toast.success('Draft catalog discarded');

      // No navigation - we stay on the catalogs page
      setLoading(false);
    } catch (err) {
      toast.error('Error discarding draft catalog');
      console.error('Error discarding draft:', err);
      setLoading(false);
    }
  };

  const handleDeleteConfirm = useCallback((catalog) => {
    setCatalogToDelete(catalog);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!catalogToDelete) return;

    try {
      setLoading(true);
      await deleteCatalog(catalogToDelete.id);
      setCatalogs(catalogs.filter((catalog) => catalog.id !== catalogToDelete.id));
      toast.success('Catalog deleted successfully');
    } catch (err) {
      toast.error('Failed to delete catalog');
      console.error('Error deleting catalog:', err);
    } finally {
      setLoading(false);
      setCatalogToDelete(null);
    }
  }, [catalogs, catalogToDelete]);

  const handleCatalogUpdate = async (catalogData) => {
    try {
      if (!catalogData.name.trim() || !catalogData.description.trim()) {
        const errors = {};
        if (!catalogData.name.trim()) errors.name = 'Catalog name is required';
        if (!catalogData.description.trim()) errors.description = 'Description is required';
        setFormErrors(errors);
        return;
      }

      setLoading(true);
      const response = await updateCatalog(editingCatalog.id, catalogData);
      setCatalogs(catalogs.map((catalog) =>
        catalog.id === editingCatalog.id ? response : catalog
      ));
      toast.success('Catalog updated successfully');
      setEditingCatalog(null);
    } catch (err) {
      toast.error('Failed to update catalog');
      console.error('Error updating catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = useCallback((catalog) => {
    navigate(`/app/catalogs/${catalog.id}`, { state: { catalogData: catalog } });
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
      columnHelper.accessor('name', {
        header: 'Catalog Name',
        cell: (info) => (
          <span
            className="cursor-pointer text-blue-600 hover:underline"
            onClick={() => handleRowClick(info.row.original)}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue() || 'No description',
      }),
      columnHelper.accessor('startDate', {
        header: 'Start Date',
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('endDate', {
        header: 'End Date',
        cell: (info) => formatDate(info.getValue()),
      }),
      columnHelper.accessor('dashboard_id', {
        header: 'Dashboard',
        cell: (info) => {
          const dashboardId = info.getValue();
          return dashboardId ? (
            <Link
              to={'/app/dashboards/deeu8ffhhkikge'}
              className="flex items-center text-blue-600 hover:text-blue-800"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="mr-1 h-4 w-4" />
            </Link>
          ) : (
            '-'
          );
        },
      }),
      {
        id: 'actions',
        cell: ({ row }) => {
          const catalog = row.original;
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
                <DropdownMenuItem onClick={() => handleEdit(catalog)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDeleteConfirm(catalog)}
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
    [handleDeleteConfirm, handleEdit, handleRowClick, userData.authority]
  );

  const table = useReactTable({
    data: catalogs,
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

  // Calculate selected rows (improved from second version)
  const selectedCatalogs = useMemo(() => {
    return table.getSelectedRowModel().rows.map(row => row.original);
  }, [table.getSelectedRowModel().rows]);

  // Función para abrir el diálogo de confirmación de borrado masivo
  const handleBulkDeleteClick = () => {
    if (!selectedCatalogs.length) {
      toast.error('No catalogs selected');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  // Función para manejar el borrado masivo una vez confirmado
  const handleConfirmBulkDelete = async () => {
    setLoading(true);
    let allSuccess = true;
    for (const catalog of selectedCatalogs) {
      try {
        await deleteCatalog(catalog.id);
      } catch (err) {
        allSuccess = false;
        toast.error(`Error deleting catalog: ${catalog.name}`);
        console.error(`Error deleting catalog ${catalog.id}:`, err);
      }
    }
    if (allSuccess) {
      toast.success(`${selectedCatalogs.length} catalog${selectedCatalogs.length > 1 ? 's' : ''} deleted successfully`);
      // Update state by filtering out deleted catalogs
      setCatalogs(prev => prev.filter(c => !selectedCatalogs.some(sel => sel.id === c.id)));
    }
    setLoading(false);
    setRowSelection({}); // Clear selection after deletion attempt
    setShowBulkDeleteConfirm(false); // Cerrar el diálogo después de la operación
  };

  return (
    <Page name="Catalogs" className="h-full w-full">
      <div className="flex items-center justify-between gap-x-4"> {/* Usar justify-between aquí */}
        <div className="relative">
          <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search catalogs..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2"> {/* Este div ya está a la derecha por justify-between */}
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
                        {column.id === 'name' ? 'API Name' : column.id}
                      </span>
                    </DropdownMenuItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="border-2 border-sidebar-accent bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent"
            onClick={handleNew}
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Catalog {/* Cambiado el texto del botón */}
          </Button>
        </div>
      </div>

      {error && (
        <div className="my-4 border border-red-400 rounded bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* Added max-h and overflow for table scrolling */}
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
                    Loading catalogs...
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
                  No catalogs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination and new Bulk Delete Button */}
      <div className="flex items-center justify-between py-4 space-x-2">
        {userData.authority !== 'USER' && ( // Apply user role check here
          <Button
            size="lg"
            className={`flex items-center gap-2 shadow-lg ${selectedCatalogs.length > 0
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-200 text-black cursor-not-allowed'
              }`}
            onClick={handleBulkDeleteClick} // Llama a la nueva función para abrir el diálogo
            disabled={selectedCatalogs.length === 0 || loading} // Disable during loading
          >
            <Trash className="h-5 w-5" />
            Delete Selected ({selectedCatalogs.length})
          </Button>
        )}
        <div className="flex items-center space-x-2 ml-auto"> {/* Use ml-auto to push pagination to the right */}
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingCatalog} onOpenChange={(isOpen) => !isOpen && setEditingCatalog(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Catalog</DialogTitle>
          </DialogHeader>

          {editingCatalog && (
            <CatalogForm
              catalog={editingCatalog}
              onSubmit={handleCatalogUpdate}
              isSubmitting={loading}
              errors={formErrors}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!catalogToDelete} onOpenChange={(isOpen) => !isOpen && setCatalogToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the catalog &quot;{catalogToDelete?.name}&quot;. This action cannot be undone.
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

      {/* Bulk Delete Confirmation Dialog - Nuevo */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete {selectedCatalogs.length} selected catalog{selectedCatalogs.length > 1 ? 's' : ''}. This action cannot be undone.
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

      {/* Draft Dialog (Kept from original version) */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfinished Catalog Found</AlertDialogTitle>
            <AlertDialogDescription>
              We found a catalog that you started creating but didn&apos;t finish. Would you like to continue where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft} disabled={loading}>
              {loading ? 'Discarding...' : 'Discard Draft'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueDraft}>
              Continue Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
