import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
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
import { ArrowLeft, ExternalLink, CircleCheck, CircleX, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import Page from '@/components/basic-page.jsx';
// import { getComputationsByControlIdAndDate } from '@/services/controls';

const columnHelper = createColumnHelper();

// Mock evidences if needed when we don't have real data
const mockEvidences = [
  { 
    id: 'fbc4c50a-c21a-45f3-87af-27116ac8d56c', 
    key: 'AND operation', 
    value: [true, true], 
    result: true,
    from: '2025-01-01T01:00:00',
    to: '2025-01-01T01:59:59'
  },
  {
    id: '2cfd4036-22c7-4533-babf-b339f2237acb',
    key: 'url',
    value: 'https://github.com/statuscompliance/infrastructure/blob/examples/files/receipts/payment81001.pdf',
    result: true,
    from: '2025-01-01T01:00:00',
    to: '2025-01-01T01:59:59'
  },
  { 
    id: '3', 
    key: 'password_length', 
    value: 10, 
    result: true,
    from: '2025-01-01T01:00:00',
    to: '2025-01-01T01:59:59'
  },
  { 
    id: '4', 
    key: 'special_char_present', 
    value: false, 
    result: false,
    from: '2025-01-01T01:00:00',
    to: '2025-01-01T01:59:59'
  },
];

export function ComputationDetails() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State from previous page
  const computation = location.state?.computation;
  const control = location.state?.control;
  const catalogData = location.state?.catalogData;
  
  const [evidences, setEvidences] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Formatea la fecha de la computación para usarla en breadcrumb
  const computationDate = computation?.period?.from 
    ? format(new Date(computation.period.from), 'yyyy-MM-dd') 
    : null;

  useEffect(() => {
    // If we have computation data from state
    if (computation) {
      // In a real application, you might fetch additional data here
      // For now, use the evidences from the computation or mock data
      setEvidences(mockEvidences);
      setLoading(false);
    } else if (params.controlId && params.computationId) {
      // Fallback to fetching the computation details from API
      // In a real app, you would use:
      // getComputationsByControlIdAndDate(params.controlId, params.computationId)
      //   .then(response => {
      //     setComputation(response.data);
      //     setEvidences(response.data.evidences || []);
      //     setLoading(false);
      //   })
      //   .catch(error => {
      //     console.error('Error fetching computation details:', error);
      //     setLoading(false);
      //   });
      
      // For now, using mock data
      setEvidences(mockEvidences);
      setLoading(false);
    }
  }, [params.controlId, params.computationId, computation]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('result', {
        header: 'Result',
        cell: (info) => (info.getValue() ? <CircleCheck className="size-4 text-green-500" /> : <CircleX className="size-4 text-red-500" />),
        size: 80,
      }),
      columnHelper.accessor('key', {
        header: 'Key',
        cell: (info) => info.getValue(),
        size: 150,
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
              <Link 
                to={value} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center text-blue-600 hover:underline"
              >
                Evidence link <ExternalLink className="ml-1 h-4 w-4" />
              </Link>
            );
          }
          return (
            <div className="max-w-[300px] break-words">
              {JSON.stringify(value)}
            </div>
          );
        },
        size: 300,
      }),
      columnHelper.accessor('from', {
        header: 'From',
        cell: (info) => format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm'),
        size: 120,
      }),
      columnHelper.accessor('to', {
        header: 'To',
        cell: (info) => format(new Date(info.getValue()), 'yyyy-MM-dd HH:mm'),
        size: 120,
      }),
    ],
    []
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

  const handleBack = () => {
    navigate(`/app/catalogs/${params.id}/controls/${params.controlId}`);
  };

  if (loading) {
    return (
      <Page 
        className="mx-auto p-4 container space-y-6" 
        catalogData={catalogData}
        computationDate={computationDate}
      >
        <div className="h-64 flex items-center justify-center">
          <p>Loading computation details...</p>
        </div>
      </Page>
    );
  }

  return (
    <Page 
      className="mx-auto p-4 container space-y-6" 
      catalogData={catalogData}
      computationDate={computationDate}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{control?.name}</span>
            {computation?.value ? (
              <CircleCheck className="size-5 text-green-500" />
            ) : (
              <CircleX className="size-5 text-red-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-left space-y-4">
            <div>
              <h3 className="text-base font-medium">Computation Period</h3>
              <p className="text-sm text-muted-foreground">
                From: {computation?.period?.from ? format(new Date(computation.period.from), 'yyyy-MM-dd HH:mm:ss') : 'N/A'} <br />
                To: {computation?.period?.to ? format(new Date(computation.period.to), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
              </p>
            </div>

            <div>
              <h3 className="text-base font-medium">Scopes</h3>
              <div className="mt-1 flex flex-wrap gap-2">
                {computation?.scope && Object.entries(computation.scope).map(([key, value]) => (
                  <Badge key={key} variant="outline">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
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

        <div className="overflow-x-auto border rounded-md">
          <Table className="w-full table-auto">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id}
                      className="whitespace-nowrap"
                      style={{ width: header.column.columnDef.size ? `${header.column.columnDef.size}px` : 'auto' }}
                    >
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
                      <TableCell 
                        key={cell.id}
                        className="align-top"
                        style={{ 
                          width: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : 'auto',
                          maxWidth: cell.column.columnDef.size ? `${cell.column.columnDef.size}px` : 'auto',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No evidences found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-end py-4 space-x-2">
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
