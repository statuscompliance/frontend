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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Edit, Trash, Plus, ChevronDown, Search } from 'lucide-react'; // Import Trash icon
import { ScopeForm } from '@/forms/scope/form';
import { CustomDialog } from '@/components/custom-dialog';
import { Badge } from '@/components/ui/badge';
import Page from '@/components/basic-page.jsx';
import {
  getAllScopes,
  createScope,
  updateScope,
  deleteScope
} from '@/services/scopes';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';

const columnHelper = createColumnHelper();

export function Scopes() {
  const [scopes, setScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isAddScopeOpen, setIsAddScopeOpen] = useState(false);
  const [editingScope, setEditingScope] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({
    type: false,
    default: false,
    actions: true, // Set actions to be visible by default
  });
  const [selectedScopes, setSelectedScopes] = useState({});
  const { userData } = useAuth();

  // Fetch all scopes on component mount
  useEffect(() => {
    const fetchScopes = async () => {
      try {
        const response = await getAllScopes();
        setScopes(response);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching scopes:', error);
        toast.error('Failed to fetch scopes');
        setLoading(false);
      }
    };

    fetchScopes();
  }, []);

  const handleEditScope = useCallback((scope) => {
    setEditingScope(scope);
    setIsAddScopeOpen(true);
  }, []);

  const handleDeleteScope = useCallback(async (scopeId) => {
    try {
      await deleteScope(scopeId);
      setScopes(prevScopes => prevScopes.filter(scope => scope.id !== scopeId));
      toast.success('Scope deleted successfully');
    } catch (error) {
      console.error('Error deleting scope:', error);
      toast.error('Failed to delete scope');
    }
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
        header: 'Name',
        cell: (info) => {
          const value = info.getValue();
          const newValue = value.replace(/_/g, ' ');
          return newValue ? newValue.charAt(0).toUpperCase() + newValue.slice(1) : newValue;
        },
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => (
          <Badge key={info.row.id} variant="outline">
            {info.getValue()}
          </Badge>
        ),
        meta: { hideByDefault: true },
      }),
      columnHelper.accessor('default', {
        header: 'Default Value',
        cell: (info) => info.getValue(),
        meta: { hideByDefault: true },
      }),
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEditScope(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDeleteScope(row.original.id)} userRole={userData.authority}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ),
        meta: { hideByDefault: false }, // Ensure actions column is visible
      },
    ],
    [handleEditScope, handleDeleteScope, userData.authority]
  );

  const table = useReactTable({
    data: scopes,
    columns,
    state: {
      globalFilter,
      columnVisibility,
      rowSelection: selectedScopes,
    },
    onRowSelectionChange: setSelectedScopes,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleAddScope = async (data) => {
    try {
      const response = await createScope(data);
      setScopes([...scopes, response]);
      setIsAddScopeOpen(false);
      toast.success('Scope added successfully');
    } catch (error) {
      console.error('Error adding scope:', error);
      toast.error('Failed to add scope');
    }
  };

  const handleUpdateScope = async (data) => {
    try {
      const response = await updateScope(editingScope.id, data);
      setScopes(scopes.map((scope) => (scope.id === editingScope.id ? response : scope)));
      setIsAddScopeOpen(false);
      setEditingScope(null);
      toast.success('Scope updated successfully');
    } catch (error) {
      console.error('Error updating scope:', error);
      toast.error('Failed to update scope');
    }
  };

  const handleDeleteSelectedScopes = async () => {
    try {
      const selectedRows = table.getSelectedRowModel().rows;
      const selectedScopeIds = selectedRows.map(row => row.original.id);

      for (const scopeId of selectedScopeIds) {
        await deleteScope(scopeId);
      }

      setScopes(prevScopes => prevScopes.filter(scope => !selectedScopeIds.includes(scope.id)));
      setSelectedScopes({});
      toast.success(`Deleted ${selectedScopeIds.length} scopes successfully`);
    } catch (error) {
      console.error('Error deleting scopes:', error);
      toast.error('Failed to delete some scopes');
    }
  };

  return (
    <Page className="mx-auto p-4 container space-y-6">
      <Card className="bg-white shadow-lg rounded-lg"> {/* Added shadow and rounded corners to the main card */}
        <CardHeader className="grid grid-cols-1 md:grid-cols-2 items-start gap-4 text-left border-b-2 border-gray-200 pb-4"> {/* Added border to header */}
          <div>
            <CardTitle className="text-3xl font-bold text-gray-800">Scopes</CardTitle> {/* Increased title size */}
            <CardDescription className="text-lg text-gray-700">Manage your scope definitions here.</CardDescription> {/* Increased description size */}
          </div>
          <div className="flex justify-end space-x-2">
            <CustomDialog
              classNameOverride="border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white" // Consistent button style
              title={editingScope ? 'Edit Scope' : 'Add New Scope'}
              description={editingScope ? 'Edit the scope details below.' : 'Enter the details for the new scope.'}
              triggerText="Add Scope"
              triggerIcon={<Plus className="mr-2 h-4 w-4" />}
              open={isAddScopeOpen}
              onOpenChange={(open) => {
                setIsAddScopeOpen(open);
                if (!open) {
                  setEditingScope(null); // Clear editing scope when dialog closes
                }
              }}
              userRole={userData.authority}
            >
              <ScopeForm
                onSubmit={editingScope ? handleUpdateScope : handleAddScope}
                initialValues={editingScope || undefined}
              />
            </CustomDialog>
          </div>
        </CardHeader>
        <CardContent className="p-6"> {/* Added padding to card content */}
          <div className="p-4 flex items-center justify-between gap-x-4">
            <div className="relative">
              <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search scopes..."
                value={globalFilter || ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 max-w-sm" // Styled input
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-md border border-gray-300 hover:bg-gray-100"> {/* Styled dropdown trigger */}
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
                          id={`column-${column.id}`} // Added id for accessibility
                        />
                        <label htmlFor={`column-${column.id}`} className="ml-2 cursor-pointer">{column.id}</label> {/* Added label for accessibility */}
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                      Loading...
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
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between py-4 space-x-2">
            <Button
              size="lg"
              className={`flex items-center gap-2 shadow-lg ${Object.keys(selectedScopes).length > 0
                ? 'border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white'
                : 'bg-gray-200 text-black cursor-not-allowed'
                }`}
              onClick={handleDeleteSelectedScopes}
              disabled={Object.keys(selectedScopes).length === 0 || loading}
              userRole={userData.authority}
            >
              <Trash className="h-4 w-4 mr-2" /> Delete Selected
            </Button>
          </div>
          <div className="flex items-center justify-end py-4 space-x-2">
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
        </CardContent>
      </Card>
    </Page>
  );
}
