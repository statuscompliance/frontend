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
import { ChevronDown } from 'lucide-react';

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
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue(),
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
        cell: (info) => JSON.stringify(info.getValue()),
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
        ),
      }),
    ],
    [],
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
        pageSize: 10,
      },
    },
  });

  if (!catalog) {
    return <div>Loading...</div>;
  }

  return (
    <Page name="Controls" className="container mx-auto p-4 space-y-6">
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
          <div className="flex justify-end items-start p-4">
            <Link to="/app/catalogs">
              <Button variant="outline">Back to Catalogs</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Input
            placeholder="Search controls..."
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
            <TableBody>
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

