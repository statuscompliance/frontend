import { mockLinkers } from './mockData';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function getAllLinkers() {
  await delay(800);
  return [...mockLinkers];
}

export async function getLinkerById(id) {
  await delay(500);
  const linker = mockLinkers.find(l => l.id === id);
  if (!linker) {
    throw new Error(`Linker with id ${id} not found`);
  }
  return { ...linker };
}

export async function createLinker(linkerData) {
  await delay(1000);
  const newLinker = {
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
    ...linkerData
  };
  
  mockLinkers.push(newLinker);
  return { ...newLinker };
}

export async function updateLinker(id, linkerData) {
  await delay(800);
  const index = mockLinkers.findIndex(l => l.id === id);
  if (index === -1) {
    throw new Error(`Linker with id ${id} not found`);
  }
  
  const updatedLinker = {
    ...mockLinkers[index],
    ...linkerData,
    updatedAt: new Date().toISOString()
  };
  
  mockLinkers[index] = updatedLinker;
  return { ...updatedLinker };
}

export async function deleteLinker(id) {
  await delay(600);
  const index = mockLinkers.findIndex(l => l.id === id);
  if (index === -1) {
    throw new Error(`Linker with id ${id} not found`);
  }
  
  mockLinkers.splice(index, 1);
  return { success: true };
}

export async function testLinkerConnection(linkerData) {
  await delay(1500);
  // Simulate success for demo purposes
  return { 
    status: 'valid',
    message: 'Linker configuration is valid',
    details: {
      validatedAt: new Date().toISOString(),
      datasourcesConnected: linkerData.datasources.length
    }
  };
}
