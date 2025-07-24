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
import { Edit, Trash, MoreHorizontal, ChevronDown, Plus, Loader2, ExternalLink, Search, Eye } from 'lucide-react'; // Importar Eye para "View Controls"
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Page from '@/components/basic-page.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
// Importar el nuevo componente de diálogo para controles
import { CatalogControlsDialog } from '@/components/catalog/CatalogControlsDialog';


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
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const navigate = useNavigate();
  const { userData } = useAuth();

  // Nuevos estados para la funcionalidad "View Controls"
  const [showControlsDialog, setShowControlsDialog] = useState(false);
  const [selectedCatalogForControls, setSelectedCatalogForControls] = useState(null);


  // Fetch catalogs on component mount
  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      setLoading(true);
      // Simulación de getAllCatalogs si no está implementado
      const simulatedCatalogs = [
        { id: 'cat1', name: 'Security Catalog', description: 'Catalog for security controls', startDate: '2023-01-01', endDate: '2024-12-31', dashboard_id: 'dash123' },
        { id: 'cat2', name: 'Compliance Catalog', description: 'Catalog for regulatory compliance', startDate: '2022-06-15', endDate: '2025-06-14', dashboard_id: null },
        { id: 'cat3', name: 'Privacy Catalog', description: 'Catalog for data privacy policies', startDate: '2023-03-01', endDate: '2024-02-29', dashboard_id: 'dash456' },
      ];
      const response = await (getAllCatalogs ? getAllCatalogs() : Promise.resolve(simulatedCatalogs));
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
    if (hasDraftData()) {
      setShowDraftDialog(true);
    } else {
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
      const draftCatalogId = getDraftCatalogId();
      if (draftCatalogId) {
        try {
          // Simulación de deleteCatalog si no está implementado
          await (deleteCatalog ? deleteCatalog(draftCatalogId) : Promise.resolve());
        } catch (err) {
          console.error('Error deleting draft catalog:', err);
        }
      }

      const controlIds = getDraftControlIds();
      for (const controlId of controlIds) {
        try {
          // Simulación de deleteScopeSetsByControlId y deleteControl
          await (deleteScopeSetsByControlId ? deleteScopeSetsByControlId(controlId) : Promise.resolve());
          await (deleteControl ? deleteControl(controlId) : Promise.resolve());
        } catch (err) {
          console.error(`Error deleting draft control ${controlId}:`, err);
        }
      }

      const dashboardUid = getDraftDashboardUid();
      if (dashboardUid) {
        // Aquí iría la lógica para eliminar el dashboard si dashboardsService.delete existe
        console.warn('Dashboard draft deletion skipped: dashboardsService not imported or available.');
      }

      clearDraftData();
      setShowDraftDialog(false);
      toast.success('Draft catalog discarded');
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
      // Simulación de updateCatalog si no está implementado
      const response = await (updateCatalog ? updateCatalog(editingCatalog.id, catalogData) : Promise.resolve({ ...editingCatalog, ...catalogData }));
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

  // Nueva función para abrir el diálogo de controles
  const handleViewControls = useCallback((catalog) => {
    setSelectedCatalogForControls(catalog);
    setShowControlsDialog(true);
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
                <DropdownMenuItem onClick={() => handleViewControls(catalog)}> {/* Nuevo botón */}
                  <Eye className="mr-2 h-4 w-4" />
                  View Controls
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
    [handleDeleteConfirm, handleEdit, handleRowClick, userData.authority, handleViewControls]
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

  const selectedCatalogs = useMemo(() => {
    return table.getSelectedRowModel().rows.map(row => row.original);
  }, [table.getSelectedRowModel().rows]);

  const handleBulkDeleteClick = () => {
    if (!selectedCatalogs.length) {
      toast.error('No catalogs selected');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

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
      setCatalogs(prev => prev.filter(c => !selectedCatalogs.some(sel => sel.id === c.id)));
    }
    setLoading(false);
    setRowSelection({});
    setShowBulkDeleteConfirm(false);
  };

  return (
    <Page className="mx-auto p-4 container space-y-6"> {/* Adjusted Page className for consistent spacing */}
      <Card className="bg-white shadow-lg rounded-lg"> {/* Main Card container */}
        <CardHeader className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 text-left border-b-2 border-gray-200 pb-4">
          <div>
            <CardTitle className="text-3xl font-bold text-gray-800">Catalogs</CardTitle>
            <CardDescription className="text-lg text-gray-700">Manage your catalogs here.</CardDescription>
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              className="add-catalog-button"
              onClick={handleNew} // Use handleNew for "Add New Catalog"
            >
              <Plus className="mr-2 h-4 w-4" /> Add New Catalog
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6"> {/* Added padding to card content */}
          <div className="flex items-center justify-between py-4">
            <div className="relative flex-grow"> {/* Added flex-grow to search input container */}
              <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search catalogs..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 max-w-sm rounded-md border border-gray-300 focus:ring-sidebar-accent focus:border-sidebar-accent"
              />
            </div>
            <div className="flex items-center space-x-2 ml-auto"> {/* Moved column dropdown and bulk delete here */}
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
                          <label htmlFor={`column-${column.id}`} className="ml-2 cursor-pointer">
                            {column.id === 'name' ? 'API Name' : column.id}
                          </label>
                        </DropdownMenuItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {error && (
            <div className="my-4 border border-red-400 rounded bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <div className="border rounded-md overflow-hidden"> {/* Ensures rounded corners apply to table */}
            <Table>
              <TableHeader className="bg-gray-50"> {/* Added background to table header */}
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-gray-600 font-semibold"> {/* Styled table headers */}
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
                        Loading catalogs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'} className="hover:bg-gray-50"> {/* Added hover effect */}
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500">
                      No catalogs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between py-4 space-x-2">
            <Button
              className={`flex items-center gap-2 shadow-lg ${selectedCatalogs.length > 0
                ? 'border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white'
                : 'bg-gray-200 text-black cursor-not-allowed'
                }`}
              onClick={handleBulkDeleteClick}
              disabled={selectedCatalogs.length === 0 || loading}
              userRole={userData.authority}
            >
              <Trash className="h-4 w-4 mr-2" /> Delete Selected ({selectedCatalogs.length})
            </Button>
            <div className="flex items-center space-x-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="rounded-md border border-gray-300 hover:bg-gray-100"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Bulk Delete Confirmation Dialog */}
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

      {/* Nuevo Diálogo para Ver y Gestionar Controles */}
      {selectedCatalogForControls && (
        <CatalogControlsDialog
          open={showControlsDialog}
          onClose={() => {
            setShowControlsDialog(false);
            setSelectedCatalogForControls(null);
            fetchCatalogs(); // Recargar catálogos para reflejar posibles cambios en el conteo de controles
          }}
          catalog={selectedCatalogForControls}
          userRole={userData.authority}
        />
      )}
      <style jsx>{`
        .add-catalog-button {
          position: relative;
          overflow: hidden;
          /* Initial background and text color */
          border: 1px solid var(--sidebar-accent); /* Using CSS variable for consistency */
          background-color: white;
          outline-offset: -2px;
          outline: 2px solid transparent;
          outline-color: #BD0A2E;
          color: #BD0A2E;
          transition: background-color 0.4s linear; /* Transition for the button's background */
        }

        .add-catalog-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%; /* Start off-screen to the left */
          width: 100%; /* Width of the gradient */
          height: 100%;
          background: linear-gradient(to right, transparent 0%, #dc2626 50%, transparent 100%); /* Red gradient */
          transition: left 0.4s linear; /* Animate the left property */
          z-index: 1;
        }

        .add-catalog-button:hover::before {
          left: 100%; /* Slide across to the right */
        }

        .add-catalog-button:hover {
          background-color: #dc2626; /* Button turns red */
          color: white; /* Text color on hover */
          /* Add a delay to the background color change to let the gradient animation run first */
          transition: background-color 0.3s ease-in-out 0.2s; /* 0.2s delay, slightly less than gradient duration */
          color: white; /* Ensure text color changes to white on hover */
          outline: 0px solid transparent;
          outline-color: #BD0A2E;
        }

        /* Ensure text and icon are above the pseudo-element */
        .add-catalog-button > * {
          position: relative;
          z-index: 2;
        }
      `}</style>
    </Page>
  );
}
