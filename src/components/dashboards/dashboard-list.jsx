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

export function DashboardList({ filter, sortBy }) {
  const [expandedFolders, setExpandedFolders] = useState([]);

  const toggleFolder = (folderId) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId]
    );
  };

  const filterAndSortItems = (items) => {
    return items
      .filter((item) =>
        item.name.toLowerCase().includes(filter.toLowerCase())
      )
      .sort((a, b) => {
        // Folders come first
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        // If same type, sort by name if sorting option is 'name'
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  };

  const renderItems = (items, level = 0) => {
    return filterAndSortItems(items).map((item) => (
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
            {expandedFolders.includes(item.id) && item.children && renderItems(item.children, level + 1)}
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
