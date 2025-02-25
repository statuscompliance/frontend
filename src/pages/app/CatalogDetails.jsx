import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Page from '@/pages/BasicPage.jsx';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

const columnHelper = createColumnHelper();



const mockControls = [
  {
    id: '1',
    name: 'Password Strength',
    description: 'Ensure password meets complexity requirements',
    period: 'DAILY',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    mashupId: 'abc123',
    params: { minLength: 8, requireSpecialChar: true },
    scopes: { environment: 'production', criticality: 'high' },
  },
  {
    id: '2',
    name: 'Data Encryption',
    description: 'Verify data encryption in transit and at rest',
    period: 'WEEKLY',
    startDate: '2023-01-01',
    endDate: '2023-12-31',
    mashupId: 'def456',
    params: { algorithm: 'AES-256', keyRotationPeriod: '90days' },
    scopes: { environment: 'production', dataType: 'sensitive' },
  },
  // Add more mock controls as needed
];

export function CatalogDetails() {
  const params = useParams();
  const [catalog, setCatalog] = useState(null);
  const [controls, setControls] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({
    params: false,
  });
  const [selectedControls, setSelectedControls] = useState({});

  useEffect(() => {
    // In a real application, you would fetch the catalog and its controls here
    // For this example, we'll use mock data
    if (params.id) {
      setCatalog({
        id: params.id,
        name: 'Security Controls',
        description: 'Basic security controls',
        from: '2023-01-01',
        to: '2023-12-31',
        grafanaDashboardUrl: 'https://grafana.example.com/d/abc123/security-controls',
      });
      setControls(mockControls);
    }
  }, [params.id]);

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
        header: 'Name',
        cell: (info) => (
          <Link to={`/app/catalogs/${params.id}/controls/${info.row.original.id}`} className="text-blue-600 hover:underline">
            {info.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Description',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('period', {
        header: 'Period',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('startDate', {
        header: 'Start Date',
        cell: (info) => (info.getValue() ? format(new Date(info.getValue()), 'yyyy-MM-dd') : 'N/A'),
      }),
      columnHelper.accessor('endDate', {
        header: 'End Date',
        cell: (info) => (info.getValue() ? format(new Date(info.getValue()), 'yyyy-MM-dd') : 'N/A'),
      }),
      columnHelper.accessor('mashupId', {
        header: 'Mashup ID',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('params', {
        header: 'Parameters',
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {Object.entries(info.getValue()).map(([key, value]) => (
              <Badge key={key} variant="outline">
                {key}: {value}
              </Badge>
            ))}
          </div>
        ),
        meta: { hideByDefault: true },
      }),
      columnHelper.accessor('scopes', {
        header: 'Scopes',
        cell: (info) => (
          <div className="flex flex-wrap gap-1">
            {Object.entries(info.getValue()).map(([key, value]) => (
              <Badge key={key} variant="outline">
                {key}: {value}
              </Badge>
            ))}
          </div>
        )
      }),
    ],
    [params.id],
  );

  const table = useReactTable({
    data: controls,
    columns,
    state: {
      globalFilter,
      columnVisibility,
      rowSelection: selectedControls,
    },
    onRowSelectionChange: setSelectedControls,
    onGlobalFilterChange: setGlobalFilter,
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

  const handleEditCatalog = () => {
    // Implement edit functionality for catalog
    toast.info('Edit catalog functionality not implemented yet.');
  };

  const handleDeleteControls = () => {
    const selectedIds = Object.keys(selectedControls);
    // Implement delete functionality for selected controls
    toast.success(`Deleted ${selectedIds.length} controls`);
    setControls(controls.filter((control) => !selectedIds.includes(control.id)));
    setSelectedControls({});
  };

  if (!catalog) {
    return <div>Loading...</div>;
  }

  return (
    <Page className="container mx-auto p-4 space-y-6">
      <Card className="text-left p-4">
        <div className="grid grid-cols-2 gap-4 items-start">
          <div>
            <CardHeader>
              <CardTitle>{catalog.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">{catalog.description}</p>
              <p className="text-sm">
                Duration: {catalog.from} to {catalog.to}
              </p>
              <a
                href={catalog.grafanaDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View Grafana Dashboard
              </a>
            </CardContent>
          </div>
          <div className="flex flex-wrap p-4 justify-end space-x-2">
            <Button className="max-w-fit" variant="outline" onClick={handleEditCatalog}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Link to="/app/catalogs">
              <Button variant="outline">Back to Catalogs</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <Input
              placeholder="Search controls..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="max-w-sm"
            />
            <Button
              className="bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent border-sidebar-accent border-2"
              onClick={handleDeleteControls}
              disabled={Object.keys(selectedControls).length === 0}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
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
      </div>
    </Page>
  );
}

