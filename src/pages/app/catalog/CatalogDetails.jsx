import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
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
import Page from '@/components/basic-page.jsx';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Edit, Trash, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getControlsByCatalogId, deleteControl } from '@/services/controls';
import { getScopeSetsByControlId } from '@/services/scopes';
import { ControlForm } from '@/components/forms/create-control';

const columnHelper = createColumnHelper();

export function CatalogDetails() {
  const params = useParams();
  const location = useLocation();
  const initialCatalogData = location.state?.catalogData || null;
  const [catalog, setCatalog] = useState(initialCatalogData);
  const [_controls, setControls] = useState([]);
  const [controlsWithScopes, setControlsWithScopes] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({
    params: false,
  });
  const [selectedControls, setSelectedControls] = useState({});
  const [loading, setLoading] = useState(true);
  const [showControlForm, setShowControlForm] = useState(false);

  useEffect(() => {
    if (params.id) {
      if (!catalog) {
        setCatalog({
          id: params.id,
          name: 'Loading catalog details...',
          description: '',
          from: '',
          to: '',
          grafanaDashboardUrl: ''
        });
      }
      fetchControls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, catalog]);

  const fetchControls = async () => {
    setLoading(true);
    try {
      const response = await getControlsByCatalogId(params.id);
      setControls(response);
      fetchScopesForControls(response);
    } catch (error) {
      console.error('Error fetching controls:', error);
      toast.error('Failed to fetch controls');
      setLoading(false);
    }
  };

  const fetchScopesForControls = async (controlsList) => {
    try {
      const controlsWithScopesData = await Promise.all(
        controlsList.map(async (control) => {
          try {
            const scopeResponse = await getScopeSetsByControlId(control.id);
            return {
              ...control,
              scopes: scopeResponse.reduce((acc, scopeSet) => {
                return { ...acc, ...scopeSet.scopes };
              }, {})
            };
          } catch (error) {
            console.error(`Error fetching scopes for control ${control.id}:`, error);
            return { ...control, scopes: {} };
          }
        })
      );
      setControlsWithScopes(controlsWithScopesData);
      setLoading(false);
    } catch (error) {
      console.error('Error processing control scopes:', error);
      setLoading(false);
    }
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
        header: 'Name',
        cell: (info) => (
          <Link
            to={`/app/catalogs/${params.id}/controls/${info.row.original.id}`}
            className="text-blue-600 hover:underline"
            state={{ 
              catalogData: catalog,
              control: info.row.original // Pasar el objeto completo del control en el estado
            }}
          >
            {typeof info.getValue() === 'string' ? info.getValue() : 'View Details'}
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
            {info.getValue() && Object.entries(info.getValue()).map(([key, value]) => (
              <Badge key={key} variant="outline">
                {key}: {JSON.stringify(value)}
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
            {info.getValue() && Object.entries(info.getValue()).map(([key, value]) => (
              <Badge key={key} variant="outline">
                {key}: {value}
              </Badge>
            ))}
          </div>
        )
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params.id, catalog],  // Añadido catalog como dependencia
  );

  const table = useReactTable({
    data: controlsWithScopes,
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

  const handleDeleteControls = async () => {
    const selectedIds = Object.keys(selectedControls);
    try {
      // Delete selected controls one by one
      await Promise.all(selectedIds.map(id => deleteControl(id)));
      toast.success(`Deleted ${selectedIds.length} controls successfully`);
      fetchControls(); // Refresh the controls list
      setSelectedControls({});
    } catch (error) {
      console.error('Error deleting controls:', error);
      toast.error('Failed to delete some controls');
    }
  };

  const handleAddControl = () => {
    setShowControlForm(true);
  };

  const handleControlFormSubmit = () => {
    setShowControlForm(false);
    fetchControls(); // Refresh controls after adding
    toast.success('Control added successfully');
  };

  const handleControlFormCancel = () => {
    setShowControlForm(false);
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
              <CardTitle>{catalog?.name || 'Loading...'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2">{catalog?.description || ''}</p>
              <p className="text-sm">
                Duration: {catalog?.startDate ? format(new Date(catalog.startDate), 'yyyy-MM-dd') : 'N/A'} to {catalog?.endDate ? format(new Date(catalog.endDate), 'yyyy-MM-dd') : 'N/A'}
              </p>
              {catalog?.dashboardId && (
                <a
                  href={`/app/dashboard/${catalog.dashboardId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View Dashboard
                </a>
              )}
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
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
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
            <Button className="bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent border-2 border-sidebar-accent" onClick={handleAddControl}>
              <Plus className="mr-2 h-4 w-4" /> Add New Control
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p>Loading controls...</p>
          </div>
        ) : (
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
        )}

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

      {showControlForm && (
        <ControlForm 
          catalogId={params.id} 
          onClose={handleControlFormCancel}
          onSuccess={handleControlFormSubmit}
        />
      )}
    </Page>
  );
}

