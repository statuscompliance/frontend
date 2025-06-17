import { mockDatasources, datasourceTypes } from './mockData';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function getAllDatasources() {
  await delay(800);
  return [...mockDatasources];
}

export async function getDatasourceById(id) {
  await delay(500);
  const datasource = mockDatasources.find(ds => ds.id === id);
  if (!datasource) {
    throw new Error(`Datasource with id ${id} not found`);
  }
  return { ...datasource };
}

export async function createDatasource(datasourceData) {
  await delay(1000);
  const newDatasource = {
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    connectionStatus: 'connected',
    lastSyncTime: new Date().toISOString(),
    ...datasourceData
  };
  
  mockDatasources.push(newDatasource);
  return { ...newDatasource };
}

export async function updateDatasource(id, datasourceData) {
  await delay(800);
  const index = mockDatasources.findIndex(ds => ds.id === id);
  if (index === -1) {
    throw new Error(`Datasource with id ${id} not found`);
  }
  
  const updatedDatasource = {
    ...mockDatasources[index],
    ...datasourceData,
    updatedAt: new Date().toISOString()
  };
  
  mockDatasources[index] = updatedDatasource;
  return { ...updatedDatasource };
}

export async function deleteDatasource(id) {
  await delay(600);
  const index = mockDatasources.findIndex(ds => ds.id === id);
  if (index === -1) {
    throw new Error(`Datasource with id ${id} not found`);
  }
  
  mockDatasources.splice(index, 1);
  return { success: true };
}

export async function getDatasourceTypes() {
  await delay(500);
  return [...datasourceTypes];
}

export async function testDatasourceConnection(datasourceConfig) {
  await delay(1500);
  // Simulate random success/failure for demo purposes
  const success = Math.random() > 0.2;
  
  if (success) {
    return { 
      status: 'connected',
      message: 'Connection successful',
      details: {
        connectionTime: new Date().toISOString(),
        apiVersion: '1.0'
      }
    };
  } else {
    throw new Error('Connection failed. Please check your credentials and try again.');
  }
}
