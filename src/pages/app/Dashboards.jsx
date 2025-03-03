import { useState } from 'react';
import { Plus, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardList } from '@/components/dashboards/dashboard-list';
import { DashboardForm } from '@/forms/dashboard/form';
import { FolderForm } from '@/forms/folder/form';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Page from '@/components/basic-page.jsx';

export function Dashboards() {
  const [isDashboardFormOpen, setIsDashboardFormOpen] = useState(false);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [filterBy, setFilterBy] = useState('all');

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

  const handleDashboardFormSubmit = (data) => {
    // TODO: Implement dashboard creation logic
    console.log('Dashboard data:', data);
    toast.success('Your new dashboard has been successfully created.');
    setIsDashboardFormOpen(false);
  };

  const handleFolderFormSubmit = (data) => {
    // TODO: Implement folder creation logic
    console.log('Folder data:', data);
    toast.success('Your new folder has been successfully created.');
    setIsFolderFormOpen(false);
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
          <Button variant="outline" onClick={handleAddFolder}>
            <FolderPlus className="mr-2 h-4 w-4" /> Add Folder
          </Button>
          <Button className="bg-sidebar-accent text-white hover:bg-secondary hover:text-sidebar-accent border-2 border-sidebar-accent" variant="outline" onClick={handleAddDashboard}>
            <Plus className="mr-2 h-4 w-4" /> Add Dashboard
          </Button>
        </div>
      </div>
      <DashboardList filter={filter} filterBy={filterBy} />
      {isDashboardFormOpen && (
        <DashboardForm onClose={handleDashboardFormClose} onSubmit={handleDashboardFormSubmit} />
      )}
      {isFolderFormOpen && (
        <FolderForm onClose={handleFolderFormClose} onSubmit={handleFolderFormSubmit} />
      )}
    </Page>
  );
}
