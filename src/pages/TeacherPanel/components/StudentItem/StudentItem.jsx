import React from 'react';
import styles from './StudentItem.module.css';

const StudentItem = ({ student, isSelected, onClick, isDisabled, status }) => {
  const getStatusText = () => {
    if (status?.onlineStatus === 'online') {
      return 'Online';
    } else if (status?.lastSeen) {
      const lastSeen = new Date(status.lastSeen);
      const now = new Date();
      const diffMs = now - lastSeen;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    }
    return 'Offline';
  };

  return (
    <div 
      className={`${styles.studentItem} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
      onClick={!isDisabled ? onClick : undefined}
    >
      {status?.onlineStatus === 'online' ? (
        <div className="flex items-center">
          <span className={styles.onlineDot}></span>
          <span className="text-white flex-1">{student.name}</span>
          <span className={styles.statusText}>Online</span>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className={styles.offlineDot}></span>
            <span className="text-white flex-1">{student.name}</span>
          </div>
          <span className={styles.offlineText}>Last seen: {getStatusText()}</span>
        </div>
      )}
    </div>
  );
};

export default StudentItem;