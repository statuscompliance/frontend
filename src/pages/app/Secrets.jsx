import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Edit, Trash, ChevronDown, Loader2, SquarePlus, LucideKeyRound, Search } from 'lucide-react';
import Page from '@/components/basic-page.jsx';
import { getAllSecrets, createSecret, updateSecret, deleteSecret } from '@/services/secrets';
import { SecretModal } from '../../components/secrets/SecretModal';
import { DeleteSecretDialog } from '../../components/secrets/DeleteSecretDialog';
import { SecretValueDialog } from '../../components/secrets/SecretValueDialog';

const columnHelper = createColumnHelper();

export function Secrets() {
  const [secrets, setSecrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [secretToDelete, setSecretToDelete] = useState(null);
  const [lastCreatedSecret, setLastCreatedSecret] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = useState({});
  const [columnVisibility, setColumnVisibility] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState(null);

  useEffect(() => {
    fetchSecrets();
  }, []);

  const fetchSecrets = async () => {
    try {
      setLoading(true);
      const response = await getAllSecrets();
      setSecrets(response);
      setError(null);
    } catch (err) {
      console.log('Error loanding secret:', err);
      setError('Failed to load secrets');
      toast.error('Failed to load secrets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!secretToDelete) return;

    try {
      setLoading(true);
      await deleteSecret(secretToDelete.id);
      setSecrets(secrets.filter((s) => s.id !== secretToDelete.id));
      toast.success('Secret deleted successfully');
    } catch (err) {
      console.log('Error deleting secret:', err);
      toast.error('Failed to delete secret');
    } finally {
      setLoading(false);
      setSecretToDelete(null);
    }
  }, [secretToDelete, secrets]);

  const handleModalSubmit = async (formData, id) => {
    try {
      let result;
      if (id) {
        result = await updateSecret(id, formData);
      } else {
        result = await createSecret(formData);
      }

      await fetchSecrets();
      setModalOpen(false);
      setEditingSecret(null);

      toast.success(id ? 'Secret updated' : 'Secret created');

      if (!id && result?.value && result?.name) {
        setLastCreatedSecret(result);
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error('A secret with this name already exists.');
      } else {
        toast.error('Failed to save secret');
      }
    }
  };

  const onEdit = (secret) => {
    setEditingSecret(secret);
    setModalOpen(true);
  };

  const onDelete = (secret) => {
    setSecretToDelete(secret);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', { header: 'Name', cell: (info) => info.getValue() }),
      columnHelper.accessor('type', { header: 'Type', cell: (info) => info.getValue() }),
      columnHelper.accessor('version', { header: 'Version', cell: (info) => info.getValue() }),
      columnHelper.accessor('createdAt', {
        header: 'Created At',
        cell: (info) => new Date(info.getValue()).toLocaleString().toLocaleString('es-ES', {
          year: '2-digit', // o 'numeric' para 2025
          month: '2-digit', // o 'short', 'long', 'numeric'
          day: '2-digit',   // o 'numeric'
        }),
      }),
      columnHelper.accessor('updatedAt', {
        header: 'Updated At',
        cell: (info) => new Date(info.getValue()).toLocaleString(),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const secret = row.original;
          return (
            <div className="flex items-center gap-2" aria-label={`Actions for ${secret.name}`}>
              <Button
                aria-label="Delete secret"
                title="Delete this secret"
                variant="ghost"
                size="icon"
                onClick={() => onEdit(secret)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                aria-label="Delete secret"
                title="Delete this secret"
                variant="ghost"
                size="icon"
                onClick={() => onDelete(secret)}>
                <Trash className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: secrets,
    columns,
    state: { globalFilter, columnVisibility, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <Page name="API Mashups" className="h-full w-full">
      <div className="flex items-center justify-between gap-x-4">
        <div className="relative">
          <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search secrets..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Toggle column visibility">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((col) => col.getCanHide()).map((col) => (
                <DropdownMenuItem key={col.id} className="capitalize">
                  <Checkbox
                    checked={col.getIsVisible()}
                    onCheckedChange={(val) => col.toggleVisibility(!!val)}
                    aria-label={`Toggle visibility for ${col.id}`}
                  />
                  <span className="ml-2">{col.id}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4 border rounded-md max-h-[600px] overflow-y-auto">
        <Table>
          <TableHeader className="text-left bg-gray-400">
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead className="text-white text-left" key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Loading secrets...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow className="text-left" key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {error || 'No secrets found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end py-4 space-x-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
        <Button
          className="border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white"
          onClick={() => setModalOpen(true)}><LucideKeyRound /> New Secret</Button>
      </div>

      <SecretModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSecret(null);
        }}
        onSubmit={handleModalSubmit}
        initialData={editingSecret}
      />
      <DeleteSecretDialog
        open={!!secretToDelete}
        onClose={() => setSecretToDelete(null)}
        onConfirm={handleDelete}
        secret={secretToDelete}
        loading={loading}
      />

      <SecretValueDialog
        open={!!lastCreatedSecret}
        onClose={() => setLastCreatedSecret(null)}
        secret={lastCreatedSecret}
      />
    </Page>
  );
}
