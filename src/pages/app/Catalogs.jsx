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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash, MoreHorizontal, ChevronDown } from 'lucide-react';
import { CatalogForm } from '@/forms/catalog/forms';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const mockCatalogs = [
  { id: '1', name: 'Security Controls', description: 'Basic security controls', controlsCount: 5 },
  { id: '2', name: 'Privacy Controls', description: 'Data privacy controls', controlsCount: 3 },
  { id: '3', name: 'Compliance Controls', description: 'Regulatory compliance controls', controlsCount: 7 },
  { id: '4', name: 'Operational Controls', description: 'Operational efficiency controls', controlsCount: 4 },
  { id: '5', name: 'Financial Controls', description: 'Financial risk controls', controlsCount: 6 },
  { id: '6', name: 'IT Controls', description: 'Information technology controls', controlsCount: 8 },
  { id: '7', name: 'HR Controls', description: 'Human resources controls', controlsCount: 2 },
  { id: '8', name: 'Marketing Controls', description: 'Marketing strategy controls', controlsCount: 5 },
  { id: '9', name: 'Sales Controls', description: 'Sales process controls', controlsCount: 3 },
  { id: '10', name: 'Customer Service Controls', description: 'Customer service quality controls', controlsCount: 4 },
  { id: '11', name: 'Product Controls', description: 'Product development controls', controlsCount: 7 },
  { id: '12', name: 'Supply Chain Controls', description: 'Supply chain management controls', controlsCount: 6 },
];

const columnHelper = createColumnHelper();

export function Catalogs() {
  const [catalogs, setCatalogs] = useState(mockCatalogs);
  const [editingCatalog, setEditingCatalog] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});

  const handleEdit = useCallback((catalog) => {
    setEditingCatalog(catalog);
  }, []);

  const handleDelete = useCallback(
    (id) => {
      setCatalogs(catalogs.filter((catalog) => catalog.id !== id));
      toast.success('Catalog deletion is disabled in this demo.');
    },
    [catalogs]
  );

  const handleCatalogUpdated = (updatedCatalog) => {
    setCatalogs(catalogs.map((catalog) => (catalog.id === updatedCatalog.id ? updatedCatalog : catalog)));
    setEditingCatalog(null);
    toast({
      title: 'Catalog updated',
      description: 'The catalog has been successfully updated.',
    });
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
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('controlsCount', {
        header: 'Number of Controls',
        cell: (info) => info.getValue(),
      }),
      {
        id: 'actions',
        cell: ({ row }) => {
          const catalog = row.original;
          return (
            <DropdownMenu>
              <>
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
                  <DropdownMenuItem onClick={() => handleDelete(catalog.id)}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </>
            </DropdownMenu>
          );
        },
      },
    ],
    [handleDelete, handleEdit]
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
    <div className="w-[80%] h-[70%] space-y-4">
      <div className="flex items-center justify-between">
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
                    <span className="ml-2">{column.id}</span>
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow className="text-left" key={row.id} data-state={row.getIsSelected() && 'selected'}>
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
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
      {editingCatalog && (
        <CatalogForm
          catalog={editingCatalog}
          onSuccess={handleCatalogUpdated}
          onCancel={() => setEditingCatalog(null)}
        />
      )}
    </div>
  );
}
