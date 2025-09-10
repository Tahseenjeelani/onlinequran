import React from 'react';
import styles from './FileItem.module.css';

const FileItem = ({ file, onShare, isShared, onClick }) => {
  const getFileIcon = () => {
    const extension = file.name.split('.').pop().toLowerCase();
    switch(extension) {
      case 'pdf':
        return 'ri-file-pdf-line';
      case 'doc':
      case 'docx':
        return 'ri-file-word-line';
      case 'xls':
      case 'xlsx':
        return 'ri-file-excel-line';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'ri-image-line';
      default:
        return 'ri-file-line';
    }
  };

  return (
    <div className={`${styles.fileItem} ${isShared ? styles.shared : ''}`}>
      <div className={styles.fileInfo} onClick={onClick}>
        <i className={`${getFileIcon()} ${styles.fileIcon}`}></i>
        <div>
          <div className={styles.fileName}>{file.name}</div>
          <div className={styles.fileMeta}>
            {file.size} MB • {new Date(file.uploadedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onShare();
        }}
        className={`${styles.shareButton} ${isShared ? styles.shared : ''}`}
      >
        <i className="ri-share-line"></i>
      </button>
    </div>
  );
};

export default FileItem;