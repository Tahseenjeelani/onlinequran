// src/pages/StudentPanel/components/StudentFileItem/StudentFileItem.jsx
import React from 'react';
import styles from './StudentFileItem.module.css';

const StudentFileItem = ({ file, onClick }) => {
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

  const getDisplayName = () => {
    return file.name.replace(/\.[^/.]+$/, "");
  };

  const handleFileClick = (e) => {
    if (!e.target.closest('button')) {
      onClick && onClick(file);
    }
  };

  return (
    <div 
      className={styles.fileItem}
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
        </div>
      </div>
    </div>
  );
};

export default StudentFileItem;