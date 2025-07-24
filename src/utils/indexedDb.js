/**
 * IndexedDB utility for storing mashup test results
 */

const DB_NAME = 'MashupTestsDB';
const DB_VERSION = 1;
const STORE_NAME = 'mashupTests';

class IndexedDBManager {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the IndexedDB database
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          
          // Create indices for better querying
          store.createIndex('mashupId', 'mashupId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Get all tests for a specific mashup
   * @param {string} mashupId - The mashup ID
   * @returns {Promise<Array>} Array of test results
   */
  async getTestsForMashup(mashupId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('mashupId');
      const request = index.getAll(mashupId);

      request.onsuccess = () => {
        // Sort by timestamp (newest first)
        const tests = request.result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(tests);
      };

      request.onerror = () => {
        console.error('Error getting tests for mashup:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Add a new test result
   * @param {string} mashupId - The mashup ID
   * @param {string} testId - The test ID (usually computationGroupId)
   * @param {Object} testResults - The test results object
   * @returns {Promise<void>}
   */
  async addTest(mashupId, testId, testResults) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const testRecord = {
        id: testId,
        mashupId: mashupId,
        timestamp: new Date().toISOString(),
        results: testResults
      };

      const request = store.put(testRecord);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error adding test:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete a specific test
   * @param {string} testId - The test ID to delete
   * @returns {Promise<void>}
   */
  async deleteTest(testId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(testId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error deleting test:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all tests for a specific mashup
   * @param {string} mashupId - The mashup ID
   * @returns {Promise<void>}
   */
  async clearTestsForMashup(mashupId) {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('mashupId');
      const request = index.getAllKeys(mashupId);

      request.onsuccess = () => {
        const keys = request.result;
        const deleteTransaction = this.db.transaction([STORE_NAME], 'readwrite');
        const deleteStore = deleteTransaction.objectStore(STORE_NAME);
        
        let deletedCount = 0;
        
        if (keys.length === 0) {
          resolve();
          return;
        }

        keys.forEach(key => {
          const deleteRequest = deleteStore.delete(key);
          deleteRequest.onsuccess = () => {
            deletedCount++;
            if (deletedCount === keys.length) {
              resolve();
            }
          };
          deleteRequest.onerror = () => {
            console.error('Error deleting test:', deleteRequest.error);
            reject(deleteRequest.error);
          };
        });
      };

      request.onerror = () => {
        console.error('Error getting test keys for mashup:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Clear all test data
   * @returns {Promise<void>}
   */
  async clearAllTests() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.error('Error clearing all tests:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all test data (for debugging/migration purposes)
   * @returns {Promise<Array>}
   */
  async getAllTests() {
    await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('Error getting all tests:', request.error);
        reject(request.error);
      };
    });
  }
}

// Create and export a singleton instance
const indexedDBManager = new IndexedDBManager();
export default indexedDBManager;
