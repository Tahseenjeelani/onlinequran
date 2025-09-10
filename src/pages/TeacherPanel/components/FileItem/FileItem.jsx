// src/pages/TeacherPanel/components/FileItem/FileItem.jsx
import React from 'react';
import styles from './FileItem.module.css';

const FileItem = ({ file, onShare, onDelete, isShared, onClick }) => {
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

  return (
    <div className={`${styles.fileItem} ${file.sharedWith?.length > 0 ? styles.shared : ''}`}>
      <div className="flex items-center flex-1">
        <i className={`${getFileIcon()} text-white mr-3 text-xl`}></i>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate">{file.name}</div>
          <div className="text-gray-400 text-sm">
            {file.size && `${(file.size / 1024 / 1024).toFixed(2)} MB`}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button 
          onClick={onShare}
          className="text-blue-400 hover:text-blue-300 p-1"
          title="Share with students"
        >
          <i className="ri-share-line"></i>
        </button>
        <button 
          onClick={onDelete}
          className="text-red-400 hover:text-red-300 p-1"
          title="Delete file"
        >
          <i className="ri-delete-bin-line"></i>
        </button>
      </div>
    </div>
  );
};

export default FileItem;