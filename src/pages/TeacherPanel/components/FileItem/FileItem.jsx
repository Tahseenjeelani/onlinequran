// src/pages/TeacherPanel/components/FileItem/FileItem.jsx
import React from 'react';
import styles from './FileItem.module.css';

const FileItem = ({ file, onShare, onDelete, isShared, onClick, showShareButton = true }) => {
  const getFileIcon = () => {
    const extension = file.name.split('.').pop().toLowerCase();
    switch(extension) {
      case 'pdf': return 'ri-file-pdf-line';
      case 'doc': case 'docx': return 'ri-file-word-line';
      case 'xls': case 'xlsx': return 'ri-file-excel-line';
      case 'jpg': case 'jpeg': case 'png': return 'ri-image-line';
      default: return 'ri-file-line';
    }
  };

  // Remove file extension from display name
  const getDisplayName = () => {
    return file.name.replace(/\.[^/.]+$/, ""); // Remove everything after the last dot
  };

  const handleFileClick = (e) => {
    if (!e.target.closest('button')) {
      onClick && onClick(file);
    }
  };

  return (
    <div 
      className={`${styles.fileItem} ${isShared ? styles.shared : ''}`}
      onClick={handleFileClick}
    >
      <div className={styles.fileContent}>
        <button 
          onClick={() => onClick && onClick(file)}
          className={styles.fileIcon}
          title="Open file"
        >
          <i className={`${getFileIcon()}`}></i>
        </button>
        <div className={styles.fileInfo}>
          <div className={styles.fileName}>
            {getDisplayName()}
          </div>
          <div className={styles.fileDetails}>
            {file.size && `${(file.size / 1024 / 1024).toFixed(1)} MB`}
            {isShared && <span className={styles.sharedIndicator}>• Shared</span>}
          </div>
        </div>
      </div>
      <div className={styles.fileActions}>
        {showShareButton && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onShare && onShare();
            }}
            className={`${styles.shareButton} ${isShared ? styles.shared : ''}`}
            title={isShared ? "Unshare from student" : "Share with student"}
          >
            <i className={`ri-${isShared ? 'share-fill' : 'share-line'}`}></i>
          </button>
        )}
        {onDelete && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete();
            }}
            className={styles.deleteButton}
            title="Delete file"
          >
            <i className="ri-delete-bin-line"></i>
          </button>
        )}
      </div>
    </div>
  );
};

export default FileItem;