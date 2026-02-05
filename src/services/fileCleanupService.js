// src/services/fileCleanupService.js

import { localFileService } from './localFileService';

class FileCleanupService {
  constructor() {
    this.cleanupInterval = null;
    this.CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
  }

  /**
   * Start automatic cleanup service
   */
  start() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Run immediately
    this.runCleanup();
    
    // Set up interval
    this.cleanupInterval = setInterval(() => {
      this.runCleanup();
    }, this.CHECK_INTERVAL);
    
    console.log('File cleanup service started');
  }

  /**
   * Stop cleanup service
   */
  stop() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('File cleanup service stopped');
    }
  }

  /**
   * Run cleanup process
   */
  runCleanup() {
    try {
      const deletedCount = localFileService.cleanupExpiredFiles();
      
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} expired files`);
        
        // Optional: Notify app about cleanup
        this.notifyCleanup(deletedCount);
      }
      
      // Check storage usage
      const usage = localFileService.getStorageUsage();
      if (usage && usage.localStorageSizeMB > 45) { // Approaching 50MB limit
        console.warn(`Local storage usage high: ${usage.localStorageSizeMB}MB`);
        this.cleanupOldestFiles();
      }
      
      return deletedCount;
    } catch (error) {
      console.error('Error in cleanup process:', error);
      return 0;
    }
  }

  /**
   * Clean up oldest files when storage is full
   */
  cleanupOldestFiles() {
    try {
      const metadata = localFileService.getFileMetadata();
      const downloadedFiles = Object.values(metadata.downloaded);
      
      // Sort by savedAt (oldest first)
      downloadedFiles.sort((a, b) => a.savedAt - b.savedAt);
      
      let freedSpace = 0;
      const targetFreeSpace = 10 * 1024 * 1024; // Aim to free 10MB
      
      for (const file of downloadedFiles) {
        if (freedSpace >= targetFreeSpace) break;
        
        localFileService.deleteFile(file.id);
        freedSpace += file.size || 0;
        console.log(`Freed space by deleting: ${file.name}`);
      }
      
      return freedSpace;
    } catch (error) {
      console.error('Error cleaning up oldest files:', error);
      return 0;
    }
  }

  /**
   * Manually clean up files older than X days
   */
  cleanupFilesOlderThan(days) {
    try {
      const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
      const metadata = localFileService.getFileMetadata();
      const downloadedFiles = Object.values(metadata.downloaded);
      
      let deletedCount = 0;
      
      downloadedFiles.forEach(file => {
        if (file.savedAt < cutoffTime) {
          localFileService.deleteFile(file.id);
          deletedCount++;
        }
      });
      
      console.log(`Cleaned up ${deletedCount} files older than ${days} days`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old files:', error);
      return 0;
    }
  }

  /**
   * Notify app about cleanup (optional - for UI updates)
   */
  notifyCleanup(deletedCount) {
    // You can dispatch an event or update a global state here
    const event = new CustomEvent('filesCleanedUp', {
      detail: { deletedCount }
    });
    window.dispatchEvent(event);
  }

  /**
   * Get cleanup statistics
   */
  getStats() {
    const metadata = localFileService.getFileMetadata();
    const downloadedFiles = Object.values(metadata.downloaded || {});
    
    const now = Date.now();
    const expiredFiles = downloadedFiles.filter(file => 
      file.expiresAt && now > file.expiresAt
    );
    
    const filesExpiringSoon = downloadedFiles.filter(file => 
      file.expiresAt && 
      file.expiresAt > now && 
      file.expiresAt < (now + 24 * 60 * 60 * 1000) // Expiring in next 24 hours
    );
    
    return {
      totalFiles: downloadedFiles.length,
      expiredFiles: expiredFiles.length,
      filesExpiringSoon: filesExpiringSoon.length,
      nextExpiration: filesExpiringSoon.length > 0 
        ? Math.min(...filesExpiringSoon.map(f => f.expiresAt))
        : null
    };
  }
}

// Export singleton instance
export const fileCleanupService = new FileCleanupService();