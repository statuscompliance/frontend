import { useState, useRef, useEffect, useCallback, useMemo } from 'react'; // Import useMemo
import { useNavigate } from 'react-router-dom';
import { Plus, FolderPlus, Trash, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardList } from '@/components/dashboards/dashboard-list';
import { DashboardForm } from '@/forms/dashboard/form';
import { FolderForm } from '@/forms/folder/form';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Page from '@/components/basic-page.jsx';
import { foldersService } from '@/services/grafana/folders';
import { dashboardsService } from '@/services/grafana/dashboards';
import { searchService } from '@/services/grafana/search';
import { useAuth } from '@/hooks/use-auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


export function Dashboards() {
  const navigate = useNavigate();
  const [isDashboardFormOpen, setIsDashboardFormOpen] = useState(false);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dashboardListRef = useRef(null);
  const [selectedItemsCount, setSelectedItemsCount] = useState(0);
  const { userData } = useAuth();
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Estados para la paginación
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10; // Número de elementos por página, igual que en Catalogs.jsx

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await searchService.search({});
        setItems(response.data || response);
        setError(null);
      } catch (err) {
        console.error('Error loading Grafana items:', err);
        setError('Error loading dashboards and folders. Please try again later.');
        toast.error('Failed to load dashboards and folders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset pageIndex when filters change
  useEffect(() => {
    setPageIndex(0);
  }, [filter, filterBy]);

  // Filtrar y buscar elementos
  const filteredAndSearchedItems = useMemo(() => {
    let filtered = items;

    // Aplicar filterBy
    if (filterBy === 'dashboards') {
      filtered = filtered.filter(item => item.type === 'dash-db');
    } else if (filterBy === 'folders') {
      filtered = filtered.filter(item => item.type === 'dash-folder');
    }

    // Aplicar filtro global (búsqueda)
    if (filter) {
      const lowerCaseFilter = filter.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(lowerCaseFilter) ||
        (item.folderTitle && item.folderTitle.toLowerCase().includes(lowerCaseFilter))
      );
    }
    return filtered;
  }, [items, filter, filterBy]);

  // Obtener los elementos para la página actual
  const paginatedItems = useMemo(() => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    return filteredAndSearchedItems.slice(start, end);
  }, [filteredAndSearchedItems, pageIndex, pageSize]);

  const totalPages = Math.ceil(filteredAndSearchedItems.length / pageSize);
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < totalPages - 1;

  const goToPreviousPage = () => {
    setPageIndex(prev => Math.max(0, prev - 1));
  };

  const goToNextPage = () => {
    setPageIndex(prev => Math.min(totalPages - 1, prev + 1));
  };


  const handleAddDashboard = () => {
    setIsDashboardFormOpen(true);
  };

  const handleAddFolder = () => {
    setIsFolderFormOpen(true);
  };

  const handleDashboardFormClose = () => {
    setIsDashboardFormOpen(false);
  };

  const handleFolderFormClose = () => {
    setIsFolderFormOpen(false);
  };

  const handleDashboardFormSubmit = async (data) => {
    try {
      setLoading(true);
      await dashboardsService.createTemplate(data);

      const searchResponse = await searchService.search({});
      setItems(searchResponse.data || searchResponse);

      toast.success('Your new dashboard has been successfully created.');
      setIsDashboardFormOpen(false);
    } catch (err) {
      console.error('Error creating dashboard:', err);
      toast.error('Failed to create dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderFormSubmit = async (data) => {
    try {
      setLoading(true);
      await foldersService.create(data);

      const searchResponse = await searchService.search({});
      setItems(searchResponse.data || searchResponse);

      toast.success('Your new folder has been successfully created.');
      setIsFolderFormOpen(false);
    } catch (err) {
      console.error('Error creating folder:', err);
      toast.error('Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async (selectedItems) => {
    try {
      setLoading(true);

      for (const item of selectedItems) {
        if (item.type === 'dash-folder') {
          await foldersService.delete(item.uid);
        } else if (item.type === 'dash-db') {
          await dashboardsService.delete(item.uid);
        }
      }

      const searchResponse = await searchService.search({});
      setItems(searchResponse.data || searchResponse);

      toast.success('Selected items have been deleted.');
    } catch (err) {
      console.error('Error deleting items:', err);
      toast.error('Failed to delete selected items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!foldersService.delete) {
      foldersService.delete = (uid) => {
        // Call the API to delete the folder
      };
    }
  }, []);

  const getFoldersForForm = () => {
    const folders = items.filter(item => item.type === 'dash-folder');

    return folders.sort((a, b) => a.title.localeCompare(b.title));
  };

  const handleItemClick = (item) => {
    if (item.type === 'dash-folder') {
      navigate(`/app/dashboards/folders/${item.uid}`);
    } else if (item.type === 'dash-db') {
      navigate(`/app/dashboards/${item.uid}`);
    }
  };

  const handleSelectionChange = useCallback((count) => {
    setSelectedItemsCount(count);
  }, []);

  const handleOpenBulkDeleteConfirm = () => {
    if (selectedItemsCount === 0) {
      toast.error('No items selected');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (dashboardListRef.current) {
      setLoading(true);
      await dashboardListRef.current.deleteSelected();
      setLoading(false);
    }
    setShowBulkDeleteConfirm(false);
  };

  return (
    <Page>
      <div className="mb-4 flex items-center justify-between space-x-4">
        <div className='flex items-center space-x-2'>
          <Input
            placeholder="Filter dashboards and folders..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm min-w-[350px]"
          />
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="dashboards">Dashboards Only</SelectItem>
              <SelectItem value="folders">Folders Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleAddFolder}
            disabled={loading}
            userRole={userData.authority}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button
            className="border-2 border-sidebar-accent bg-sidebar-accent text-white hover:bg-secondary hover:text-sidebar-accent"
            variant="outline"
            onClick={handleAddDashboard}
            disabled={loading}
            userRole={userData.authority}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Dashboard
          </Button>
        </div>
      </div>
      {error && <div className="mb-4 text-red-500">{error}</div>}

      <DashboardList
        ref={dashboardListRef}
        filter={filter}
        filterBy={filterBy}
        items={paginatedItems}
        loading={loading}
        onDeleteSelected={handleDeleteSelected}
        onItemClick={handleItemClick}
        onSelectionChange={handleSelectionChange}
        userRole={userData.authority}
      />
      {isDashboardFormOpen && (
        <DashboardForm
          onClose={handleDashboardFormClose}
          onSubmit={handleDashboardFormSubmit}
          folders={getFoldersForForm()}
        />
      )}
      {isFolderFormOpen && (
        <FolderForm
          onClose={handleFolderFormClose}
          onSubmit={handleFolderFormSubmit}
          folders={getFoldersForForm()}
        />
      )}

      {/* Botón de borrado masivo y controles de paginación */}
      <div className="flex items-center justify-between py-4 space-x-2">
        {userData.authority !== 'USER' && (
          <Button
            size="lg"
            className={`flex items-center gap-2 shadow-lg ${selectedItemsCount > 0
              ? 'bg-sidebar-accent text-white hover:bg-red-500'
              : 'bg-gray-200 text-black cursor-not-allowed'
              }`}
            onClick={handleOpenBulkDeleteConfirm}
            disabled={loading || selectedItemsCount === 0}
          >
            <Trash className="h-5 w-5" />
            Delete Selected ({selectedItemsCount})
          </Button>
        )}
        <div className="flex items-center space-x-2 ml-auto">
          <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={!canPreviousPage}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextPage} disabled={!canNextPage}>
            Next
          </Button>
        </div>
      </div>
      
      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete {selectedItemsCount} selected item{selectedItemsCount > 1 ? 's' : ''}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBulkDelete} className="bg-red-600 hover:bg-red-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete All Selected'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Page>
  );
}
