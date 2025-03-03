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
import { Edit, Trash, MoreHorizontal, ChevronDown, Plus, Loader2, ExternalLink } from 'lucide-react';
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
  const navigate = useNavigate();

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
    navigate('/app/catalogs/new');
  }, [navigate]);

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
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
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
              to={`/app/dashboard/${dashboardId}`} 
              className="flex items-center text-blue-600 hover:text-blue-800"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Dashboard
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
          return (
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
    [handleDeleteConfirm, handleEdit, handleRowClick]
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

  return (
    <Page name="Catalogs" className="w-full h-full">
      <div className="flex items-center justify-between gap-x-4">
        <Input
          placeholder="Search catalogs..."
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
                    <span className="ml-2">{column.id === 'dashboard_id' ? 'Dashboard' : column.id}</span>
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          className="bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent border-2 border-sidebar-accent"
          onClick={handleNew}
        >
          <Plus className="mr-2 h-4 w-4" /> Add New Catalog
        </Button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
          {error}
        </div>
      )}
      
      <div className="rounded-md border mt-4">
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
                  <div className="flex justify-center items-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
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
      
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
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
    </Page>
  );
}
