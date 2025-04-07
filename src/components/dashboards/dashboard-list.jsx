import { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from 'react';
import { Folder, LayoutDashboard, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export const DashboardList = forwardRef(({ filter, filterBy, items = [], loading, onDeleteSelected, onItemClick, onSelectionChange, userRole }, ref) => {
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  // Notificar al componente padre cuando cambia la selección
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedItems.length);
    }
  }, [selectedItems, onSelectionChange]);

  // Exponer métodos al componente padre usando ref
  useImperativeHandle(ref, () => ({
    deleteSelected: () => {
      if (selectedItems.length === 0) {
        toast.info('No items selected');
        return;
      }
      
      // Llamar a la función del componente padre para eliminar
      onDeleteSelected && onDeleteSelected(selectedItems);
      setSelectedItems([]);
    },
    get selectedCount() {
      return selectedItems.length;
    },
    // Añadir método para acceder a los elementos seleccionados directamente
    getSelectedItems: () => {
      return [...selectedItems];
    }
  }));

  const toggleFolder = (folderUid, event) => {
    // Detener la propagación para evitar que se navegue al hacer clic para expandir
    event.stopPropagation();
    
    setExpandedFolders((prev) =>
      prev.includes(folderUid)
        ? prev.filter((uid) => uid !== folderUid)
        : [...prev, folderUid]
    );
  };

  const handleSelect = (item, checked, event) => {
    // Detener la propagación para evitar que se navegue al hacer clic en el checkbox
    if (event) {
      event.stopPropagation();
    }
    
    setSelectedItems(prev =>
      checked 
        ? [...prev, item] 
        : prev.filter(selectedItem => 
          selectedItem.uid !== item.uid
        )
    );
  };

  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    }
  };

  // Procesar los elementos para crear una jerarquía visual de carpetas y dashboards
  const processedItems = useMemo(() => {
    // Aplicar filtros básicos (por tipo y texto)
    let filteredItems = [...items];
    
    if (filterBy === 'dashboards') {
      filteredItems = items.filter(item => item.type === 'dash-db');
    } else if (filterBy === 'folders') {
      filteredItems = items.filter(item => item.type === 'dash-folder');
    }

    if (filter) {
      filteredItems = filteredItems.filter(item => 
        item.title.toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Crear un mapa de todas las carpetas
    const folderMap = new Map();
    
    // Primero registrar todas las carpetas
    filteredItems.forEach(item => {
      if (item.type === 'dash-folder') {
        folderMap.set(item.uid, { 
          ...item, 
          children: [], 
          subFolders: [] 
        });
      }
    });
    
    // Estructura de árbol resultante (elementos raíz)
    const rootItems = [];
    
    // Organizar carpetas dentro de otras carpetas y dashboards dentro de carpetas
    filteredItems.forEach(item => {
      if (item.type === 'dash-folder') {
        // Si la carpeta tiene una carpeta padre
        if (item.folderUid && folderMap.has(item.folderUid)) {
          folderMap.get(item.folderUid).subFolders.push(folderMap.get(item.uid));
        } else {
          // Es una carpeta de nivel raíz
          rootItems.push(folderMap.get(item.uid));
        }
      } else if (item.type === 'dash-db') {
        // Si el dashboard pertenece a una carpeta
        if (item.folderUid && folderMap.has(item.folderUid)) {
          folderMap.get(item.folderUid).children.push(item);
        } else {
          // Dashboard que no está en ninguna carpeta
          rootItems.push(item);
        }
      }
    });

    // Ordenar los elementos: primero carpetas, luego dashboards, ambos alfabéticamente
    return rootItems.sort((a, b) => {
      if (a.type === 'dash-folder' && b.type !== 'dash-folder') return -1;
      if (a.type !== 'dash-folder' && b.type === 'dash-folder') return 1;
      return a.title.localeCompare(b.title);
    });
  }, [items, filter, filterBy]);

  // Función recursiva para renderizar carpetas y sus contenidos
  const renderFolder = (folder) => {
    const isSelected = selectedItems.some(selected => selected.uid === folder.uid);
    
    return (
      <div key={folder.uid} className="mb-1">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => handleSelect(folder, checked)}
              userRole={userRole}
            />
          </div>
          <div className="flex items-center w-full">
            {/* Icono de expansión como un div separado */}
            <div
              className="cursor-pointer p-1 rounded-md mr-2"
              onClick={(e) => toggleFolder(folder.uid, e)}
            >
              {expandedFolders.includes(folder.uid) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
            
            {/* Botón principal de la carpeta */}
            <Button 
              variant="ghost" 
              className="w-full justify-start hover:bg-secondary hover:text-primary hover:underline mr-8" 
              onClick={() => handleItemClick(folder)}
            >
              <Folder className="mr-2 h-4 w-4" />
              {folder.title}
            </Button>
          </div>
        </div>
        
        {expandedFolders.includes(folder.uid) && (
          <div className="ml-6 space-y-1 mt-1">
            {/* Renderizar subcarpetas */}
            {folder.subFolders && folder.subFolders.length > 0 && 
              folder.subFolders
                .sort((a, b) => a.title.localeCompare(b.title))
                .map(subFolder => renderFolder(subFolder))}
            
            {/* Renderizar dashboards */}
            {folder.children && folder.children.length > 0 && 
              folder.children
                .sort((a, b) => a.title.localeCompare(b.title))
                .map(dashboard => (
                  <div key={dashboard.uid} className="flex items-center space-x-2">
                    <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedItems.some(selected => selected.uid === dashboard.uid)}
                        onCheckedChange={(checked) => handleSelect(dashboard, checked)}
                        userRole={userRole}
                      />
                    </div>
                    <div className="flex items-center w-full">
                      {/* Div vacío para mantener el mismo espacio que el chevron */}
                      <div className="w-8"></div>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start hover:bg-secondary hover:text-primary hover:underline mr-8"
                        onClick={() => handleItemClick(dashboard)}
                      >
                        <LayoutDashboard className="mr-1 h-4 w-4" />
                        {dashboard.title}
                      </Button>
                    </div>
                  </div>
                ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizado principal de elementos
  const renderItems = () => {
    if (loading) {
      return <div className="py-4 text-center text-muted-foreground">Loading...</div>;
    }

    if (!items || items.length === 0) {
      return <div className="py-4 text-center text-muted-foreground">No dashboards or folders found</div>;
    }

    if (processedItems.length === 0) {
      return <div className="py-4 text-center text-muted-foreground">No items match your filter</div>;
    }

    return processedItems.map(item => {
      if (item.type === 'dash-folder') {
        return renderFolder(item);
      } else {
        // Renderizado de dashboards en el nivel raíz
        return (
          <div key={item.uid} className="flex items-center space-x-2 mb-1">
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={selectedItems.some(selected => selected.uid === item.uid)}
                onCheckedChange={(checked) => handleSelect(item, checked)}
                userRole={userRole}
              />
            </div>
            <div className="flex items-center w-full">
              {/* Div vacío para mantener el mismo espacio que el chevron */}
              <div className="w-8"></div>
              <Button 
                variant="ghost" 
                className="w-full justify-start hover:bg-secondary hover:text-primary hover:underline mr-8"
                onClick={() => handleItemClick(item)}
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {item.title}
              </Button>
            </div>
          </div>
        );
      }
    });
  };

  return (
    <div className="border rounded-md p-4">
      <div className="space-y-1">
        {renderItems()}
      </div>
    </div>
  );
});

DashboardList.displayName = 'DashboardList';
