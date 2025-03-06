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
import { 
  ChevronDown, 
  Edit, 
  Trash, 
  Plus, 
  X, 
  CircleCheck, 
  CircleX, 
  Filter,
  Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { getControlsByCatalogId, deleteControl } from '@/services/controls';
import { getScopeSetsByControlId } from '@/services/scopes';
import { ControlForm } from '@/components/forms/create-control';
import { useAuth } from '@/hooks/use-auth';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format as formatDate } from 'date-fns';

const columnHelper = createColumnHelper();

export function CatalogDetails() {
  const params = useParams();
  const location = useLocation();
  const initialCatalogData = location.state?.catalogData || null;
  const [catalog, setCatalog] = useState(initialCatalogData);
  const [editingCatalog, setEditingCatalog] = useState(false);
  const [_controls, setControls] = useState([]);
  const [controlsWithScopes, setControlsWithScopes] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({
    params: false,
    mashupId: false,
  });
  const [selectedControls, setSelectedControls] = useState({});
  const [loading, setLoading] = useState(true);
  const [showControlForm, setShowControlForm] = useState(false);
  const { userData } = useAuth();
  
  // Nuevos estados para filtros avanzados
  const [selectedScopeKey, setSelectedScopeKey] = useState('all');
  const [selectedScopeValue, setSelectedScopeValue] = useState('all');
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);
  const [availableScopeKeys, setAvailableScopeKeys] = useState([]);
  const [availableScopeValues, setAvailableScopeValues] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

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

  useEffect(() => {
    // Extraer todas las claves y valores de scopes posibles
    if (controlsWithScopes.length > 0) {
      const scopeKeys = new Set();
      const scopeValuesByKey = {};
      
      controlsWithScopes.forEach(control => {
        if (control.scopes && Object.keys(control.scopes).length > 0) {
          Object.entries(control.scopes).forEach(([key, value]) => {
            scopeKeys.add(key);
            
            if (!scopeValuesByKey[key]) {
              scopeValuesByKey[key] = new Set();
            }
            scopeValuesByKey[key].add(value);
          });
        }
      });
      
      setAvailableScopeKeys(Array.from(scopeKeys));
      
      if (selectedScopeKey && scopeValuesByKey[selectedScopeKey]) {
        setAvailableScopeValues(Array.from(scopeValuesByKey[selectedScopeKey]));
      } else {
        setAvailableScopeValues([]);
      }
    }
  }, [controlsWithScopes, selectedScopeKey]);

  const fetchControls = async () => {
    setLoading(true);
    try {
      const response = await getControlsByCatalogId(params.id);
      response.forEach(control => control.result = control.name.includes('i'));
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

  // Función para aplicar filtros avanzados
  const applyAdvancedFilters = (data) => {
    return data.filter(control => {
      // Filtrar por scope si se seleccionó uno
      if (selectedScopeKey !== 'all' && selectedScopeValue !== 'all') {
        if (!control.scopes || 
            !control.scopes[selectedScopeKey] || 
            control.scopes[selectedScopeKey] !== selectedScopeValue) {
          return false;
        }
      }
      
      // Filtrar por fecha de inicio
      if (startDateFilter) {
        const controlStartDate = new Date(control.startDate);
        const filterDate = new Date(startDateFilter);
        if (controlStartDate < filterDate) {
          return false;
        }
      }
      
      // Filtrar por fecha de finalización (opcional)
      if (endDateFilter) {
        const controlEndDate = new Date(control.endDate);
        const filterDate = new Date(endDateFilter);
        if (controlEndDate > filterDate) {
          return false;
        }
      }
      
      return true;
    });
  };

  const filteredData = useMemo(() => {
    return applyAdvancedFilters(controlsWithScopes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlsWithScopes, selectedScopeKey, selectedScopeValue, startDateFilter, endDateFilter]);

  const handleResetFilters = () => {
    setSelectedScopeKey('all');
    setSelectedScopeValue('all');
    setStartDateFilter(null);
    setEndDateFilter(null);
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
      columnHelper.accessor('result', {
        header: 'Result',
        cell: (info) => {
          const value = info.getValue();
          return value ? <CircleCheck className="size-4 text-green-500" /> : <CircleX className="size-4 text-red-500" />
          ;
        }, //TODO: Add this info to each control
        size: 80,
      }),
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
        meta: { hideByDefault: true },
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
    data: filteredData,
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
    try {
      const selectedRows = table.getSelectedRowModel().rows;
      const selectedControlIds = selectedRows.map(row => row.original.id);
      for (const controlId of selectedControlIds) {
        await deleteControl(controlId);
      }
      await fetchControls(); 
      toast.success(`Deleted ${selectedControlIds.length} controls successfully`);
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
            <CardHeader className="flex flex-row items-center justify-start space-y-0 space-x-2 pb-2">
              <CardTitle>{catalog?.name}</CardTitle>
              <Button variant="outline" size="sm" onClick={editingCatalog ? () => setEditingCatalog(false) : handleEditCatalog} userRole={userData.authority}>
                {editingCatalog ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Edit className="h-4 w-4" />
                )}
              </Button>
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

            {/* Nuevo botón para mostrar/ocultar filtros avanzados */}
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4 space-y-4">
                <h4 className="font-medium">Filter Controls</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Scope Key</label>
                    <Select value={selectedScopeKey} onValueChange={setSelectedScopeKey}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select scope key" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        {availableScopeKeys.map(key => (
                          <SelectItem key={key} value={key}>
                            {key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Scope Value</label>
                    <Select 
                      value={selectedScopeValue} 
                      onValueChange={setSelectedScopeValue}
                      disabled={selectedScopeKey === 'all'}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select scope value" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any</SelectItem>
                        {availableScopeValues.map(value => (
                          <SelectItem key={value} value={value}>
                            {value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Start Date From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDateFilter ? formatDate(startDateFilter, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDateFilter}
                          onSelect={setStartDateFilter}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium">End Date To (Optional)</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDateFilter ? formatDate(endDateFilter, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDateFilter}
                          onSelect={setEndDateFilter}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Reset Filters
                  </Button>
                  <Button size="sm" onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              className="bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent border-sidebar-accent border-2"
              onClick={handleDeleteControls}
              disabled={Object.keys(selectedControls).length === 0}
              userRole={userData.authority}
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
            <Button className="bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent border-2 border-sidebar-accent" onClick={handleAddControl} userRole={userData.authority}>
              <Plus className="mr-2 h-4 w-4" /> Add New Control
            </Button>
          </div>
        </div>

        {/* Mostrar indicadores de filtros activos */}
        {(selectedScopeKey !== 'all' || startDateFilter || endDateFilter) && (
          <div className="flex flex-wrap gap-2 my-2">
            <div className="text-sm font-medium">Active filters:</div>
            {selectedScopeKey !== 'all' && selectedScopeValue !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedScopeKey}: {selectedScopeValue}
                <X className="h-3 w-3 cursor-pointer" onClick={() => { setSelectedScopeKey('all'); setSelectedScopeValue('all'); }} />
              </Badge>
            )}
            {startDateFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                From: {formatDate(startDateFilter, 'yyyy-MM-dd')}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setStartDateFilter(null)} />
              </Badge>
            )}
            {endDateFilter && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {formatDate(endDateFilter, 'yyyy-MM-dd')}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setEndDateFilter(null)} />
              </Badge>
            )}
          </div>
        )}

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

