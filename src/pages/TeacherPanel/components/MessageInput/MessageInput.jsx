import React, { useState } from 'react';
import StudentDropdown from '../StudentDropdown/StudentDropdown';
import styles from './MessageInput.module.css';

const MessageInput = ({ students, selectedStudents, onStudentSelect, onSend, isMobile = false }) => {
  const [message, setMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSend = () => {
    if (message.trim() && selectedStudents.length > 0) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <div className={`${styles.messageInputContainer} ${isMobile ? styles.mobile : ''}`}>
      <input 
        type="text" 
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        className={styles.messageInput} 
        placeholder="Type your message..."
      />
      <div className={styles.messageButtons}>
        <button 
          className={styles.selectButton}
          onClick={(e) => {
            e.stopPropagation();
            setShowDropdown(!showDropdown);
          }}
        >
          <i className="ri-arrow-down-s-line"></i>
        </button>
        <button 
          className={styles.sendButton}
          onClick={handleSend}
        >
          <i className="ri-send-plane-line"></i>
        </button>
      </div>
      {showDropdown && (
        <StudentDropdown
          students={students}
          selectedStudents={selectedStudents}
          onStudentSelect={(id) => {
            onStudentSelect(id);
          }}
          onClose={() => setShowDropdown(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

export default MessageInput;