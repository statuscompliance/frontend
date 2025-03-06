import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderPlus, Trash } from 'lucide-react';
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
      await dashboardsService.create(data);
      
      // Recargar datos para mostrar el nuevo dashboard
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

      // Recargar datos
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

  const handleSelectionChange = (count) => {
    setSelectedItemsCount(count);
  };

  return (
    <Page>
      <div className="flex justify-between items-center space-x-4 mb-4">
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
          <Button variant="destructive" 
            onClick={() => dashboardListRef.current?.deleteSelected()}
            disabled={loading || selectedItemsCount === 0}
            userRole={userData.authority}
          >
            <Trash className="h-4 w-4 mr-2" /> Delete
          </Button>
          <Button 
            variant="outline" 
            onClick={handleAddFolder}
            disabled={loading}
            userRole={userData.authority}
          >
            <FolderPlus className="mr-2 h-4 w-4" /> Add Folder
          </Button>
          <Button 
            className="bg-sidebar-accent text-white hover:bg-secondary hover:text-sidebar-accent border-2 border-sidebar-accent" 
            variant="outline" 
            onClick={handleAddDashboard}
            disabled={loading}
            userRole={userData.authority}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Dashboard
          </Button>
        </div>
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <DashboardList 
        ref={dashboardListRef}
        filter={filter} 
        filterBy={filterBy}
        items={items}
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
    </Page>
  );
}
