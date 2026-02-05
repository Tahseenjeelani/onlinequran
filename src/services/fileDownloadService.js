// src/services/fileDownloadService.js

import { localFileService } from './localFileService';

class FileDownloadService {
  /**
   * Download a file from URL and save locally
   */
  async downloadAndSaveFile(fileId, fileName, fileUrl, expiresInHours = null) {
    try {
      console.log(`Downloading file: ${fileName} from ${fileUrl}`);
      
      // Check if already downloaded
      if (localFileService.fileExists(fileId)) {
        console.log(`File ${fileName} already exists locally`);
        return localFileService.getFile(fileId);
      }
      
      // Download file
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Save to local storage
      const fileEntry = await localFileService.saveDownloadedFile(
        fileId, 
        fileName, 
        blob, 
        expiresInHours
      );
      
      if (fileEntry) {
        console.log(`File saved locally: ${fileName}`);
        return fileEntry;
      } else {
        throw new Error('Failed to save file locally');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      return null;
    }
  }

  /**
   * Batch download multiple files
   */
  async downloadMultipleFiles(fileList) {
    const results = [];
    
    for (const fileInfo of fileList) {
      const result = await this.downloadAndSaveFile(
        fileInfo.id,
        fileInfo.name,
        fileInfo.url,
        fileInfo.expiresInHours
      );
      results.push({
        fileId: fileInfo.id,
        success: result !== null,
        fileEntry: result
      });
    }
    
    return results;
  }

  /**
   * Check and download missing files for a student
   */
  async syncStudentFiles(studentId, sharedFilesFromFirebase) {
    try {
      const filesToDownload = [];
      
      // Compare Firebase shared files with local files
      for (const firebaseFile of sharedFilesFromFirebase) {
        if (!localFileService.fileExists(firebaseFile.id)) {
          filesToDownload.push({
            id: firebaseFile.id,
            name: firebaseFile.name,
            url: firebaseFile.url,
            expiresInHours: firebaseFile.expiresInHours
          });
        }
      }
      
      if (filesToDownload.length > 0) {
        console.log(`Downloading ${filesToDownload.length} missing files for student ${studentId}`);
        return await this.downloadMultipleFiles(filesToDownload);
      } else {
        console.log(`All files already downloaded for student ${studentId}`);
        return [];
      }
    } catch (error) {
      console.error('Error syncing student files:', error);
      return [];
    }
  }
}

// Export singleton instance
export const fileDownloadService = new FileDownloadService();