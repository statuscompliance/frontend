import { useState, useMemo, useCallback } from 'react';
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
import { Edit, Trash, Plus } from 'lucide-react';
import { ScopeForm } from '@/forms/scope/form';
import { ScopeSetForm } from '@/forms/scopeSet/form';
import { CustomDialog } from '@/components/custom-dialog';
import { Badge } from '@/components/ui/badge';
import Page from '@/pages/BasicPage.jsx';

const columnHelper = createColumnHelper();

const mockScopes = [
  { id: '1', name: 'country', description: 'Country of operation', type: 'string', default: 'USA' },
  { id: '2', name: 'business_unit', description: 'Business unit', type: 'string', default: 'IT' },
  { id: '3', name: 'risk_level', description: 'Risk level', type: 'number', default: '1' },
];

const mockControls = [
  { id: '1', name: 'Password Strength' },
  { id: '2', name: 'Data Encryption' },
  { id: '3', name: 'Access Control' },
];

export function Scopes() {
  const [scopes, setScopes] = useState(mockScopes);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isAddScopeOpen, setIsAddScopeOpen] = useState(false);
  const [isAddScopeSetOpen, setIsAddScopeSetOpen] = useState(false);
  const [editingScope, setEditingScope] = useState(null);
  
  const handleEditScope = useCallback((scope) => {
    setEditingScope(scope);
    setIsAddScopeOpen(true);
  }, []);
  
  const handleDeleteScope = useCallback((id) => {
    setScopes((prevScopes) => prevScopes.filter((scope) => scope.id !== id));
    toast.success('Scope deleted successfully');
  }, []);
  
  const columns = useMemo(
    () => [
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
      }),
      columnHelper.accessor('default', {
        header: 'Default Value',
        cell: (info) => info.getValue(),
      }),
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleEditScope(row.original)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleDeleteScope(row.original.id)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [handleEditScope, handleDeleteScope]
  );

  const table = useReactTable({
    data: scopes,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleAddScope = (data) => {
    const newScope = { id: Date.now().toString(), ...data };
    setScopes([...scopes, newScope]);
    setIsAddScopeOpen(false);
    toast.success('Scope added successfully');
  };

  const handleUpdateScope = (data) => {
    setScopes(scopes.map((scope) => (scope.id === editingScope?.id ? { ...scope, ...data } : scope)));
    setIsAddScopeOpen(false);
    setEditingScope(null);
    toast.success('Scope updated successfully');
  };

  const handleAddScopeSet = (data) => {
    console.log('Scope Set added:', data);
    setIsAddScopeSetOpen(false);
    toast.success('Scope Set added successfully');
  };

  return (
    <Page className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="grid grid-cols-2 gap-4 items-start text-left">
          <div>
            <CardTitle>Scope Definitions</CardTitle>
            <CardDescription>Manage your scope definitions here.</CardDescription>
          </div>
          <div className="flex justify-end space-x-2">
            <CustomDialog
              title={editingScope ? 'Edit Scope' : 'Add New Scope'}
              description={editingScope ? 'Edit the scope details below.' : 'Enter the details for the new scope.'}
              triggerText="Add Scope"
              triggerIcon={<Plus className="mr-2 h-4 w-4" />}
              open={isAddScopeOpen}
              onOpenChange={setIsAddScopeOpen}
            >
              <ScopeForm
                onSubmit={editingScope ? handleUpdateScope : handleAddScope}
                initialValues={editingScope || undefined}
              />
            </CustomDialog>
            <CustomDialog
              title="Add New Scope Set"
              description="Link scopes to a control."
              triggerText="Add Scope Set"
              triggerIcon={<Plus className="mr-2 h-4 w-4" />}
              open={isAddScopeSetOpen}
              onOpenChange={setIsAddScopeSetOpen}
            >
              <ScopeSetForm onSubmit={handleAddScopeSet} controls={mockControls} scopes={scopes} />
            </CustomDialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center py-4">
            <Input
              placeholder="Search scopes..."
              value={globalFilter || ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
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
              <TableBody className="text-left">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}
