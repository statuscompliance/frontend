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
import { Edit, ExternalLink, CircleCheck, CircleX, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import Page from '@/pages/BasicPage.jsx';

const columnHelper = createColumnHelper();

const mockControl = {
  id: '1',
  name: 'Password Strength',
  description: 'Ensure password meets complexity requirements',
  period: 'DAILY',
  startDate: '2023-01-01',
  endDate: '2023-12-31',
  mashupId: 'abc123',
  params: { minLength: 8, requireSpecialChar: true },
  scopes: { environment: 'production', criticality: 'high' },
};

const mockEvidences = [
  { id: 'fbc4c50a-c21a-45f3-87af-27116ac8d56c', key: 'AND operation', value: [true, true], result: true },
  {
    id: '2cfd4036-22c7-4533-babf-b339f2237acb',
    key: 'url',
    value: 'https://github.com/statuscompliance/infrastructure/blob/examples/files/receipts/payment81001.pdf',
    result: true,
  },
  { id: '3', key: 'password_length', value: 10, result: true },
  { id: '4', key: 'special_char_present', value: false, result: false },
];

export function ControlDetails() {
  const params = useParams();
  const [control, setControl] = useState(null);
  const [evidences, setEvidences] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  useEffect(() => {
    // In a real application, you would fetch the control and its evidences here
    // For this example, we'll use mock data
    if (params.controlId) {
      setControl(mockControl);
      setEvidences(mockEvidences);
    }
  }, [params.controlId]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('key', {
        header: 'Key',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('value', {
        header: 'Value',
        cell: (info) => {
          const value = info.getValue();
          if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
          } else if (Array.isArray(value)) {
            return JSON.stringify(value);
          } else if (typeof value === 'string' && value.startsWith('http')) {
            return (
              <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {value}
              </a>
            );
          }
          return JSON.stringify(value);
        },
      }),
      columnHelper.accessor('result', {
        header: 'Result',
        cell: (info) => (info.getValue() ? <CircleCheck className="size-4 text-green-500" /> : <CircleX className="size-4 text-red-500" />),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: evidences,
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

  const handleEditControl = () => {
    // Implement edit functionality for control
    toast.info('Edit control functionality not implemented yet.');
  };

  const handleEditScopes = () => {
    // Implement edit functionality for scopes
    toast.info('Edit scopes functionality not implemented yet.');
  };

  if (!control) {
    return <div>Loading...</div>;
  }

  return (
    <Page className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{control.name}</CardTitle>
          <Button variant="outline" size="sm" onClick={handleEditControl}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </CardHeader>
        <CardContent className="text-left">
          <p className="text-gray-600 mb-2">{control.description}</p>
          <p className="text-sm">Period: {control.period}</p>
          <p className="text-sm">
            Duration: {format(new Date(control.startDate), 'yyyy-MM-dd')} to{' '}
            {format(new Date(control.endDate), 'yyyy-MM-dd')}
          </p>
          <p className="text-sm">Mashup ID: {control.mashupId}</p>
          <Link to={`/app/mashup/${control.mashupId}`} className="text-blue-600 hover:underline flex items-center">
            View Node-RED Flow <ExternalLink className="ml-1 h-4 w-4" />
          </Link>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Scopes</h3>
              <Button variant="outline" size="sm" onClick={handleEditScopes}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Scopes
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(control.scopes).map(([key, value]) => (
                <Badge key={key} variant="outline">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Evidences</h2>
          <div className="flex space-x-2">
            <Input
              placeholder="Search evidences..."
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
              <DropdownMenuContent>
                {table.getAllLeafColumns().map((column) => {
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

