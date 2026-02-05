// SIMPLE FileViewer.jsx - Remove ALL that complexity
import React, { useState } from 'react';
import styles from './FileViewer.module.css';

const FileViewer = ({ file, isMobile = false, isFullscreen = false, onClose }) => {
  const [fitMode, setFitMode] = useState('vertical');

  // Get the file URL - SIMPLE VERSION
  const getFileUrl = () => {
    // If file has 'path' field (local file), use it
    if (file.path) {
      return file.path; // Example: "/files/6-Kalmay.pdf"
    }
    
    // If file has 'url' field (Firebase Storage), use it  
    if (file.url) {
      return file.url; // Example: "https://firebasestorage..."
    }
    
    // If neither exists, can't open file
    return null;
  };

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
    const fileUrl = getFileUrl();
    
    if (!fileUrl) {
      return <div>File not available</div>;
    }
    
    switch(fileType) {
      case 'pdf':
        return <iframe src={fileUrl} className={styles.fileFrame} title={file.name} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <img src={fileUrl} alt={file.name} className={styles.imageViewer} />;
      default:
        return <div>File type not supported</div>;
    }
  };

  return (
    <div className={styles.fileViewer} onClick={handleScreenClick}>
      {isFullscreen && <div className={styles.backButton}>←</div>}
      <div className={styles.viewerContent}>
        {renderFileContent()}
      </div>
    </div>
  );
};

export default FileViewer;