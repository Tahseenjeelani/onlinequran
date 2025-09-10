import React from 'react';
import styles from './StudentItem.module.css';

const StudentItem = ({ student, isSelected, onClick, isDisabled }) => {
  return (
    <div 
      className={`${styles.studentItem} ${isSelected ? styles.selected : ''} ${isDisabled ? styles.disabled : ''}`}
      onClick={!isDisabled ? onClick : undefined}
    >
      {student.online ? (
        <div className="flex items-center">
          <span className={styles.onlineDot}></span>
          <span className="text-white">{student.name}</span>
        </div>
      ) : (
        <div className="flex flex-col">
          <span className="text-white">{student.name}</span>
          <span className={styles.offlineText}>Last seen: {student.lastSeen}</span>
        </div>
      )}
    </div>
  );
};

export default StudentItem;

