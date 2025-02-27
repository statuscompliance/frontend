import { useState } from 'react';
import { Folder, LayoutDashboard, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data for demonstration
const mockData = [
  {
    id: 1,
    name: 'Folder 1',
    type: 'folder',
    children: [
      { id: 3, name: 'Dashboard 1', type: 'dashboard' },
      { id: 4, name: 'Dashboard 2', type: 'dashboard' },
    ],
  },
  { id: 2, name: 'Folder 2', type: 'folder', children: [] },
  { id: 5, name: 'Dashboard 3', type: 'dashboard' },
  { id: 6, name: 'Dashboard 4', type: 'dashboard' },
];

export function DashboardList({ filter, filterBy }) {
  const [expandedFolders, setExpandedFolders] = useState([]);

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  // Extract all dashboards from the hierarchy for flat view
  const extractAllDashboards = (items) => {
    let dashboards = [];
    
    items.forEach(item => {
      if (item.type === 'dashboard') {
        dashboards.push(item);
      } else if (item.type === 'folder' && item.children) {
        dashboards = [...dashboards, ...extractAllDashboards(item.children)];
      }
    });
    
    return dashboards;
  };

  const filterAndSortItems = (items, isFolderChildren = false) => {
    // For dashboards-only view, flatten the structure
    if (filterBy === 'dashboards') {
      const allDashboards = extractAllDashboards(items);
      return allDashboards
        .filter(item => item.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Normal hierarchical view for other filter options
    return items
      .filter((item) => {
        // Filter by name
        if (!item.name.toLowerCase().includes(filter.toLowerCase())) {
          return false;
        }
        
        // For folder-only view, show folders at top level and both folders and dashboards inside them
        if (filterBy === 'folders' && !isFolderChildren && item.type !== 'folder') {
          return false;
        }
        
        return true;
      })
      .sort((a, b) => {
        // Folders come first
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        // Always alphabetical sort
        return a.name.localeCompare(b.name);
      });
  };

  const renderItems = (items, level = 0, isFolderChildren = false) => {
    // If we're showing only dashboards, render them flat
    if (filterBy === 'dashboards') {
      const allDashboards = extractAllDashboards(items);
      return allDashboards
        .filter(item => item.name.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(item => (
          <div key={item.id}>
            <Button variant="icon" className="w-full justify-start bg-white hover:bg-secondary">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
          </div>
        ));
    }

    // Otherwise show hierarchical view
    return filterAndSortItems(items, isFolderChildren).map((item) => (
      <div key={item.id} style={{ marginLeft: `${level * 14}px` }}>
        {item.type === 'folder' ? (
          <div className="space-y-1">
            <Button variant="icon" className="w-full justify-start bg-white hover:bg-secondary" onClick={() => toggleFolder(item.id)}>
              {expandedFolders.includes(item.id) ? (
                <ChevronDown className="mr-2 h-4 w-4" />
              ) : (
                <ChevronRight className="mr-2 h-4 w-4" />
              )}
              <Folder className="mr-2 h-4 w-4" />
              {item.name}
            </Button>
            {expandedFolders.includes(item.id) && item.children && renderItems(item.children, level + 1, true)}
          </div>
        ) : (
          <Button variant="icon" className="w-full justify-start bg-white hover:bg-secondary">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {item.name}
          </Button>
        )}
      </div>
    ));
  };

  return <div className="space-y-1">{renderItems(mockData)}</div>;
}
