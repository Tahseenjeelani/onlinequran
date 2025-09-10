import React from 'react';
import styles from './StudentDropdown.module.css';

const StudentDropdown = ({ students, selectedStudents, onStudentSelect, onClose, isMobile = false }) => {
  return (
    <div 
      className={`${styles.studentSelectionDropdown} ${isMobile ? styles.mobile : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      {students.map(student => (
        <div 
          key={student.id}
          className={`${styles.studentSelectionItem} ${selectedStudents.includes(student.id) ? styles.selected : ''}`}
          onClick={() => {
            onStudentSelect(student.id);
          }}
        >
          <input 
            type="checkbox" 
            className={styles.studentSelectionCheckbox} 
            checked={selectedStudents.includes(student.id)}
            readOnly
          />
          <span className="text-white">{student.name}</span>
        </div>
      ))}
    </div>
  );
};

export default StudentDropdown;