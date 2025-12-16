import React, { useState } from 'react';
import styles from './FileViewer.module.css';

const FileViewer = ({ file, isMobile = false, isFullscreen = false, onClose }) => {
  const [fitMode, setFitMode] = useState('vertical'); // 'vertical' or 'horizontal'

  const getFileType = () => {
    const extension = file.name.split('.').pop().toLowerCase();
    return extension;
  };

  const toggleFitMode = () => {
    setFitMode(fitMode === 'vertical' ? 'horizontal' : 'vertical');
  };

  const handleScreenClick = (e) => {
    if (isFullscreen) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      
      // Check if click was on the back button area (below header)
      const isBackButtonClick = 
        e.clientX < rect.left + 80 &&  // Button area width
        clickY > 50 && clickY < 90;    // Button area (50px to 90px from top)
      
      if (isBackButtonClick) {
        onClose();
      } 
      // Check if click was in view area (below back button area)
      else if (clickY >= 90) {
        // Toggle fit mode only for non-PDF files
        const fileType = getFileType();
        if (fileType !== 'pdf') {
          toggleFitMode();
        }
      }
      // Clicks in header area (0-50px) do nothing
    }
  };

  const renderFileContent = () => {
    const fileType = getFileType();
    
    switch(fileType) {
      case 'pdf':
        return (
          <iframe 
            src={file.url} 
            className={`${styles.fileFrame} ${isFullscreen ? styles.fullscreenFrame : ''}`}
            title={file.name}
          />
        );
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <img 
            src={file.url} 
            alt={file.name}
            className={`${styles.imageViewer} ${isFullscreen ? styles.fullscreenImage : ''} ${fitMode === 'horizontal' ? styles.fitHorizontal : ''}`}
          />
        );
      case 'doc':
      case 'docx':
      case 'xls':
      case 'xlsx':
        return (
          <iframe 
            src={`https://docs.google.com/gview?url=${file.url}&embedded=true`}
            className={`${styles.fileFrame} ${isFullscreen ? styles.fullscreenFrame : ''} ${fitMode === 'horizontal' ? styles.fitHorizontal : ''}`}
            title={file.name}
          />
        );
      default:
        return (
          <div className={styles.unsupportedFile}>
            <i className="ri-file-line text-4xl mb-2"></i>
            <p>This file type cannot be previewed</p>
            <p className="text-sm mt-2">File will open in external app</p>
          </div>
        );
    }
  };

  const viewerClass = `${styles.fileViewer} ${isMobile ? styles.mobile : ''} ${isFullscreen ? styles.fullscreen : ''}`;

  return (
    <div 
      className={viewerClass}
      onClick={handleScreenClick}
    >
      {/* Back button below header */}
      {isFullscreen && (
        <div className={styles.backButton}>
          ←
        </div>
      )}
      
      <div className={styles.viewerContent}>
        {renderFileContent()}
      </div>
    </div>
  );
};

export default FileViewer;