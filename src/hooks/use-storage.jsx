import { useLocalStorageState } from 'ahooks';

export const useStorage = (key, ops) => useLocalStorageState(key, {
  listenStorageChange: true,
  ...ops,
});
