import { useState, useEffect, useCallback } from 'react';
import indexedDBManager from '@/utils/indexedDb';

export function useMashupTests() {
  const [mashupTests, setMashupTests] = useState({});
  const [_isInitialized, setIsInitialized] = useState(false);

  // Initialize IndexedDB and load tests on mount
  useEffect(() => {
    const initializeDB = async () => {
      try {
        await indexedDBManager.init();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
        // Fallback to empty state if IndexedDB fails
        setIsInitialized(true);
      }
    };

    initializeDB();
  }, []);

  // Load all tests into memory for quick access
  const loadAllTestsIntoMemory = useCallback(async () => {
    try {
      const allTests = await indexedDBManager.getAllTests();
      const groupedTests = {};
      
      allTests.forEach(test => {
        if (!groupedTests[test.mashupId]) {
          groupedTests[test.mashupId] = [];
        }
        groupedTests[test.mashupId].push(test);
      });
      
      // Sort tests by timestamp (newest first) for each mashup
      Object.keys(groupedTests).forEach(mashupId => {
        groupedTests[mashupId].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      });
      
      setMashupTests(groupedTests);
    } catch (error) {
      console.error('Error loading all tests into memory:', error);
    }
  }, []);

  // Load tests when component mounts
  useEffect(() => {
    if (_isInitialized) {
      loadAllTestsIntoMemory();
    }
  }, [_isInitialized, loadAllTestsIntoMemory]);

  const addTest = useCallback(async (mashupId, computationGroupId, testResults) => {
    if (!mashupId || !computationGroupId) {
      console.error('Missing required parameters for addTest');
      return;
    }

    try {
      await indexedDBManager.addTest(mashupId, computationGroupId, testResults);
      
      // Update local state for immediate UI feedback
      setMashupTests(prev => {
        const mashupTestsList = prev[mashupId] || [];
        const newTest = {
          id: computationGroupId,
          timestamp: new Date().toISOString(),
          results: testResults
        };
        
        return {
          ...prev,
          [mashupId]: [...mashupTestsList, newTest]
        };
      });
    } catch (error) {
      console.error('Error adding test to IndexedDB:', error);
    }
  }, []);

  const getTestsForMashup = useCallback(async (mashupId) => {
    if (!mashupId) {
      return [];
    }

    try {
      const tests = await indexedDBManager.getTestsForMashup(mashupId);
      
      // Update local state with fresh data from IndexedDB
      setMashupTests(prev => ({
        ...prev,
        [mashupId]: tests
      }));
      
      return tests;
    } catch (error) {
      console.error('Error getting tests for mashup from IndexedDB:', error);
      // Return from local state as fallback
      return mashupTests[mashupId] || [];
    }
  }, [mashupTests]);

  const deleteTest = useCallback(async (mashupId, testId) => {
    if (!mashupId || !testId) {
      console.error('Missing required parameters for deleteTest');
      return;
    }

    try {
      await indexedDBManager.deleteTest(testId);
      
      // Update local state
      setMashupTests(prev => {
        const mashupTestsList = prev[mashupId] || [];
        const filteredTests = mashupTestsList.filter(test => test.id !== testId);
        
        if (filteredTests.length === 0) {
          const { [mashupId]: _, ...rest } = prev;
          return rest;
        }
        
        return {
          ...prev,
          [mashupId]: filteredTests
        };
      });
    } catch (error) {
      console.error('Error deleting test from IndexedDB:', error);
    }
  }, []);

  const clearAllTests = useCallback(async () => {
    try {
      await indexedDBManager.clearAllTests();
      setMashupTests({});
    } catch (error) {
      console.error('Error clearing all tests from IndexedDB:', error);
    }
  }, []);

  const clearTestsForMashup = useCallback(async (mashupId) => {
    if (!mashupId) {
      console.error('Missing mashupId for clearTestsForMashup');
      return;
    }

    try {
      await indexedDBManager.clearTestsForMashup(mashupId);
      
      // Update local state
      setMashupTests(prev => {
        const { [mashupId]: _, ...rest } = prev;
        return rest;
      });
    } catch (error) {
      console.error('Error clearing tests for mashup from IndexedDB:', error);
    }
  }, []);

  // Synchronous getter for immediate access (returns cached data)
  const getTestsForMashupSync = useCallback((mashupId) => {
    return mashupTests[mashupId] || [];
  }, [mashupTests]);

  return {
    addTest,
    getTestsForMashup,
    getTestsForMashupSync,
    deleteTest,
    clearAllTests,
    clearTestsForMashup
  };
}
