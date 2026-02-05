// src/services/localFileService.js

class LocalFileService {
  constructor() {
    this.BASE_DIR = 'quran_app_files';
    this.PRELOADED_DIR = 'preloaded';
    this.DOWNLOADED_DIR = 'downloaded';
    this.METADATA_KEY = 'file_metadata';
    
    // Initialize storage structure
    this.initStorage();
  }

  /**
   * Initialize local storage structure
   */
  initStorage() {
    const metadata = this.getFileMetadata();
    if (!metadata) {
      // Initial structure
      const initialMetadata = {
        files: {},
        preloaded: {},
        downloaded: {},
        lastSync: Date.now()
      };
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(initialMetadata));
    }
  }

  /**
   * Get all file metadata
   */
  getFileMetadata() {
    try {
      const metadata = localStorage.getItem(this.METADATA_KEY);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('Error reading file metadata:', error);
      return null;
    }
  }

  /**
   * Update file metadata
   */
  updateFileMetadata(updates) {
    try {
      const metadata = this.getFileMetadata();
      const updatedMetadata = { ...metadata, ...updates };
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(updatedMetadata));
      return true;
    } catch (error) {
      console.error('Error updating file metadata:', error);
      return false;
    }
  }

  /**
   * Save a preloaded file (from assets/preloaded/)
   * This should be called during app initialization
   */
  registerPreloadedFile(fileName, fileData) {
    try {
      const metadata = this.getFileMetadata();
      
      // Create file entry
      const fileEntry = {
        id: `preloaded_${Date.now()}_${fileName}`,
        name: fileName,
        type: this.getFileType(fileName),
        size: fileData.size || 0,
        source: 'preloaded',
        path: `/assets/preloaded/${fileName}`,
        registeredAt: Date.now(),
        expiresAt: null // Preloaded files don't expire
      };

      // Add to metadata
      metadata.preloaded[fileEntry.id] = fileEntry;
      metadata.files[fileEntry.id] = fileEntry;
      
      this.updateFileMetadata(metadata);
      return fileEntry;
    } catch (error) {
      console.error('Error registering preloaded file:', error);
      return null;
    }
  }

  /**
   * Save a downloaded file (from teacher sharing)
   */
  async saveDownloadedFile(fileId, fileName, fileData, expiresInHours = null) {
    try {
      const metadata = this.getFileMetadata();
      
      // Generate unique filename if duplicate exists
      const uniqueName = this.getUniqueFileName(fileName);
      
      // Create file entry
      const fileEntry = {
        id: fileId,
        name: uniqueName,
        originalName: fileName,
        type: this.getFileType(fileName),
        size: fileData.size || fileData.byteLength || 0,
        source: 'downloaded',
        path: `${this.DOWNLOADED_DIR}/${uniqueName}`,
        savedAt: Date.now(),
        expiresAt: expiresInHours ? Date.now() + (expiresInHours * 60 * 60 * 1000) : null,
        url: fileData.url || null // Keep original URL for re-download if needed
      };

      // Convert fileData to Blob and store
      const blob = fileData instanceof Blob ? fileData : new Blob([fileData]);
      const fileKey = `file_${fileEntry.id}`;
      
      // Convert blob to base64 for localStorage
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
      const base64Data = await base64Promise;
      
      // Store file data
      localStorage.setItem(fileKey, base64Data);
      
      // Update metadata
      metadata.downloaded[fileEntry.id] = fileEntry;
      metadata.files[fileEntry.id] = fileEntry;
      
      this.updateFileMetadata(metadata);
      return fileEntry;
    } catch (error) {
      console.error('Error saving downloaded file:', error);
      return null;
    }
  }

  /**
   * Get a file by ID
   */
  getFile(fileId) {
    try {
      const metadata = this.getFileMetadata();
      const fileEntry = metadata.files[fileId];
      
      if (!fileEntry) return null;
      
      // Check if file is expired
      if (fileEntry.expiresAt && Date.now() > fileEntry.expiresAt) {
        this.deleteFile(fileId);
        return null;
      }
      
      // Get file data
      const fileKey = `file_${fileId}`;
      const fileData = localStorage.getItem(fileKey);
      
      if (!fileData) {
        // Data missing, remove from metadata
        this.deleteFile(fileId);
        return null;
      }
      
      return {
        ...fileEntry,
        dataUrl: fileData
      };
    } catch (error) {
      console.error('Error getting file:', error);
      return null;
    }
  }

  /**
   * Get file URL for viewing/downloading
   */
  getFileUrl(fileId) {
    const file = this.getFile(fileId);
    if (!file) return null;
    
    if (file.source === 'preloaded') {
      // For preloaded files, use relative path
      return file.path;
    } else if (file.source === 'downloaded' && file.dataUrl) {
      // For downloaded files, use data URL
      return file.dataUrl;
    }
    
    return null;
  }

  /**
   * Get all files shared with a student
   */
  getStudentFiles(studentId) {
    try {
      // This would typically check Firebase DB for shared files
      // and then check local storage for those files
      const metadata = this.getFileMetadata();
      const allFiles = Object.values(metadata.files);
      
      // Filter out expired files
      return allFiles.filter(file => 
        !file.expiresAt || Date.now() <= file.expiresAt
      );
    } catch (error) {
      console.error('Error getting student files:', error);
      return [];
    }
  }

  /**
   * Check if a file exists locally
   */
  fileExists(fileId) {
    const file = this.getFile(fileId);
    return file !== null;
  }

  /**
   * Delete a file
   */
  deleteFile(fileId) {
    try {
      const metadata = this.getFileMetadata();
      
      // Remove from metadata
      if (metadata.files[fileId]) {
        const file = metadata.files[fileId];
        
        // Remove from specific category
        if (file.source === 'preloaded' && metadata.preloaded[fileId]) {
          delete metadata.preloaded[fileId];
        } else if (file.source === 'downloaded' && metadata.downloaded[fileId]) {
          delete metadata.downloaded[fileId];
        }
        
        delete metadata.files[fileId];
      }
      
      // Remove file data
      localStorage.removeItem(`file_${fileId}`);
      
      this.updateFileMetadata(metadata);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Clean up expired files
   */
  cleanupExpiredFiles() {
    try {
      const metadata = this.getFileMetadata();
      const now = Date.now();
      let deletedCount = 0;
      
      Object.entries(metadata.downloaded).forEach(([fileId, file]) => {
        if (file.expiresAt && now > file.expiresAt) {
          this.deleteFile(fileId);
          deletedCount++;
        }
      });
      
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up expired files:', error);
      return 0;
    }
  }

  /**
   * Get storage usage
   */
  getStorageUsage() {
    try {
      let totalSize = 0;
      
      // Calculate size of all file entries
      const metadata = this.getFileMetadata();
      Object.values(metadata.files).forEach(file => {
        totalSize += file.size || 0;
      });
      
      // Calculate localStorage usage
      let lsSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        lsSize += key.length + value.length;
      }
      
      return {
        fileCount: Object.keys(metadata.files).length,
        totalFileSize: totalSize,
        localStorageSize: lsSize,
        localStorageSizeMB: (lsSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return null;
    }
  }

  /**
   * Helper: Get file type from extension
   */
  getFileType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return 'image';
    return 'other';
  }

  /**
   * Helper: Generate unique filename
   */
  getUniqueFileName(fileName) {
    const metadata = this.getFileMetadata();
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const extension = fileName.split('.').pop();
    
    let counter = 1;
    let uniqueName = fileName;
    
    // Check if filename exists in downloaded files
    while (Object.values(metadata.downloaded).some(file => file.name === uniqueName)) {
      uniqueName = `${baseName} (${counter}).${extension}`;
      counter++;
    }
    
    return uniqueName;
  }
}

// Export singleton instance
export const localFileService = new LocalFileService();