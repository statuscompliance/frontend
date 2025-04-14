import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, FolderPlus, ArrowLeft, Trash } from 'lucide-react';
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
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export function FolderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [isDashboardFormOpen, setIsDashboardFormOpen] = useState(false);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const dashboardListRef = useRef(null);


  
  useEffect(() => {
    const fetchFolder = async () => {
      async function getNestedItems(folderId) {
        const items = await foldersService.getItems(folderId);
        let allItems = items || [];
        for (const item of items || []) {
          if (item.folderUid) {
            const nestedItems = await foldersService.getItems(item.uid);
            allItems = allItems.concat(nestedItems);
          }
        }
        const uniqueItems = Array.from(new Map(allItems.map(item => [item.uid, item])).values());
        return uniqueItems;
      }
      try {
        setLoading(true);
        const folderResponse = await foldersService.getById(id);
        setFolder(Array.isArray(folderResponse) ? folderResponse[0] : folderResponse);
        const itemResponses = await getNestedItems(id);
        setItems(itemResponses || []);
        setError(null);
      } catch (err) {
        console.error('Error loading folder:', err);
        setError('Failed to load folder contents');
        toast.error('Error loading folder contents');
      } finally {
        setLoading(false);
      }
    };
    
    fetchFolder();
  }, [id]);

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

  const handleBack = () => {
    navigate('/app/dashboards');
  };

  const handleDashboardFormSubmit = async (data) => {
    try {
      // Set the folder ID for the new dashboard
      const dashboardData = { ...data, folderUid: id };
      
      setLoading(true);
      await dashboardsService.create(dashboardData);
      
      // Reload items to show the new dashboard
      const searchResponse = await searchService.search({ folderUid: id });
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
      // Set the parent folder
      const folderData = { ...data, parentFolderUid: id };
      
      setLoading(true);
      await foldersService.create(folderData);
      
      const searchResponse = await searchService.search({ folderUid: id });
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

      // Reload items
      const searchResponse = await searchService.search({ folderUid: id });
      setItems(searchResponse.data || searchResponse);
      
      toast.success('Selected items have been deleted.');
    } catch (err) {
      console.error('Error deleting items:', err);
      toast.error('Failed to delete selected items');
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item) => {
    if (item.type === 'dash-folder') {
      navigate(`/app/dashboards/folders/${item.uid}`);
    } else if (item.type === 'dash-db') {
      navigate(`/app/dashboards/${item.uid}`);
    }
  };

  if (loading && !folder) {
    return (
      <Page>
        <div className="mb-6 flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Page>
    );
  }

  if (error || !folder) {
    return (
      <Page>
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboards
        </Button>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Couldn't load folder details"}
          </AlertDescription>
        </Alert>
      </Page>
    );
  }

  return (
    <Page folder={folder}>
      <div className="mb-6 flex items-center">
        <div>
          <h1 className="text-2xl font-bold">{folder.title}</h1>
          {folder.description && <p className="text-muted-foreground">{folder.description}</p>}
        </div>
      </div>

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
          <Button variant="destructive" 
            onClick={() => dashboardListRef.current?.deleteSelected()}
            disabled={loading}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
          <Button 
            variant="outline" 
            onClick={handleAddFolder}
            disabled={loading}
          >
            <FolderPlus className="mr-2 h-4 w-4" /> Add Folder
          </Button>
          <Button 
            className="border-2 border-sidebar-accent bg-sidebar-accent text-white hover:bg-secondary hover:text-sidebar-accent" 
            variant="outline" 
            onClick={handleAddDashboard}
            disabled={loading}
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
        items={items}
        loading={loading}
        onDeleteSelected={handleDeleteSelected}
        onItemClick={handleItemClick}
      />
      {isDashboardFormOpen && (
        <DashboardForm 
          onClose={handleDashboardFormClose} 
          onSubmit={handleDashboardFormSubmit} 
          defaultFolderUid={id}
        />
      )}
      {isFolderFormOpen && (
        <FolderForm 
          onClose={handleFolderFormClose} 
          onSubmit={handleFolderFormSubmit}
          defaultParentFolderUid={id}
        />
      )}
    </Page>
  );
}

export default FolderDetails;
