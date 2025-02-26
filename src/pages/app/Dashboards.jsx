import { useState } from 'react';
import { Plus, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardList } from '@/components/dashboards/dashboard-list';
import { DashboardForm } from '@/forms/dashboard/form';
import { FolderForm } from '@/forms/folder/form';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Page from '@/pages/BasicPage.jsx';

export function Dashboards() {
  const [isDashboardFormOpen, setIsDashboardFormOpen] = useState(false);
  const [isFolderFormOpen, setIsFolderFormOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Dashboards</h2>
        <div className="space-x-2">
          <Button onClick={handleAddFolder}>
            <FolderPlus className="mr-2 h-4 w-4" /> Add Folder
          </Button>
          <Button onClick={handleAddDashboard}>
            <Plus className="mr-2 h-4 w-4" /> Add Dashboard
          </Button>
        </div>
      </div>
      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="Filter dashboards and folders..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="created">Date Created</SelectItem>
            <SelectItem value="modified">Date Modified</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DashboardList filter={filter} sortBy={sortBy} />
      {isDashboardFormOpen && (
        <DashboardForm onClose={handleDashboardFormClose} onSubmit={handleDashboardFormSubmit} />
      )}
      {isFolderFormOpen && (
        <FolderForm onClose={handleFolderFormClose} onSubmit={handleFolderFormSubmit} />
      )}
    </Page>
  );
}
